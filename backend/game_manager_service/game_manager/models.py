from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from django.contrib.auth.models import User
from itertools import combinations
import requests
import string
import random
from .exceptions import InsufficientPlayersError
import logging
from django.dispatch import receiver
from django.db.models.signals import post_save

logging.basicConfig(
    level=logging.DEBUG, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def generate_game_id():
    while True:
        game_id = "".join(random.choices(string.ascii_letters + string.digits, k=8))
        if not Game.objects.filter(game_id=game_id).exists():
            return game_id


# Create your models here.
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

    def clean(self):
        if not self.mode:
            raise ValidationError("No valid game mode detected")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def create_players_for_game(self, data):
        players = data.get("players", [])
        for player in players:
            Player.objects.create(
                game=self,
                alias=player.get("alias"), 
                channel_name=player.get("channel_name")
            )
    
    def add_existing_players_to_game(self, data):
        user_ids = data.get("user_ids", [])
        for user_id in user_ids:
            player_to_add = Player.objects.get(user=user_id)
            player_to_add.game = self # Add a player to the game

    def create_rounds(self):
        rounds = Round.objects.filter(game=self)
        rounds.delete()

        if self.players.count() < 2:
            raise InsufficientPlayersError()

        round_number = 1
        players_list = list(self.players.all())

        # Generate all possible matchups for league play
        for player1, player2 in combinations(players_list, 2):
            round = Round.objects.create(
                game=self,
                player1=player1,
                player2=player2,
                round_number=round_number,
                winner=None,
            )
            logging.debug("round created: %s", round)
            round.save()
            round_number += 1

    def determine_winner(self):
        most_wins_player = None
        max_wins = 0

        for player in self.players.all():
            if player.won_rounds.count() > max_wins:
                max_wins = player.won_rounds.count()
                most_wins_player = player

        self.winner = most_wins_player
        self.save()

    def __str__(self):
        return self.pk

    def update_scores_abandon(self, channel_name):
        rounds = self.rounds.all()
        for round in rounds:
            if round.player1.channel_name == channel_name:
                logging.debug(
                    "Player1 abandoned round %s, set score", round.round_number
                )
                round.player1_score = 0
                round.player2_score = 0
                round.winner = round.player2
            elif round.player2.channel_name == channel_name:
                logging.debug(
                    "Player2 abandoned round %s, set score", round.round_number
                )
                round.player1_score = 0
                round.player2_score = 0
                round.winner = round.player1
            round.save()


class Player(models.Model):
    ###### ISSUE:truncate name for player in case it's too long AND unique alias
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    id42 = models.IntegerField(null=True)
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    oauth_id = models.CharField(max_length=200, null=True, blank=True)
    picture_url = models.URLField(max_length=200, null=True, blank=True)
    last_login = models.DateTimeField(auto_now=True)
    last_activity = models.DateTimeField(auto_now=True)
    access_token = models.CharField(max_length=200, null=True, blank=True)
    friends = models.ManyToManyField(User, related_name="userprofiles")

    game = models.ForeignKey(Game, related_name="players")
    alias = models.CharField(max_length=25, null=True, blank=True)
    channel_name = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return self.alias

    def save(self, *args, **kwargs):
        if not self.alias:
            raise ValueError("Player must have an alias.")
        if not hasattr(self, 'user') or self.user is None:
            # Check if a User with the desired username already exists
            username = self.alias
            unique_username_found = False
            counter = 1
            while not unique_username_found:
                if not User.objects.filter(username=username).exists():
                    unique_username_found = True
                else:
                    # If the username exists, append a number to make it unique
                    username = f"{self.alias}{counter}"
                    counter += 1
            # Create the User with the unique username
            user, created = User.objects.get_or_create(username=username)
            self.user = user
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        self.avatar.delete(save=False)
        super(Player, self).delete(*args, **kwargs)



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
        default=0, validators=[MinValueValidator(0), MaxValueValidator(10)]
    )
    player2_score = models.PositiveIntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(10)]
    )

    def clean(self):
        if self.player1 == self.player2:
            raise ValidationError("A player cannot play against themselves.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Round {self.round_number} - status: {self.status} - {self.player1} vs {self.player2} - winner: {self.winner}"
