from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from itertools import combinations
import requests

# Create your models here.
class Game(models.Model):
    mode = models.CharField(max_length=6, choices=[('local', 'Local'), ('remote', 'Remote')])

    def clean(self):
        if not self.mode:
            raise ValidationError('No valid game mode detected')

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def add_players_to_game(self, data):
        player_names = data.get("players", [])

        for name in player_names:
            player = Player.objects.create(game=self, alias=name)

    def create_rounds(self):
        rounds = Round.objects.filter(game=self)
        rounds.delete()

        if self.players.count() < 2:
            raise ValidationError('A game must have at least 2 players.')
        
        round_number = 1
        players_list = list(self.players.all())

        # Generate all possible matchups for league play
        for player1, player2 in combinations(players_list, 2):
            round = Round.objects.create(game=self, player1=player1, player2=player2, round_number=round_number)
            round_number += 1

    def __str__(self):
        return self.pk

class Player(models.Model):
    ###### ISSUE:truncate name for player in case it's too long

    game = models.ForeignKey(Game, related_name='players', on_delete=models.CASCADE)
    alias = models.CharField(max_length=25, null=True, blank=True)

    def __str__(self):
        return self.alias

    def save(self, *args, **kwargs):
        if not self.alias:
            raise ValueError("Player must have an alias.")
        super().save(*args, **kwargs)
    
class Round(models.Model):
    game = models.ForeignKey(Game, related_name='rounds', on_delete=models.CASCADE)
    round_number = models.PositiveIntegerField(null=True) 
    player1 = models.ForeignKey('Player', related_name='player1_rounds', on_delete=models.CASCADE)
    player2 = models.ForeignKey('Player', related_name='player2_rounds', on_delete=models.CASCADE)
    winner = models.ForeignKey('Player', related_name='won_rounds', null=True, on_delete=models.SET_NULL)

    def clean(self):
        if self.player1 == self.player2:
            raise ValidationError("A player cannot play against themselves.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def initialize_round(self):
        """
        Initialize each round by making an internal API call to the game_logic service.
        """
        self.clean()

        response = requests.post('http://game_logic_service/start_game/', json={
            'player1': self.player1.guest_name,
            'player2': self.player2.guest_name,
        })

        if response.status_code == 200:
            game_data = response.json()

            players = self.game.players.all()
            self.winner = next((player for player in players if player.guest_name == game_data.get('winner')), None)
            
        else:
            print(f"Failed to initialize game {self.pk} round {self.round_number}: {response.status_code} - {response.text}")
    
    def __str__(self):
        return f"Round {self.round_number} - {self.player1} vs {self.player2}"
