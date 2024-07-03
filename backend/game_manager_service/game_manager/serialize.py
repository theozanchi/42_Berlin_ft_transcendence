from .models import Game, Player, Round
from django.core import serializers
from rest_framework import serializers

class RoundSerializer(serializers.ModelSerializer):
    player1 = serializers.CharField(source='player1.alias')
    player2 = serializers.CharField(source='player2.alias')

    class Meta:
        model = Round
        fields = ['round_number', 'player1', 'player2', 'winner', 'player1_score', 'player2_score']

class GameSerializer(serializers.ModelSerializer):
    rounds = RoundSerializer(many=True, read_only=True)
    players = serializers.SlugRelatedField(slug_field='alias', many=True, queryset=Player.objects.all())

    class Meta:
        model = Game
        fields = ['game_id', 'mode', 'winner', 'rounds', 'players', 'host']
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        return {key.replace('_', '-'): value for key, value in representation.items()}
