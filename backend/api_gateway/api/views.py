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
    print('FROM API_GATEWAY, REQUEST=')
    print(request.headers, request.data)

    url = f'{GAME_LOBBY_URL}/create_lobby/'
    #headers = {'Content-Type': 'application/json'}
    response = requests.post(url, json=request.data, headers=request.headers)

    return Response(response.json(), status=response.status_code)

@api_view(['POST'])
def join_lobby(request):
    url = f'{GAME_LOBBY_URL}/join_lobby/'
    headers = {'Content-Type': 'application/json'}
    response = requests.post(url, payload=request.data, headers=headers)

    return Response(response.json(), status=response.status_code)

@api_view(['POST'])
def start_game(request):
    url = f'{GAME_LOBBY_URL}/verify_host/'
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {request.auth.token}'
    }
    response = requests.post(url, payload=request.data, headers=headers)

    if response.status_code != 200:
        return Response(response.payload(), status=response.status_code)
    
    url = f'{GAME_MANAGER_URL}/create_game/'
    game_data = requests.post(url, payload=request.data, headers=headers)

    # response is now serialized 'Game' model data

    return Response(response.payload(), status=response.status_code)
    


