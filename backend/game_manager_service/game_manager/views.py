# views.py
from django.http import HttpResponse, JsonResponse
from rest_framework.response import Response
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from game_manager.models import Game
from .serialize import GameSerializer

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
    serializer = GameSerializer(game)
    return Response(serializer.data, status=200)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_game(request, game_id):
    game = Game.objects.get(pk=game_id)
    serializer = GameSerializer(game)
    return Response(serializer.data, status=200)

@api_view(['PUT'])
@permission_classes([AllowAny])
def update_game(request, game_id):
    game = Game.objects.get(pk=game_id)
    game.update_game(request.data)
    game.save()
    serializer = GameSerializer(game)
    return Response(serializer.data, status=200)
