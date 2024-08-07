# views.py

import json
import logging
import math
import time
from threading import Lock

import requests
from asgiref.sync import async_to_sync, sync_to_async
from channels.layers import get_channel_layer
from django.core.cache import cache
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views import View
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

game_update_lock = Lock()
WINNER_SCORE = 3

GAME_MANAGER_REST_URL = "http://game_manager:8000"

@api_view(["POST"])
@permission_classes([AllowAny])
def game_update(request):
    try:
        new_game_state = json.loads(request.body)
        game_id = new_game_state.get("game_id")

        if game_id is None:
            return JsonResponse({"error": "Missing game-ID"}, status=400)
        
        with game_update_lock:
            cached_game_state = cache.get(game_id)
            current_time = time.time()

            # Check if cached game is the same round as the new game state
            if cached_game_state is not None and new_game_state.get(
                "round_number"
            ) == cached_game_state.get("round_number"):
                if cached_game_state.get("gameOver") == True:
                    return JsonResponse({"error": "Game over"}, safe=False, status=200)
                game_state = cached_game_state
            else:
                game_state = create_new_game_state(
                    game_id, new_game_state.get("round_number")
                )
                cache.set(game_id, game_state, timeout=30)
                logging.info(
                    f'Creating new game state for game {game_id}, round number {new_game_state.get("round_number")}\n'
                )

            logging.info("Received data: " + str(new_game_state.get("last_update_time")))
            if new_game_state:
                game_state.update(new_game_state)

            # Perform game logic
            update_game_state(game_state)

            last_update_time = current_time

            # Ensure atomic update to the cache
            cache.set(game_id, game_state, timeout=30)

            game_state["type"] = "update"

            if (
                game_state["player1Score"] >= WINNER_SCORE
                or game_state["player2Score"] >= WINNER_SCORE
            ):
                game_state = handle_game_over(game_state, game_id, request.headers)

            logging.info("Sendig data: " + str(game_state.get("last_update_time")))
            return JsonResponse(game_state, safe=False, status=200)

    except Exception as e:
        logging.error(f"Error updating game state: {str(e)}")
        return JsonResponse("Error updating game state", status=503, safe=False)


def handle_game_over(game_state, game_id, headers):
    game_state = {
        "game_id": game_id,
        "round_number": game_state["round_number"],
        "player1Score": game_state["player1Score"],
        "player2Score": game_state["player2Score"],
        "winner": (
            "player1" if game_state["player1Score"] >= WINNER_SCORE else "player2"
        ),
    }
    response = requests.post(
        GAME_MANAGER_REST_URL + "/update-round-status/",
        json=game_state,
        headers=headers,
    )
    # response.raise_for_status()

    game_state.update({"gameOver": True})
    game_state.update(response.json())
    logging.info(f"Setting gamestate to game over\n")
    cache.set(game_id, game_state, timeout=30)
    return game_state


def create_new_game_state(game_id, round_number):
    return {
        'game_id': game_id,

        'aiming_angle': 0 , # Initialize aiming_angle
        'aimingSpeed': 0.05,  # Example speed value, adjust as needed
        'maxaiming_angle': 1.57,  # Example max angle value (90 degrees in radians)
        'minaiming_angle': -1.57, 
        'cube_size': 2,
        'ball_radius': 0.05,
        'resetting_ball': False,
        'last_update_time': time.time(),
        'update_interval': 1 / 60,

        'player1': {'x': 0, 'y': 0, 'z': 1, 'rotation': {'x': 0, 'y': 0, 'z': 0}},
        'player2': {'x': 0, 'y': 0, 'z': -1, 'rotation': {'x': 0, 'y': 0, 'z': 0}},
        'ball': {'x': 0, 'y': 0, 'z': 0},
        'ballSpeed': {'x': 0, 'y': 0, 'z': 0},
        'playerTurn': True,  # Initial value, assuming player 1 starts
        'player1Score': 0,
        'player2Score': 0,
        'ballIsHeld': True,  # Initial value, assuming ball is held initially
        'current_face': 0,  # Adding initial value for current face
        'current_face2': 1,
        'wall_hits' : 0,
        'aiming_angle' : 0,
        'reset_ball': False,
        'is_processing': False,
        'current_player': None,
    }


def update_game_state(game_state):
    current_time = time.time()
    # Handle ball movement and collision detection server-side
    # game_update(data)
    if current_time - game_state["last_update_time"] >= game_state["update_interval"]:
        game_state["last_update_time"] = current_time
    if game_state["reset_ball"]:
        reset_ball(game_state)
    update_ball(game_state)
    # update_ai(game_state)


def reset_ball(game_state):

    game_state["playerTurn"] = not game_state["playerTurn"]
    game_state["reset_ball"] = False
    game_state["ballIsHeld"] = False
    # Calcular la dirección en base a la cara actual y el ángulo de puntería
    direction = game_state["direction"]
    # Normalizar la dirección para asegurarse de que sea un vector unitario
    direction_length = vector_length(direction)
    if direction_length > 0:
        direction = {k: v / direction_length for k, v in direction.items()}

    # Definir la magnitud de la velocidad inicial
    initial_velocity_magnitude = 0.02
    game_state["ballSpeed"] = {
        k: v * initial_velocity_magnitude for k, v in direction.items()
    }

    # Establecer la posición inicial de la pelota, asegurándose de que no colisione inmediatamente con el jugador
    offset_distance = 0.5  # Ajustar según sea necesario
    if not game_state["playerTurn"]:
        ball_start_position = {
            k: game_state["player1"][k] + direction[k] * offset_distance
            for k in direction
        }
    else:
        ball_start_position = {
            k: game_state["player2"][k] + direction[k] * offset_distance
            for k in direction
        }

    # Verificar que la posición inicial esté dentro de los límites permitidos del cubo
    half_cube_size = game_state["cube_size"] / 2 - game_state["ball_radius"]
    for axis in ["x", "y", "z"]:
        if ball_start_position[axis] < -half_cube_size:
            ball_start_position[axis] = -half_cube_size
        if ball_start_position[axis] > half_cube_size:
            ball_start_position[axis] = half_cube_size

    game_state["ball"] = ball_start_position.copy()


def calculate_direction(player_turn, current_face, current_face2, aiming_angle):
    direction = {"x": 0, "y": 0, "z": 0}
    face = current_face2 if player_turn else current_face
    if face == 0:  # Front
        direction["x"] = math.sin(aiming_angle)
        direction["z"] = -math.cos(aiming_angle)
    elif face == 1:  # Back
        direction["x"] = math.sin(aiming_angle)
        direction["z"] = math.cos(aiming_angle)
    elif face == 2:  # Left
        direction["x"] = math.cos(aiming_angle)
        direction["z"] = math.sin(aiming_angle)
    elif face == 3:  # Right
        direction["x"] = -math.cos(aiming_angle)
        direction["z"] = math.sin(aiming_angle)
    elif face == 4:  # Top
        direction["x"] = math.sin(aiming_angle)
        direction["y"] = -math.cos(aiming_angle)
    elif face == 5:  # Bottom
        direction["x"] = math.sin(aiming_angle)
        direction["y"] = math.cos(aiming_angle)
    return direction


def vector_length(vector):
    return (vector["x"] ** 2 + vector["y"] ** 2 + vector["z"] ** 2) ** 0.5


def set_vector_length(vector, length):
    current_length = vector_length(vector)
    for axis in ["x", "y", "z"]:
        vector[axis] = vector[axis] / current_length * length


def update_ball(game_state):
    if game_state["ballIsHeld"]:
        if game_state["playerTurn"]:
            game_state["ball"] = game_state["player1"].copy()
        else:
            game_state["ball"] = game_state["player2"].copy()
        return
    # Calculate the next position of the ball
    next_position = {
        "x": game_state["ball"]["x"] + game_state["ballSpeed"]["x"],
        "y": game_state["ball"]["y"] + game_state["ballSpeed"]["y"],
        "z": game_state["ball"]["z"] + game_state["ballSpeed"]["z"],
    }

    # Check for collisions with players
    if check_collision(game_state):
        print("Collision detected")
        pass
    else:
        game_state["ball"] = next_position  # Update ball position normally

    half_cube_size = game_state["cube_size"] / 2 - game_state["ball_radius"]

    if (
        game_state["ball"]["x"] <= -half_cube_size
        or game_state["ball"]["x"] >= half_cube_size
    ):
        game_state["ballSpeed"]["x"] = -game_state["ballSpeed"]["x"]
        game_state["wall_hits"] += 1

    if (
        game_state["ball"]["y"] <= -half_cube_size
        or game_state["ball"]["y"] >= half_cube_size
    ):
        game_state["ballSpeed"]["y"] = -game_state["ballSpeed"]["y"]
        game_state["wall_hits"] += 1

    if (
        game_state["ball"]["z"] <= -half_cube_size
        or game_state["ball"]["z"] >= half_cube_size
    ):
        game_state["ballSpeed"]["z"] = -game_state["ballSpeed"]["z"]
        game_state["wall_hits"] += 1

    # logging.info(game_state['wall_hits'])
    # game_state['ballIsHeld'] = False
    # Score handling
    if game_state["wall_hits"] >= 2:
        if not game_state["playerTurn"]:
            game_state["player1Score"] += 1
        else:
            game_state["player2Score"] += 1
        game_state["wall_hits"] = 0
        # game_state['playerTurn'] = not game_state['playerTurn']
        game_state["ballIsHeld"] = True
        update_ball(game_state)
        # reset_ball(game_state)
    # Update the collision marker position
    # update_collision_marker(game_state)


def check_collision(game_state):
    if game_state["ballIsHeld"]:
        return False

    if (
        game_state["ballSpeed"]["x"] == 0
        and game_state["ballSpeed"]["y"] == 0
        and game_state["ballSpeed"]["z"] == 0
    ):
        return False

    ball_position = game_state["ball"]
    next_position = {
        "x": ball_position["x"] + game_state["ballSpeed"]["x"],
        "y": ball_position["y"] + game_state["ballSpeed"]["y"],
        "z": ball_position["z"] + game_state["ballSpeed"]["z"],
    }

    # Create a bounding box that encompasses the ball's start and end points
    ball_box = create_bounding_box(game_state, ball_position, next_position)

    player_box = create_bounding_box(
        game_state, game_state["player1"], game_state["player1"]
    )
    ai_player_box = create_bounding_box(
        game_state, game_state["player2"], game_state["player2"]
    )

    # Check if the ball is colliding with the player or AI player
    if (game_state["playerTurn"] and intersects_box(ball_box, player_box)) or (
        not game_state["playerTurn"] and intersects_box(ball_box, ai_player_box)
    ):

        # Place collision marker at the intersection point for debugging
        game_state["collision_marker_position"] = ball_position.copy()

        # Get the paddle involved in the collision
        paddle = (
            game_state["player1"] if game_state["playerTurn"] else game_state["player2"]
        )
        paddle_position = paddle
        paddle_scale = {"x": 1, "y": 1, "z": 1}  # Assuming scale is 1 for simplicity

        # Calculate the relative collision point on the paddle
        relative_collision_point = {
            "x": ball_position["x"] - paddle_position["x"],
            "y": ball_position["y"] - paddle_position["y"],
            "z": ball_position["z"] - paddle_position["z"],
        }

        # Normalize the relative collision point to [-1, 1]
        relative_collision_point["x"] /= paddle_scale["x"] / 2
        relative_collision_point["y"] /= paddle_scale["y"] / 2
        relative_collision_point["z"] /= paddle_scale["z"] / 2

        # Adjust ball direction based on the relative collision point
        speed = vector_length(game_state["ballSpeed"])
        new_ball_speed = {
            "x": game_state["ballSpeed"]["x"] + relative_collision_point["x"] * 0.5,
            "y": game_state["ballSpeed"]["y"] + relative_collision_point["y"] * 0.5,
            "z": -game_state["ballSpeed"]["z"]
            + relative_collision_point["z"]
            * 0.5,  # Reversing Z for a basic bounce back effect
        }

        # Normalize to maintain constant speed
        set_vector_length(new_ball_speed, speed)

        speed_increment = 0.02  # Adjust this value to control the speed increase rate
        new_ball_speed = {
            k: v * (1 + speed_increment) for k, v in new_ball_speed.items()
        }

        game_state["ballSpeed"] = new_ball_speed

        # Move the ball slightly away from the collision point to prdata immediate re-collision
        game_state["ball"] = {
            "x": game_state["ball"]["x"] + game_state["ballSpeed"]["x"] * 0.1,
            "y": game_state["ball"]["y"] + game_state["ballSpeed"]["y"] * 0.1,
            "z": game_state["ball"]["z"] + game_state["ballSpeed"]["z"] * 0.1,
        }

        # Change player turn
        game_state["playerTurn"] = not game_state["playerTurn"]

        # Reset wall hits
        game_state["wall_hits"] = 0

        return True

    return False


def create_bounding_box(game_state, start, end):

    margin = 0.009

    center = {
        "x": (start["x"] + end["x"]) / 2,
        "y": (start["y"] + end["y"]) / 2,
        "z": (start["z"] + end["z"]) / 2,
    }
    size = {
        "x": abs(end["x"] - start["x"]) + game_state["ball_radius"] * 2 + margin * 2,
        "y": abs(end["y"] - start["y"]) + game_state["ball_radius"] * 2 + margin * 2,
        "z": abs(end["z"] - start["z"]) + game_state["ball_radius"] * 2 + margin * 2,
    }
    return (center, size)


def intersects_box(box1, box2):
    # Simplified bounding box intersection logic
    center1, size1 = box1
    center2, size2 = box2
    for axis in ["x", "y", "z"]:
        if abs(center1[axis] - center2[axis]) > (size1[axis] / 2 + size2[axis] / 2):
            return False
    return True


def update_collision_marker(game_state):
    half_cube_size = game_state["cube_size"] / 2
    ball_position = game_state["ball"]
    ball_velocity = game_state["ballSpeed"]

    min_t = float("inf")
    intersection_point = None

    def check_face(axis, direction, limit):
        nonlocal min_t, intersection_point
        if ball_velocity[axis] != 0:
            t = (limit - ball_position[axis]) / ball_velocity[axis]
            if 0 < t < min_t:
                point = {
                    k: ball_position[k] + ball_velocity[k] * t
                    for k in ball_velocity.keys()
                }
                if (
                    -half_cube_size <= point["x"] <= half_cube_size
                    and -half_cube_size <= point["y"] <= half_cube_size
                    and -half_cube_size <= point["z"] <= half_cube_size
                ):
                    min_t = t
                    intersection_point = point

    # Check all 6 faces
    check_face("x", 1, half_cube_size)  # Right face
    check_face("x", -1, -half_cube_size)  # Left face
    check_face("y", 1, half_cube_size)  # Top face
    check_face("y", -1, -half_cube_size)  # Bottom face
    check_face("z", 1, half_cube_size)  # Front face
    check_face("z", -1, -half_cube_size)  # Back face

    if intersection_point:
        game_state["collision_marker_position"] = intersection_point
