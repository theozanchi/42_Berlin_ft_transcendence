# views.py
from django.http import HttpResponse, JsonResponse
from rest_framework.response import Response
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from game_manager.models import Game
from .serialize import serialize_game_data

@api_view(['POST'])
@permission_classes([AllowAny])
def create_game(request):
    game = Game.objects.create(mode=request.data.get('game-mode'))
    game.add_players_to_game(request.data)
    game.create_rounds()
    # Game can now be played
    #for round in game.rounds.all():
    #    round.initialize_round()
    game.save()

    return Response(serialize_game_data(game), status=200)

