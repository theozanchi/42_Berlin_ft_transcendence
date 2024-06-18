from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from itertools import combinations
import requests

# Create your models here.
class Game(models.Model):
    game_id = models.AutoField(primary_key=True)
    mode = models.CharField(max_length=6, choices=[('local', 'Local'), ('remote', 'Remote')])
    winner = models.ForeignKey('Player', related_name='won_games', null=True, on_delete=models.SET_NULL)

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

    def update_round_status(self, data):
        winner = data.get('winner')
        round_number = data.get('round_number')

        if round_number is not None and winner:
                try:
                    round = Round.objects.get(game=self, round_number=round_number)
                    round.winner = Player.objects.get(game=self, alias=winner)
                    round.save()
                except Round.DoesNotExist:
                    print(f"No round found for game {self.pk} with round number {round_number}")
                except Player.DoesNotExist:
                    print(f"No player found for game {self.pk} with alias {self.pk}")
        else:
            raise ValidationError("Invalid data provided for game update.")
        
        if round_number == self.rounds.count():
            self.winner = Player.objects.get(game=self, alias=winner)
            self.save()

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
    player1_score = models.PositiveIntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(10)])
    player2_score = models.PositiveIntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(10)])

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

        response = requests.post('http://game_logic_service/play_game/', json={
            'player1': self.player1.alias,
            'player2': self.player2.alias,
            'game_id': self.game.pk,
        })

        if response.status_code == 200:
            game_data = response.json()

            self.player1_score = game_data.get('player1_score')
            self.player2_score = game_data.get('player2_score')

            players = self.game.players.all()
            self.winner = next((player for player in players if player.alias == game_data.get('winner')), None)
            
        else:
            print(f"Failed to initialize game {self.pk} round {self.round_number}: {response.status_code} - {response.text}")
    
    def __str__(self):
        return f"Round {self.round_number} - {self.player1} vs {self.player2}"

