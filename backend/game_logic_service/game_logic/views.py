# views.py

from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

@api_view(['GET', 'POST'])
def play_game(request):
    pass

@csrf_exempt
@api_view(['POST'])
def game_state(request):
    game_state = request.data
    game_state['type'] = 'game_update'
    # process data with logic here
    return JsonResponse(game_state)