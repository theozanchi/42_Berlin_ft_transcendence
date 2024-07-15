from .models import Game, Player, Round
from django.core import serializers
from rest_framework import serializers

class RoundSerializer(serializers.ModelSerializer):
    player1 = serializers.CharField(source='player1.alias')
    player1_channel_name = serializers.CharField(source='player1.channel_name')

    player2 = serializers.CharField(source='player2.alias')
    player2_channel_name = serializers.CharField(source='player2.channel_name')

    winner = serializers.SerializerMethodField()

    def get_winner(self, obj):
        if obj.winner and hasattr(obj.winner, 'alias'):
            return obj.winner.alias
        else:
            return None

    class Meta:
        model = Round
        fields = ['round_number', 'status', 'player1', 'player2', 'winner', 'player1_score', 'player2_score', 'player1_channel_name', 'player2_channel_name']

class GameSerializer(serializers.ModelSerializer):
    rounds = RoundSerializer(many=True, read_only=True)
    players = serializers.SlugRelatedField(slug_field='alias', many=True, queryset=Player.objects.all())
    winner = serializers.SerializerMethodField()

    def get_winner(self, obj):
        if obj.winner and hasattr(obj.winner, 'alias'):
            return obj.winner.alias
        else:
            return None

    class Meta:
        model = Game
        fields = ['game_id', 'mode', 'winner', 'rounds', 'players', 'host']
