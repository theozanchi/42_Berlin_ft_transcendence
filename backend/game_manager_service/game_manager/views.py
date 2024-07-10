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

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def create_game(request):
    try:
        game = Game.objects.create(mode=request.data.get('game-mode'), host=request.data.get('channel_name'))
        game.add_players_to_game(request.data)
        game.save()

        logging.debug('creating new game: %s', game)

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

        logging.debug('player joining game: %s', game)

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

@api_view(['POST'])
@permission_classes([AllowAny])
def update_round_status(request):
    try:
        game = Game.objects.get(pk=request.data.get('game_id'))

        logging.debug('found game: %s', game)
        all_rounds = Round.objects.filter(game_id=game.game_id)
        for round in all_rounds:
            logging.debug('round: %s, winner: %s', round, round.winner)
        
        round_played = Round.objects.filter(game_id=request.data.get('game_id'), winner__isnull=True).order_by('round_number').first()
        logging.debug('found round: %s', round_played)
        
        round_played.player1_score = request.data.get('player1Score')
        round_played.player2_score = request.data.get('player2Score')
        winner = request.data.get('winner')
        round_played.winner = round_played.player1 if winner == 'player1' else round_played.player2
        round_played.save()

        logging.debug('round updated: %s', round_played)

        if round_played.number == game.rounds:
            game.determine_winner()
            game.save()
            logging.debug('game winner determined: %s', game)

        serializer = RoundSerializer(game)
        return Response(serializer.data, status=200)
    
    except Game.DoesNotExist:
        return Response({'error': 'Game not found.'}, status=404)
    
    except Round.DoesNotExist:
        return Response({'error': 'No round found.'}, status=404)
    
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
            logging.debug('creating rounds for game: %s', game)
            game.create_rounds()
            for round in Round.objects.filter(game=game):
                logging.debug('round created: %s', round)
            game.save()
        
        round_to_play = Round.objects.filter(game=game, winner__isnull=True).order_by('round_number').first()
        
        logging.debug('round_to_play being sent back: %s', round_to_play)

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

        logging.debug('game finished: %s', game)
        return Response({'message': 'Game finished.', 'winner': game.winner}, status=200)
                             
    except Game.DoesNotExist:
        return Response({'error': 'Game not found.'}, status=404)