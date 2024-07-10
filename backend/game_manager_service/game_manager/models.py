from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from django.contrib.auth.models import User
from itertools import combinations
import requests
import string
import random
from .exceptions import InsufficientPlayersError

def generate_game_id():
    while True:
        game_id = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
        if not Game.objects.filter(game_id=game_id).exists():
            return game_id

# Create your models here.
class Game(models.Model):
    game_id = models.CharField(primary_key=True, default=generate_game_id, editable=False, unique=True, max_length=8)   
    mode = models.CharField(max_length=6, choices=[('local', 'local'), ('remote', 'Remote')], blank=False, null=False)
    winner = models.ForeignKey('Player', related_name='won_games', null=True, on_delete=models.SET_NULL)
    host = models.CharField(max_length=255, null=True, blank=True)

    def clean(self):
        if not self.mode:
            raise ValidationError('No valid game mode detected')

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def add_players_to_game(self, data):
        players = data.get("players", [])

        for player in players:
            Player.objects.create(game=self, alias=player.get('alias'), channel_name=player.get('channel_name'))

    def create_rounds(self):
        rounds = Round.objects.filter(game=self)
        rounds.delete()

        if self.players.count() < 2:
            raise InsufficientPlayersError()
        
        round_number = 1
        players_list = list(self.players.all())

        # Generate all possible matchups for league play
        for player1, player2 in combinations(players_list, 2):
            Round.objects.create(game=self, player1=player1, player2=player2, round_number=round_number)
            round_number += 1

    def determine_winner(self):
    
        most_wins_player = None
        max_wins = 0
        
        for player in self.players.all():  # Assuming players is related name for players in Game model
            if player.won_rounds > max_wins:
                max_wins = player.won_rounds
                most_wins_player = player
        
        self.winner = most_wins_player
        self.save()

    def __str__(self):
        return self.pk
    

class Player(models.Model):
    ###### ISSUE:truncate name for player in case it's too long

    game = models.ForeignKey(Game, related_name='players', on_delete=models.CASCADE)
    alias = models.CharField(max_length=25, null=True, blank=True)
    channel_name = models.CharField(max_length=255, null=True, blank=True)

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
    player1_score = models.PositiveIntegerField(validators=[MinValueValidator(0), MaxValueValidator(10)])
    player2_score = models.PositiveIntegerField(validators=[MinValueValidator(0), MaxValueValidator(10)])

    def update_scores_abandon(self, game_id, channel_name):
        rounds = Round.objects.filter(game__game_id=game_id)
        for round in rounds:
            if round.player1.channel_name == channel_name:
                round.player1_score = 0
                round.player2_score = 0
                winner = round.player2
                round.save()
            elif round.player2.channel_name == channel_name:
                round.player1_score = 0
                round.player2_score = 0
                winner = round.player1
                round.save()

    def clean(self):
        if self.player1 == self.player2:
            raise ValidationError("A player cannot play against themselves.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Round {self.round_number} - {self.player1} vs {self.player2}"

