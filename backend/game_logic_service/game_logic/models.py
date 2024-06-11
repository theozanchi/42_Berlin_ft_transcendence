from django.db import models

# Create your models here.

# ISSUE: Add max/min pos for xyz
class Player(models.Model):
    pos = models.JSONField()
    ws_id = models.CharField(max_length=100, blank=True, null=True)
    points = models.IntegerField()

class GamePosition(models.Model):
    player1 = models.OneToOneField(Player, related_name="is_player_1")
    player2 = models.OneToOneField(Player, related_name="is_player_2")
    ball_pos = models.JSONField()

    timestamp = models.DateTimeField(auto_now_add=True)
