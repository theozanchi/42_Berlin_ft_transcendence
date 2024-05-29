from django.http import HttpResponse, JsonResponse
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from base.models import Game

@api_view(['POST'])
def postGame(request):
    # Access form data using request.data
    game = Game.objects.create(game_mode=request.data.get('game-mode'))
    # Create players for the game
    game.add_players_to_game(request.data)
    # Generate rounds for the game
    game.create_rounds()

    response_data = {
        'game_id': game.id, 
        'game_mode': game.mode,
        'rounds': game.rounds.all,
        'players': [],
        # Add more data as needed
    }

    # Populate player information
    for player in game.players.all():  # Assuming game.players is a related manager to Player model
        response_data['players'].append({
            'alias': player.alias,
        })
    
    # Game can now initialize itself by calling game.initialize_rounds
    return JsonResponse(response_data, status=200)
