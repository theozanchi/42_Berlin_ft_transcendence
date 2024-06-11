from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import requests

GAME_MANAGER_URL = 'http://game_manager:8002'
GAME_LOGIC_URL = 'http://game_logic:8003'
GAME_LOBBY_URL = 'http://game_lobby:8004'


@api_view(['POST'])
def create_lobby(request):
    url = f'{GAME_LOBBY_URL}/create_lobby/'
    response = requests.post(url, json=request.data, headers=request.headers)

    return Response(response.json(), status=response.status_code)

@api_view(['POST'])
def join_lobby(request):
    url = f'{GAME_LOBBY_URL}/join_lobby/'
    response = requests.post(url, json=request.data, headers=request.headers)

    return Response(response.json(), status=response.status_code)

@api_view(['POST'])
def start_game(request):
    url = f'{GAME_MANAGER_URL}/create_game/'
    request.data['game-mode'] = 'local'
    response = requests.post(url, json=request.data, headers=request.headers)

    return Response(response.json(), status=response.status_code)
    
#INITIATE REMOTE GAME
# MUST PASS ON WEBSOCKET ID OF ALL PLAYERS TO THE GAME LOGIC
# MUST DELETE LOBBY OBJECT FROM DATABASE SO ONLY ACTIVE LOBBIES ARE SAVED
"""     if request.data.get('lobby-id'):
        url = f'{GAME_LOBBY_URL}/verify_host/'
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {request.auth.token}'
        }
        response = requests.post(url, json=request.data, headers=headers)
        if response.status_code != 200:
            return Response(response.payload(), status=response.status_code)
        game_mode = 'remote'

    else:
        game_mode = 'local' """

