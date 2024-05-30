from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.core.exceptions import ValidationError
from itertools import combinations
import requests

# Create your models here.
class Game(models.Model):
    mode = models.CharField(max_length=6, choices=[('local', 'Local'), ('remote', 'Remote')])
    #players = models.ForeignKey(Player, default=none, related_name='players', on_delete=models.CASCADE)
    
    # host = 
    def clean(self):
        if not self.mode:
            raise ValidationError('No valid game mode detected')

    def save(self, *args, **kwargs):
        self.clean()  # Validate before saving
        super().save(*args, **kwargs)

    def add_players_to_game(self, data):
        player_keys = [key for key in data.keys() if key.startswith('player-')]

        for key in player_keys:
            player = Player.objects.create(game=self, alias=data.get(key))

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
        return f"Game {self.pk} - {self.get_game_mode_display()} - {self.players.count()} players"

class Player(models.Model):
    game = models.ForeignKey(Game, related_name='players', on_delete=models.CASCADE)
    alias = models.CharField(max_length=25)
    # socket = models.CharField(max_length=255, null=True, blank=True)  # Socket for remote player
    # user = models.ForeignKey(User)  # Username for logged in user
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.alias
    
class Round(models.Model):
    game = models.ForeignKey(Game, related_name='rounds', on_delete=models.CASCADE)
    round_number = models.PositiveIntegerField(null=True) 
    player1 = models.CharField(max_length=15)
    player2 = models.CharField(max_length=15)
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

        response = requests.post('http://game_logic_service/api/start_game/', json={
            'player1': self.player1.alias,
            'player2': self.player2.alias
        })

        if response.status_code == 200:
            game_data = response.json()

            players = self.game.players.all()
            self.winner = next((player for player in players if player.alias == game_data.get('winner')), None)
            
        else:
            print(f"Failed to initialize game {self.pk} round {self.round_number}: {response.status_code} - {response.text}")
    
    def __str__(self):
        return f"Round {self.pk} of {self.game.pk} - {self.player1} vs {self.player2}"

