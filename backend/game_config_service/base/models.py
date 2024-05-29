from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.core.exceptions import ValidationError
from itertools import combinations
import requests

# Create your models here.
class Game(models.Model):
    mode = models.CharField(max_length=6, choices=[('local', 'Local'), ('remote', 'Remote')])

    @classmethod
    def create(cls, mode):
        return cls.objects.create(game_mode=mode)

    def clean(self):
        if not self.mode:
            raise ValidationError('No valid game mode detected')
        if self.players.count() < 2:
            raise ValidationError('A game must have at least 2 players.')

    def save(self, *args, **kwargs):
        self.clean()  # Validate before saving
        super().save(*args, **kwargs)

    def add_players_to_game(self, data):
        player_keys = [key for key in data.keys() if key.startswith('player-')]

        for key in player_keys:
            player = Player.objects.create(game=self, alias=data.get(key))
            self.players.add(player)

    def create_rounds(self):
        self.rounds.clear()

        round_number = 1
        players_list = list(self.players.all())

        # Generate all possible matchups for league play
        for player1, player2 in combinations(players_list, 2):
            round = Round.objects.create(game=self, player1=player1, player2=player2, round_number=round_number)
            self.rounds.add(round)

        self.save()

    def initialize_round(self):
        """
        Initialize each round by making an internal API call to the game_logic service.
        """
        for round in self.rounds.all():
            response = requests.post('http://game_logic_service/api/start_game/', json={
                'player1': round.player1.alias,
                'player2': round.player2.alias
            })

            if response.status_code == 200:
                game_data = response.json()
                winner_alias = game_data.get('winner')

                if winner_alias:
                    winner = Player.objects.get(alias=winner_alias)
                    round.winner = winner
                    round.save()
            else:
                print(f"Failed to initialize game {self.pk} round {round.round_number}: {response.status_code} - {response.text}")

    def __str__(self):
        return f"Game {self.pk} - {self.get_game_mode_display()} - {self.players.count()} players"

class Player(models.Model):
    game = models.ForeignKey(Game, related_name='players', on_delete=models.CASCADE)
    alias = models.CharField(max_length=25, unique=True)
    wins = models.IntegerField()
    # socket = models.CharField(max_length=255, null=True, blank=True)  # Socket for remote player
    # username = models.CharField(max_length=255, null=True, blank=True)  # Username for logged in user

    @classmethod
    def create(cls, alias, game):
        player = cls(alias=alias, game=game)
     #   player.clean()
        player.save()
        return player
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username if self.username else self.alias

class Round(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    player1 = models.ForeignKey(Player, related_name='rounds_p1', on_delete=models.CASCADE)
    player2 = models.ForeignKey(Player, related_name='rounds_p2', on_delete=models.CASCADE)
    winner = models.ForeignKey(Player, related_name='rounds_won', null=True, blank=True, on_delete=models.SET_NULL)


    def clean(self):
        if self.player1 == self.player2:
            raise ValidationError("A player cannot play against themselves.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Round {self.pk} of {self.game.pk} - {self.player1} vs {self.player2}"
##########################################################