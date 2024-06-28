# views.py

from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from channels.layers import get_channel_layer
from django.core.cache import cache

channel_layer = get_channel_layer()

@csrf_exempt
@api_view(['POST'])
def game_state_update(request):
    new_state = request.data
    game_id = new_state['game_id']

    game_state = cache.get(game_id)
    if game_state is None:
        game_state = {}  # set default game state
        cache.set(game_id, game_state)
    # process data with logic here

    game_state['type'] = 'game_update'
    channel_layer.group_send(game_id, new_state)
