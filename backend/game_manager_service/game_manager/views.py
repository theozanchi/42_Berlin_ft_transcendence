# views.py
import logging

from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.http import HttpResponse, JsonResponse
from game_manager.models import Game, Player, Round, Participation
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import (api_view, authentication_classes,
                                       permission_classes)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .exceptions import InsufficientPlayersError
from .serialize import GameSerializer, RoundSerializer, PlayerSerializer
from django.core.exceptions import ValidationError
import logging
from .exceptions import InsufficientPlayersError
from django.contrib.auth.models import User

logging.basicConfig(
    level=logging.DEBUG, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([AllowAny])
def create_game(request):
    try:
        game = Game.objects.create(mode=request.data.get('mode'), host=request.data.get('channel_name'))
        if game.mode == 'remote':
            user_id = request.data.get('user_id')
            user = User.objects.get(pk=user_id)
            game.add_existing_players_to_game(user, request.data.get('channel_name'))
        else:
            game.create_players_for_game(request.data)
        game.save()


        serializer = GameSerializer(game)
        return JsonResponse(serializer.data, status=200)

    except KeyError as e:
        logging.error("Error creating game: %s", e)
        return JsonResponse({"error": str(e)}, status=400)
    
    except ObjectDoesNotExist as e:
        logging.error("Error creating game: %s", e)
        return JsonResponse({"error": str(e)}, status=404)


@api_view(["POST"])
@permission_classes([AllowAny])
def join_game(request):
    try:
        game = Game.objects.get(pk=request.data.get('game_id'))
        if game.mode != 'remote':
            logging.error("Error: tried to join game that is not a remote game.")
            return JsonResponse({'error': 'Game is not a remote game.'}, status=403)
        
        user_id = request.data.get('user_id')
        user = User.objects.get(pk=user_id)
        logging.debug("User joining: %s", user)

        if Player.objects.filter(game=game, user=user).exists():
            logging.error("Error: player already in game.")
            return JsonResponse({'error': 'Player already in game.'}, status=403)
        
        if not user.is_authenticated:
            logging.error("Error: user not authenticated.")
            return JsonResponse({'error': 'User not authenticated.'}, status=403)
        
        else:
            game.add_existing_players_to_game(user, request.data.get('channel_name'))

        game.save()

        serializer = GameSerializer(game)
        return JsonResponse(serializer.data, status=200)

    except Game.DoesNotExist:
        logging.error("Error: game not found.")
        return JsonResponse({"error": "Game not found."}, status=404)

    except KeyError as e:
        logging.error("Error: %s", e)
        return JsonResponse({"error": e}, status=400)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_game(request):
    try:
        game = Game.objects.get(pk=request.data.get('game_id'))
        serializer = GameSerializer(game)
        return JsonResponse(serializer.data, status=200)

    except Game.DoesNotExist:
        logging.error("Error: game not found.")
        return JsonResponse({"error": "Game not found."}, status=404)


@api_view(["POST"])
@permission_classes([AllowAny])
def update_round_status(request):
    try:
        game = Game.objects.get(pk=request.data.get("game_id"))

        round_played = Round.objects.get(
            game=request.data.get("game_id"),
            round_number=request.data.get("round_number"),
        )
        if round_played.winner:
            logging.error("Error: Round already updated.")
            return JsonResponse({"message": "Round already played."}, status=403)

        round_played.player1_score = request.data.get("player1Score")
        round_played.player2_score = request.data.get("player2Score")
        winner = request.data.get("winner")
        round_played.winner = (
            round_played.player1 if winner == "player1" else round_played.player2
        )
        round_played.status = "completed"
        round_played.save()
        logging.debug("Round updated: %s, Details: %s", round_played, round_played.__dict__)

        serializer = RoundSerializer(round_played)
        logging.info("Round finished updated: %s", serializer.data)
        return JsonResponse(serializer.data, status=200)

    except Game.DoesNotExist:
        logging.error("Error: game not found.")
        return JsonResponse({"error": "Game not found."}, status=404)

    except Round.DoesNotExist:
        logging.error("Error: round not found.")
        return JsonResponse({"error": "No round found."}, status=404)

    except ValidationError as e:
        logging.error("Error: %s", e)
        return JsonResponse({"error": str(e)}, status=400)


@api_view(["POST"])
@permission_classes([AllowAny])
def round(request):
    try:
        if request.data.get("game-id") is None:
            return JsonResponse({"error": "Missing game_id parameter"}, status=400)

        game = Game.objects.get(game_id=request.data.get("game-id"))
        if not Round.objects.filter(game=game).exists():
            game.create_rounds()
            game.save()

        rounds = Round.objects.filter(game=game).order_by('round_number')
        for round in rounds:
            logging.debug("All rounds for %s: %s %s", game.game_id, round.round_number, round.status)
        if Round.objects.filter(game=game, status="started").exists():
            logging.debug("Error: A round has status started so you cannot start another round.")
            return JsonResponse({"message": "A round has already started."}, status=403)

        round_to_play = (
            Round.objects.filter(game=game, status="pending")
            .order_by("round_number")
            .first()
        )

        if round_to_play:
            round_to_play.status = "started"
            round_to_play.save()
            rounds = Round.objects.filter(game=game).order_by('round_number')

            serializer = RoundSerializer(rounds, many=True)
            return JsonResponse(
                {"type": "round", 
                 "content": serializer.data}, 
                 safe=False, status=200)
        else:
            game.calculate_scores()
            game.save()
            if game.winner:
                serializer = PlayerSerializer(game.winner)
                return JsonResponse(
                    {"type": "tournament-over", 
                     "content": serializer.data},
                   safe=False, status=200)
            return JsonResponse({"message": "No rounds to play."}, status=403)

    except InsufficientPlayersError as e:
        logging.error("Error: %s", e)
        return JsonResponse({"error": str(e)}, status=418)

    except Game.DoesNotExist:
        logging.error("Error: game not found.")
        return JsonResponse({"error": "Game not found."}, status=404)

    except Exception as e:
        logging.error("Error: %s", e)
        return JsonResponse({"error": str(e)}, status=400)


@api_view(["POST"])
@permission_classes([AllowAny])
def update_players(request):
    try:
        game = Game.objects.get(pk=request.data.get("game-id"))
        if game.end_date:
            return JsonResponse({"message": "Game already ended."}, status=200)
        if request.data.get("channel_name") == game.host:
            next_player = game.players.exclude(channel_name=game.host).first()
            if next_player:
                game.host = next_player.channel_name
            else:
                game.host = None
        game.update_scores_abandon(request.data.get("channel_name"))

        player = game.players.filter(channel_name=request.data.get("channel_name")).first()
        if player:
            player.game = None
            player.save()
        game.save()
        serializer = GameSerializer(game)
        return JsonResponse(serializer.data, status=200)

    except Game.DoesNotExist:
        logging.error("Error: game not found.")
        return JsonResponse({"error": "Game not found."}, status=404)

    except KeyError as e:
        logging.error("Error: %s", e)
        return JsonResponse({"error": e}, status=400)
