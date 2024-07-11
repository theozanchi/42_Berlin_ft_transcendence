# views.py
from django.http import HttpResponse, JsonResponse
from rest_framework.response import Response
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from game_manager.models import Game, Player, Round
from .serialize import GameSerializer, RoundSerializer
from django.core.exceptions import ValidationError, ObjectDoesNotExist
import logging
from .exceptions import InsufficientPlayersError

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
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
        game = Game.objects.get(pk=request.data.get('game_id'))
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
        game = Game.objects.get(pk=request.data.get('game_id'))
        game = Game.objects.get(pk=request.data.get('game_id'))
        serializer = GameSerializer(game)
        return Response(serializer.data, status=200)
    
    except Game.DoesNotExist:
        return Response({'error': 'Game not found.'}, status=404)

@api_view(['PUT'])
@permission_classes([AllowAny])
def update_round_status(request):
    try:
        logging.debug('request.data: %s', request.data)
        game = Game.objects.get(pk=request.data.get('game_id'))
        round_played = Round.objects.filter(game=game, winner__isnull=True).order_by('round_number').first()
        
        round_played.player1_score = request.data.get('playerScore')
        round_played.player2_score = request.data.get('aiScore')
        round_played.winner = request.data.get('winner')
        round_played.save()

        if round.number == game.rounds:
            game.determine_winner()
            game.save()

        serializer = RoundSerializer(game)
        return Response(serializer.data, status=200)
    
    except Game.DoesNotExist:
        return Response({'error': 'Game not found.'}, status=404)
    
    except ValidationError as e:
        return Response({'error': str(e)}, status=400)
    
@api_view(['POST'])    
@permission_classes([AllowAny])
def round(request):
    try:
        if request.data.get('game-id') is None:
            return JsonResponse({'error': 'Missing game_id parameter'}, status=400)
        
        game = Game.objects.filter(game_id=request.data.get('game-id')).first()
        if not Round.objects.filter(game=game).exists():
            game.create_rounds()
            game.save()
        
        round_to_play = Round.objects.filter(game=game, winner__isnull=True).order_by('round_number').first()
        
        logging.debug('round_to_play: %s', round_to_play)

        if round_to_play:
            serializer = RoundSerializer(round_to_play)
            return JsonResponse(serializer.data, status=200)      
        else:
            if game.winner:
                return JsonResponse({'message': 'Game over', 'winner': game.winner}, status=200)
            return JsonResponse({'message': 'No rounds to play.'}, status=403)

    except InsufficientPlayersError as e:
        return JsonResponse({'error': str(e)}, status=418)
    except Game.DoesNotExist:
        return JsonResponse({'error': 'Game not found.'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
        

@api_view(['GET'])
@permission_classes([AllowAny])
def finish_game(request):
    try:
        game = Game.objects.get(pk=request.data.get('game_id'))
        game = Game.objects.get(pk=request.data.get('game_id'))
        game.determine_winner()

        game.save()
        return Response({'message': 'Game finished.', 'winner': game.winner}, status=200)
                             
    except Game.DoesNotExist:
        return Response({'error': 'Game not found.'}, status=404)

@api_view(['POST'])
@permission_classes([AllowAny])
def update_players(request):
    logging.debug('Player disconnected, request.data: %s', request.data)
    try:
        game = Game.objects.get(pk=request.data.get('game-id'))
        if request.data.get('channel_name') == game.host:
            logging.debug('Host disconnected, selecting next player as host')
            next_player = game.players.exclude(channel_name=game.host).first()
            if next_player:
                logging.debug('Next player: %s', next_player.channel_name)
                game.host = next_player.channel_name
            else:
                logging.debug('No more players in game, setting host to None')
                game.host = None
        game.update_scores_abandon(request.data.get('channel_name'))
        game.save()
        serializer = GameSerializer(game)
        return Response(serializer.data, status=200)
    
    except Game.DoesNotExist:
        return Response({'error': 'Game not found.'}, status=404)
    
    except KeyError as e:
        return Response({'error': e}, status=400)