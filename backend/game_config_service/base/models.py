from django.db import models
from django.core.validators import MinValueValidator

# Create your models here.

class GameConfig(models.Model):
    
    GAME_TYPE_CHOICES = [
        ('single', 'Single'),
        ('tournament', 'Tournament'),
    ]

    CONNECTION_TYPE_CHOICES = [
        ('local', 'Local'),
        ('remote', 'Remote'),
    ]

    game_type = models.CharField(max_length=10, choices=GAME_TYPE_CHOICES)
    connection_type = models.CharField(max_length=10, choices=CONNECTION_TYPE_CHOICES)
    player_count = models.PositiveIntegerField(validators=[MinValueValidator(2)])
    players = models.JSONField(max_length=20)
    tree = models.JSONField(null=True, blank=True)

    def __str__(self):
        return self.id

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    def to_dict(self):
        return {
            'game_type': self.game_type,
            'player_count': self.player_count,
            'players': self.players,
            'tree': self.tree
        }

class TreeNode:
    def __init__(self, players):
        self.value = None
        self.left = None
        self.right = None
        self.generate_tournament_tree(players)

    def generate_tournament_tree(self, players):
        player_count = len(players)
        
        if player_count == 1:
            self.value = players[0]
            return

        mid = player_count // 2
        left_players = players[:mid]
        right_players = players[mid:]

        self.left = TreeNode(left_players) if left_players else None
        self.right = TreeNode(right_players) if right_players else None

    def serialize_tree(self):
        return {
            "value": self.value,
            "left": self.left.serialize_tree() if self.left else None,
            "right": self.right.serialize_tree() if self.right else None
        }

