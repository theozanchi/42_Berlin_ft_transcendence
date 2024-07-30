import logging
import random
import string
from itertools import combinations

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import F, Sum, Window
from django.db.models.functions import Coalesce, DenseRank
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from .exceptions import InsufficientPlayersError

logging.basicConfig(
    level=logging.DEBUG, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def generate_game_id():
    while True:
        game_id = "".join(random.choices(string.ascii_letters + string.digits, k=8))
        if not Game.objects.filter(game_id=game_id).exists():
            return game_id


class UserManager(models.Manager):

    def get_user_rankings(self):
        return (
            self.annotate(
                total_score=Coalesce(Sum("participation__score"), 0),
                rank=Window(expression=DenseRank(), order_by=F("total_score").desc()),
                avatar=F("player__avatar"),
            )
            .order_by("-total_score")
            .values_list("id", "alias", "total_score", "rank", "avatar")
        )

    def get_user_ranking(self, user_id):
        rankings = list(self.get_user_rankings())
        for user in rankings:
            if user[0] == user_id:
                return {
                    "user_id": user[0],
                    "alias": user[1],
                    "total_score": user[2],
                    "rank": user[3],
                    "avatar": user[4],
                }
        return {"error": "User not found"}

    def get_by_natural_key(self, username):
        return self.get(username=username)


class Game(models.Model):
    game_id = models.CharField(
        primary_key=True,
        default=generate_game_id,
        editable=False,
        unique=True,
        max_length=8,
    )
    mode = models.CharField(
        max_length=6,
        choices=[("local", "local"), ("remote", "Remote")],
        blank=False,
        null=False,
    )
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(null=True, blank=True)
    mode_is_local = models.BooleanField(null=True, blank=True)

    winner = models.ForeignKey(
        "Player", related_name="won_games", null=True, on_delete=models.SET_NULL
    )
    host = models.CharField(max_length=255, null=True, blank=True)

    participants = models.ManyToManyField(
        User, through="Participation", related_name="tournaments"
    )

    def clean(self):
        if not self.mode:
            raise ValidationError("No valid game mode detected")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def create_players_for_game(self, data):
        try:
            players = data.get("players", [])
            for player_key, player in players.items():
                Player.objects.create(
                    game=self,
                    alias=player.get("name"),
                    channel_name=player.get("channel_name"),
                    avatar=player.get("avatar"),
                )
        except KeyError as e:
            logging.error("Error creating players: %s", e)

    def add_existing_players_to_game(self, user, channel_name):
        try:
            player_to_add = Player.objects.get(user=user)
            player_to_add.channel_name = channel_name
            player_to_add.game = self  # Add a player to the game
            player_to_add.save()
        except Player.DoesNotExist:
            logging.error("Player does not exist")

    def create_rounds(self):
        rounds = Round.objects.filter(game=self)
        rounds.delete()

        if self.players.count() < 2:
            raise InsufficientPlayersError()

        players_list = list(self.players.all())
        round_number_list = list(range(1, len(list(combinations(players_list, 2))) + 1))
        random.shuffle(round_number_list)

        for round_number, (player1, player2) in zip(round_number_list, combinations(players_list, 2)):
            round = Round(
                game=self,
                player1=player1,
                player2=player2,
                round_number=round_number,
                winner=None,
            )
            round.save()

    def calculate_scores(self):
        self.end_date = timezone.now()

        for player in self.players.all():
            player1_score = sum(Round.objects.filter(game=self, player1=player.id).values_list('player1_score', flat=True))
            player2_score = sum(Round.objects.filter(game=self, player2=player.id).values_list('player2_score', flat=True))
            score = player1_score + player2_score
            wins = Round.objects.filter(game=self, winner=player.id).count()
            player.game = None
            player.save()

            Participation.objects.create(
                tournament=self, user=player.user, score=score, rank=0
            )

        participations = Participation.objects.filter(tournament=self)
        for participation in participations:
            participation.rank = participations.filter(score__gt=participation.score).count() + 1
            participation.save()
       
        self.winner = participations.order_by('-score').first().user.player
        self.save()

        def __str__(self):
            return self.pk

    def update_scores_abandon(self, channel_name):
        rounds = self.rounds.all()
        for round in rounds:
            if round.player1.channel_name == channel_name:
                round.player1_score = 0
                round.player2_score = 0
                round.status = "completed"
                logging.debug(
                    "Player1 abandoned round %s, set score", round.round_number
                )
                round.winner = round.player2
            elif round.player2.channel_name == channel_name:
                round.player1_score = 0
                round.player2_score = 0
                round.status = "completed"
                logging.debug(
                    "Player2 abandoned round %s, set score", round.round_number
                )
                round.winner = round.player1
            round.save()


class Tournament(Game):
    pass


class Participation(models.Model):  # Binds User and Tournament classes

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    tournament = models.ForeignKey(Game, on_delete=models.CASCADE)
    score = models.IntegerField()
    rank = models.IntegerField()


class Player(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    id42 = models.IntegerField(null=True)
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    oauth_id = models.CharField(max_length=200, null=True, blank=True)
    picture_url = models.URLField(max_length=200, null=True, blank=True)
    last_login = models.DateTimeField(auto_now=True)
    last_activity = models.DateTimeField(auto_now=True)
    access_token = models.CharField(max_length=200, null=True, blank=True)
    friends = models.ManyToManyField(User, related_name="players")
    registered = models.BooleanField(default=False)

    game = models.ForeignKey(
        Game, related_name="players", on_delete=models.SET_NULL, null=True
    )
    alias = models.CharField(max_length=25, null=True, blank=True)
    channel_name = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return self.alias

    def save(self, *args, **kwargs):
        if not self.alias:
            raise ValueError("Player must have an alias.")
        if not hasattr(self, "user") or self.user is None:
            username = self.alias
            unique_username_found = False
            counter = 1
            while not unique_username_found:
                if not User.objects.filter(username=username).exists():
                    unique_username_found = True
                else:
                    username = f"{self.alias}{counter}"
                    counter += 1
            user, created = User.objects.get_or_create(username=username)
            self.user = user
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        self.avatar.delete(save=False)
        super(Player, self).delete(*args, **kwargs)


class UserProfile(Player):
    pass


User.add_to_class("rankings", UserManager())


class Round(models.Model):
    game = models.ForeignKey(Game, related_name="rounds", on_delete=models.CASCADE)
    round_number = models.PositiveIntegerField(null=True)
    status = models.CharField(
        max_length=10,
        choices=[
            ("pending", "pending"),
            ("started", "started"),
            ("completed", "completed"),
        ],
        default="pending",
    )
    player1 = models.ForeignKey(
        "Player", related_name="player1_rounds", on_delete=models.CASCADE
    )
    player2 = models.ForeignKey(
        "Player", related_name="player2_rounds", on_delete=models.CASCADE
    )
    winner = models.ForeignKey(
        "Player",
        related_name="won_rounds",
        default=None,
        null=True,
        on_delete=models.SET_NULL,
    )
    player1_score = models.PositiveIntegerField(
        default=0
    )
    player2_score = models.PositiveIntegerField(
        default=0
    )

    def clean(self):
        if self.player1 == self.player2:
            raise ValidationError("A player cannot play against themselves.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Round {self.round_number} - {self.player1} vs {self.player2}"


""" @receiver(post_save, sender=UserProfile)
@receiver(post_save, sender=Participation)
@receiver(post_save, sender=Tournament)
def update_rankings(sender, **kwargs):
    User.rankings.get_user_rankings() """
