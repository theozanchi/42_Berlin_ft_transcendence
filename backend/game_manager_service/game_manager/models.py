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

logging.basicConfig(level=logging.DEBUG)

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
        # ISSUE make sure alias is unique and send back the unique alias to the client
        players = data.get("players", [])

        for player in players:
            alias = player.get('alias')
            # make unqiue alias for player if the alias already exists in this game
            #if Player.objects.get(alias=alias, game=self):
            #    alias = player.get('alias') + ''.join(random.choices(string.digits, k=3))
            logging.debug('creating player: %s', alias)
            Player.objects.create(game=self, alias=alias, channel_name=player.get('channel_name'))

    def create_rounds(self):
        rounds = Round.objects.filter(game=self)
        rounds.delete()

        if self.players.count() < 2:
            raise InsufficientPlayersError()
        
        round_number = 1
        players_list = list(self.players.all())

        # Generate all possible matchups for league play
        for player1, player2 in combinations(players_list, 2):
            round = Round.objects.create(game=self, player1=player1, player2=player2, round_number=round_number, winner=None)
            logging.debug('round created: %s', round)
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
    

class Player(models.Model):
    ###### ISSUE:truncate name for player in case it's too long AND unique alias

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
    status = models.CharField(max_length=10, choices=[('pending', 'pending'), ('started', 'started'), ('completed', 'completed')], default='pending')
    player1 = models.ForeignKey('Player', related_name='player1_rounds', on_delete=models.CASCADE)
    player2 = models.ForeignKey('Player', related_name='player2_rounds', on_delete=models.CASCADE)
    winner = models.ForeignKey('Player', related_name='won_rounds', default=None, null=True, on_delete=models.SET_NULL)
    player1_score = models.PositiveIntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(10)])
    player2_score = models.PositiveIntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(10)])

    def clean(self):
        if self.player1 == self.player2:
            raise ValidationError("A player cannot play against themselves.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Round {self.round_number} - status: {self.status} - {self.player1} vs {self.player2} - winner: {self.winner}"

