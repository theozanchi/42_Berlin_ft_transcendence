from django.http import HttpResponse, JsonResponse
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from game_lobby.models import Lobby, Player
from django.views.decorators.csrf import csrf_exempt
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json

###

from django.views.generic.base import TemplateView

class LobbyView(TemplateView):
    template_name = 'game_lobby/lobby.html'

###
@api_view(['POST'])
@csrf_exempt
#@login_required
def create_lobby(request):
  #  if request.user.is_authenticated:
  #      lobby = Lobby.objects.create(host=request.user)
  #      return JsonResponse({'lobby_id': lobby.lobby_id}, status=200)
    print(request.data.get('guest_name'))
    lobby = Lobby.objects.create(host=request.data.get('guest_name'))
    return JsonResponse({'lobby_id': lobby.lobby_id}, status=200)

def generate_unique_guest_name(lobby, guest_name):
    existing_names = set(player.guest_name for player in lobby.players.all() if player.guest_name)
    existing_names.update(player.user.username for player in lobby.players.all() if player.user)

    if guest_name not in existing_names:
        return guest_name

    base_name = guest_name
    counter = 2
    while f"{base_name}#{counter}" in existing_names:
        counter += 1

    return f"{base_name}#{counter}"

@api_view(['POST'])
@csrf_exempt
def join_lobby(request):
    lobby_id = request.data.get('lobby_id')
    try:
        lobby = Lobby.objects.get(lobby_id=lobby_id)
    except Lobby.DoesNotExist:
        return JsonResponse({'error': 'Lobby does not exist'}, status=404)
    
    if lobby.is_full():
        return JsonResponse({'error': 'Lobby is full'}, status=400)
    
    if not request.user.is_authenticated:
        user = None
        if not request.data.get('guest_name'):
            return JsonResponse({'error': 'Guest name is required'}, status=400)
        # Check if guest's name is already used in this lobby
        guest_name = generate_unique_guest_name(lobby, request.data.get('guest_name'))
    else:
        user = request.user
        guest_name = None
    player = Player.objects.create(user=user, guest_name=guest_name, lobby=lobby, ws_id=request.ws_id)
    
    # Notify lobby group of new player
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'lobby_{lobby_id}',
        {
            'type': 'chat_message',
            'message': f'{player.display_name} has joined the lobby.'
        }
    )

    return JsonResponse({'message': 'Player added', 'player_id': player.id})
