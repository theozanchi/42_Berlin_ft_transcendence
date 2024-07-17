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
        game.create_players_for_game(request.data)
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
        
        user_id = request.data.get('user_id')
        if Player.objects.filter(game=game, user_id=user_id).exists():
            return Response({'error': 'Player already in game.'}, status=403)
        if not user_id:
            game.create_players_for_game(request.data)
        else:
            game.add_existing_players_to_game(request.data)

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
        serializer = GameSerializer(game)
        return Response(serializer.data, status=200)
    
    except Game.DoesNotExist:
        return Response({'error': 'Game not found.'}, status=404)

@api_view(['POST'])
@permission_classes([AllowAny])
def update_round_status(request):
    try:
        logging.debug('UPDATE ROUND STATUS: request data: %s', request.data)
        game = Game.objects.get(pk=request.data.get('game_id'))
        
        round_played = Round.objects.get(game=request.data.get('game_id'), round_number=request.data.get('round_number'))
        logging.debug('found round: %s', round_played)
        if round_played.winner:
            return Response({'message': 'Round already played.'}, status=403)
        
        round_played.player1_score = request.data.get('player1Score')
        round_played.player2_score = request.data.get('player2Score')
        winner = request.data.get('winner')
        round_played.winner = round_played.player1 if winner == 'player1' else round_played.player2
        round_played.status = 'completed'
        round_played.save()

        logging.debug('round updated: %s', round_played)
        rounds = Round.objects.filter(game=game)
        serializer = RoundSerializer(rounds, many=True)

        if round_played.round_number == game.rounds.count():
            game.determine_winner()
            game.save()
            logging.debug('game winner determined: %s', game.winner.alias)
            
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
    #should return all roudns of game but update change the status of the next round to be played
    try:
        if request.data.get('game-id') is None:
            return JsonResponse({'error': 'Missing game_id parameter'}, status=400)
        
        game = Game.objects.get(game_id=request.data.get('game-id'))
        if not Round.objects.filter(game=game).exists():
            game.create_rounds()
            game.save()
        
        round_to_play = Round.objects.filter(game=game, status='pending').order_by('round_number').first()
        
        if round_to_play:
            round_to_play.status = 'started'
            rounds = Round.objects.filter(game=game)
            serializer = RoundSerializer(rounds, many=True)
            logging.debug('rounds serializer: %s', serializer.data)
            return JsonResponse(serializer.data, safe=False, status=200)
        else:
            if game.winner:
                return JsonResponse({'message': 'tournament-over', 'winner': game.winner.alias}, status=200)
            return JsonResponse({'message': 'No rounds to play.'}, status=403)

    except InsufficientPlayersError as e:
        return JsonResponse({'error': str(e)}, status=418)
    
    except Game.DoesNotExist:
        return JsonResponse({'error': 'Game not found.'}, status=404)
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
        

""" @api_view(['GET'])
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
        return Response({'error': 'Game not found.'}, status=404) """

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
