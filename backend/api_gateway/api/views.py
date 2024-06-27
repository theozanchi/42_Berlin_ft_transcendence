from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.viewsets import GenericViewSet
from rest_framework.permissions import AllowAny
from rest_framework import viewsets
from rest_framework.decorators import action
import requests

GAME_MANAGER_URL = 'http://game_manager'
GAME_LOGIC_URL = 'http://game_logic'

@api_view(['GET'])
def get_game(self, request):
    response = requests.get(self.GAME_MANAGER_URL + '/get-game/')
    return Response(response.json(), status=response.status_code)

@api_view(['POST'])
def create_game(self, request):
    response = requests.post(self.GAME_MANAGER_URL + '/create-game/', json=request.data)
    return Response(response.json(), status=response.status_code)

@api_view(['PUT'])
def update_game(self, request):
    response = requests.put(self.GAME_MANAGER_URL + '/update-game/', json=request.data)
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

