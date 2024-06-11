from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from itertools import combinations
import requests
from django.contrib.auth.models import User, AbstractUser

#class User(AbstractUser):
#    hosted_lobbies = models.ManyToManyField('Lobby', related_name='host', blank=True)
#    joined_lobbies = models.ManyToManyField('Lobby', related_name='players', blank=True)

class Lobby(models.Model):
    lobby_id = models.CharField(max_length=15, primary_key=True, unique=True, editable=False)
    #host = models.ForeignKey(User, related_name='hosted_lobbies', on_delete=models.CASCADE)
    host = models.CharField(max_length=25)
    max_players = models.IntegerField(default=24)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Lobby {self.lobby_id} - Hosted by {self.host.username} - Amount of players: {self.players.count()}"

    def is_full(self):
        return self.players.count() >= self.max_players
    
class Player(models.Model):
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE)
    guest_name = models.CharField(max_length=255, null=True, blank=True)
    lobby = models.ForeignKey(Lobby, related_name='players', on_delete=models.CASCADE)
    ws_id = models.CharField(max_length=100, blank=True, null=True)

    @property
    def display_name(self):
        if self.guest_name:
            return self.guest_name
        elif self.user:
            return self.user.username
        return "Unknown"
    
    def __str__(self):
        if self.user:
            return self.user.username
        return self.guest_name

    def save(self, *args, **kwargs):
        if not self.user and not self.guest_name:
            raise ValueError("Player must have either a user or a guest name.")
        super().save(*args, **kwargs)