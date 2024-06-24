from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework import status
from base.models import GameConfig
from base.models import TreeNode

@api_view(['POST'])
def postConfig(request):
    # Access form data using request.data
    game_type = request.data.get('game-type')
    player_count = request.data.get('player-count')
    players = [request.data.get(f'player-{i}') for i in range(1, int(player_count) + 1)]
    
    config = GameConfig(
        game_type=game_type,
        player_count=player_count,
        players=players,
        tree=TreeNode(players).serialize_tree()
    )
    return Response(config.to_dict())
