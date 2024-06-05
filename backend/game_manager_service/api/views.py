from django.http import HttpResponse, JsonResponse
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from game_manager.models import Game
from .serialize import serialize_game_data

@api_view(['POST'])
def create_game(request):
    # Access form data using request.data
    game = Game.objects.create(mode=request.data.get('game-mode'))
    # Create players for the game
    game.add_players_to_game(request.data)
    # Generate rounds for the game
    game.create_rounds()
    # Game can now be played
    #for round in game.rounds.all():
    #    round.initialize_round()
    game.save()

    return Response(serialize_game_data(game), status=200)
