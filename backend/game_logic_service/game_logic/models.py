from django.db import models

# Create your models here.
class GamePosition(models.Model):
    player1_x = models.FloatField()
    player1_y = models.FloatField()
    player1_z = models.FloatField()
    player1_ws_id = models.CharField(max_length=100, blank=True, null=True)
    
    player2_x = models.FloatField()
    player2_y = models.FloatField()
    player2_z = models.FloatField()
    player2_ws_id = models.CharField(max_length=100, blank=True, null=True)
    
    ball_x = models.FloatField()
    ball_y = models.FloatField()
    ball_z = models.FloatField()
    
    timestamp = models.DateTimeField(auto_now_add=True)
