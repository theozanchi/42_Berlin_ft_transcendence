# views.py
from django.http import HttpResponse, JsonResponse
from rest_framework.response import Response
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from game_manager.models import Game, Player, Round
from .serialize import GameSerializer
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def create_game(request):
    try:
        game = Game.objects.create(mode=request.data.get('game-mode'), host=request.data.get('channel_name'))
        game.add_players_to_game(request.data)
        game.save()
        serializer = GameSerializer(game)
        return Response(serializer.data, status=200)
    
    except KeyError as e:
        return Response({'error': e}, status=400)

@api_view(['POST'])
@permission_classes([AllowAny])
def join_game(request):
    try:
        game = Game.objects.get(pk=request.data.get('game-id'))
        if game.mode != 'remote':
            return Response({'error': 'Game is not a remote game.'}, status=403)
        game.add_players_to_game(request.data)
        game.save()
        serializer = GameSerializer(game)
        return Response(serializer.data, status=200)
    
    except Game.DoesNotExist:
        return Response({'error': 'Game not found.'}, status=404)
    
    except KeyError as e:
        return Response({'error': e}, status=400)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_game(request):
    try:
        game = Game.objects.get(pk=request.data.get('game-id'))
        serializer = GameSerializer(game)
        return Response(serializer.data, status=200)
    
    except Game.DoesNotExist:
        return Response({'error': 'Game not found.'}, status=404)

@api_view(['PUT'])
@permission_classes([AllowAny])
def update_round_status(request):
    try:
        game = Game.objects.get(pk=request.data.get('game-id'))

        game.update_game(request.data)
        game.save()

        serializer = GameSerializer(game)
        return Response(serializer.data, status=200)
    
    except Game.DoesNotExist:
        return Response({'error': 'Game not found.'}, status=404)
    
    except ValidationError as e:
        return Response({'error': e}, status=400)
    
    
@api_view(['GET'])
@permission_classes([AllowAny])
def play_next_round(request):
    try:
        game = Game.objects.get(pk=request.data.get('game-id'))
        round_to_play = Round.objects.filter(game=game, winner__isnull=True).order_by('round_number').first()
        
        if round_to_play:
            round_to_play.initialize_round()

            serializer = GameSerializer(game)
            return Response(serializer.data, status=200)
        
        else:
            return Response({'message': 'No rounds to play or all rounds played.'}, status=404)

    except Game.DoesNotExist:
        return Response({'error': 'Game not found.'}, status=404)

@api_view(['GET'])
@permission_classes([AllowAny])
def finish_game(request):
    try:
        game = Game.objects.get(pk=request.data.get('game-id'))
        game.determine_winner()

        game.save()
        return Response({'message': 'Game finished.', 'winner': game.winner}, status=200)
                             
    except Game.DoesNotExist:
        return Response({'error': 'Game not found.'}, status=404)