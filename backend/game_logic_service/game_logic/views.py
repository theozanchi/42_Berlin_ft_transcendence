# views.py

from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

from channels.layers import get_channel_layer
from django.core.cache import cache
from asgiref.sync import async_to_sync
import json

@csrf_exempt
@async_to_sync
async def game_update(request):
    if request.method == 'POST':
        channel_layer = get_channel_layer()

        data = json.loads(request.body)

        game_state = data.get('game_state')
        game_id = data.get('game_id')

        if game_state is None:
            game_state = create_new_game_state()

        # process data with logic here

        game_state['type'] = 'game_update'
        cache.set(game_id, game_state, timeout=None)

        await channel_layer.group_send(game_id, game_state)

        return JsonResponse("updated game state", safe=False, status=200)
    else:
        return JsonResponse("Invalid request", safe=False, status=400)

def create_new_game_state():
    return {
        'player1': {'x': 0, 'y': 0, 'z': 1, 'rotation': {'x': 0, 'y': 0, 'z': 0}},
        'player2': {'x': 0, 'y': 0, 'z': -1, 'rotation': {'x': 0, 'y': 0, 'z': 0}},
        'ball': {'x': 0, 'y': 0, 'z': 0},
        'ballSpeed': {'x': 0, 'y': 0, 'z': 0},
        'playerTurn': True,  # Initial value, assuming player 1 starts
        'playerScore': 0,
        'aiScore': 0,
        'ballIsHeld': True,  # Initial value, assuming ball is held initially
        'current_face': 0,  # Adding initial value for current face
        'current_face2': 1,
        'wall_hits' : 0,
        'aiming_angle' : 0,
        'reset_ball': False
    }

