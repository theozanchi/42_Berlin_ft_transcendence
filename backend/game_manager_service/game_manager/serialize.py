from django.core import serializers
from rest_framework import serializers
from .models import Game, Player, Round


class PlayerSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='alias')
    avatar = serializers.CharField(source='avatar.name')
    user_id = serializers.IntegerField()
    channel_name = serializers.CharField()

    class Meta:
        model = Player
        fields = ['name', 'avatar', 'user_id', 'channel_name']

class RoundSerializer(serializers.ModelSerializer):
    player1 = PlayerSerializer()

    player2 = PlayerSerializer()

    winner = PlayerSerializer()

    class Meta:
        model = Round
        fields = [
            "round_number",
            "status",
            "player1",
            "player2",
            "winner",
            "player1_score",
            "player2_score",
        ]

class GameSerializer(serializers.ModelSerializer):
    rounds = RoundSerializer(many=True, read_only=True)
    players = PlayerSerializer(many=True, read_only=True)
    winner = serializers.SerializerMethodField()
    users = serializers.SerializerMethodField()

    def get_winner(self, obj):
        if obj.winner and hasattr(obj.winner, "alias"):
            return obj.winner.alias
        else:
            return None

    def get_users(self, obj):
        players_info = []
        for player in obj.players.all().order_by('last_activity'):
            players_info.append(
                {
                    "alias": player.alias,
                    "username": player.user.username,
                    "user_id": player.user_id,
                    "avatar": player.avatar.name,
                }
            )
        return players_info

    class Meta:
        model = Game
        fields = ["game_id", "mode", "winner", "rounds", "players", "host", "users"]  

