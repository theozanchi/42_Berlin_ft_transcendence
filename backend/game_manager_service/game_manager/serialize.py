from .models import Game, Player, Round
from django.core import serializers

def serialize_game_data(game):
    # Fetch the game instance with related fields prefetched
    game_instance = Game.objects.prefetch_related('players', 'rounds').get(id=game.id)

    # Serialize the game instance and related objects
    serialized_data = serializers.serialize('json', [game_instance], use_natural_foreign_keys=True)

    return serialized_data
