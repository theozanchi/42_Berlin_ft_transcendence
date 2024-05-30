from django.http import HttpResponse, JsonResponse
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from base.models import Lobby, Player
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import uuid

@login_required
def create_lobby(request):
    if request.method == 'POST' and request.user.is_authenticated:
        lobby = Lobby.objects.create(host=request.user)
        return JsonResponse({'lobby_id': lobby.lobby_id})

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


def join_lobby(request, lobby_id):
    try:
        lobby = Lobby.objects.get(lobby_id=lobby_id)
    except Lobby.DoesNotExist:
        return JsonResponse({'error': 'Lobby does not exist'}, status=404)
    
    if lobby.is_full():
        return JsonResponse({'error': 'Lobby is full'}, status=400)
    
    if request.user.is_authenticated:
        player = Player.objects.create(user=request.user, lobby=lobby)
    else:
        guest_name = request.POST.get('guest_name')
        if not guest_name:
            return JsonResponse({'error': 'Guest name is required'}, status=400)
        # Check if guest's name is already used in this lobby
        unique_guest_name = generate_unique_guest_name(lobby, guest_name)
        # Create player instance for guest
        player = Player.objects.create(guest_name=unique_guest_name, lobby=lobby)
    
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
