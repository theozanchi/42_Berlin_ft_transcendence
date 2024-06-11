# views.py

from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.http import HttpResponse, JsonResponse
from .models import GamePosition, Player

@api_view(['GET', 'POST'])
def play_game(request):
    ball_pos = {0, 0, 0}
    game = GamePosition(player1=Player(ws_id=request.data.get('player1.ws_id')), player2=Player(ws_id = request.data.get('player2.ws_id')), ball_pos=ball_pos)
    
