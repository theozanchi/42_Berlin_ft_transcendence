from django.http import HttpResponse, JsonResponse
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from base.models import Game

@api_view(['POST'])
def create_game(request):
    # Access form data using request.data
    game = Game.objects.create(mode=request.data.get('game-mode'))
    # Create players for the game
    game.add_players_to_game(request.data)
    # Generate rounds for the game
    game.create_rounds()
    # Game can now be played
    #for round in game.rounds.all():
    #    round.initialize_round()
    #game.save()

    response_data = {
        'game_id': game.id, 
        'game_mode': game.mode,
        'players': [],
        'rounds': [],
        # Add more data as needed
    }

    # Populate player information
    for player in game.players.all():  # Assuming game.players is a related manager to Player model
        response_data['players'].append({
            'alias': player.alias,
        })

    # Populate round information
    for round_instance in game.rounds.all():  # Assuming game.rounds is a related manager to Round model
        response_data['rounds'].append({
            'round_number': round_instance.round_number,
            'player1': round_instance.player1,
            'player2': round_instance.player2,
        })
    

    return JsonResponse(response_data, status=200)
