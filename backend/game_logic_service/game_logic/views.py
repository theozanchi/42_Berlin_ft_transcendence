# views.py

from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from channels.layers import get_channel_layer
from django.core.cache import cache
from asgiref.sync import async_to_sync

channel_layer = get_channel_layer()

@csrf_exempt
@api_view(['POST'])
def game_update(request):
    new_state = request.data.get('game_state')
    game_id = new_state['game_id']

    game_state = cache.get(game_id)
    if game_state is None:
        player1_id = request.data.get['player1_id']
        player2_id = request.data.get['player2_id']
        game_state = create_new_game_state(player1_id, player2_id)
    # process data with logic here
    cache.set(game_id, game_state, timeout=None)

    game_state['type'] = 'game_update'
    async_to_sync(channel_layer.group_send(game_id, cache.get(game_id)))

    def create_new_game_state(self, player1_id, player2_id):
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
            'reset_ball': False,

            'player1_id': player1_id,
            'player2_id': player2_id
        }

