# views.py

from rest_framework.views import APIView
from rest_framework.response import Response

from django.http import HttpResponse
from rest_framework.views import APIView

from .tournament import generate_tournament_tree, serialize_tree

class GameConfigAPIView(APIView):
    def post(self, request):
        # Access form data using request.data
        game_type = request.data.get('game-type')
        player_count = request.data.get('player-count')
        players = [request.data.get(f'player-{i}') for i in range(1, int(player_count) + 1)]
        
        response = {'message': 'POST request received', 'game_type': game_type, 'player_count': player_count, 'players': players}
        
        if player_count > 2: 
            tree = serialize_tree(generate_tournament_tree(player_count, players))
            response.update(tree)

        return Response(response)
