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
from .serialize import GameSerializer, RoundSerializer
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
        logging.debug("creating new game: %s", serializer.data)
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

        serializer = RoundSerializer(round_played)

        if round_played.round_number == game.rounds.count():
            game.calculate_scores()
            game.save()

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
            logging.debug("/round/: rounds serializer: %s", serializer.data)
            return JsonResponse(serializer.data, safe=False, status=200)
        else:
            if game.winner:
                return JsonResponse(
                    {"message": "tournament-over", "winner": game.winner.alias},
                    status=200,
                )
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
    logging.debug("Player disconnected, request.data: %s", request.data)
    try:
        game = Game.objects.get(pk=request.data.get("game-id"))
        if request.data.get("channel_name") == game.host:
            logging.debug("Host disconnected, selecting next player as host")
            next_player = game.players.exclude(channel_name=game.host).first()
            if next_player:
                logging.debug("Next player: %s", next_player.channel_name)
                game.host = next_player.channel_name
            else:
                logging.debug("No more players in game, setting host to None")
                game.host = None
        game.update_scores_abandon(request.data.get("channel_name"))
        game.save()
        serializer = GameSerializer(game)
        return JsonResponse(serializer.data, status=200)

    except Game.DoesNotExist:
        logging.error("Error: game not found.")
        return JsonResponse({"error": "Game not found."}, status=404)

    except KeyError as e:
        logging.error("Error: %s", e)
        return JsonResponse({"error": e}, status=400)
