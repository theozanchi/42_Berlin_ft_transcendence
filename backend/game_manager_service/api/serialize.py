from game_manager.models import Game, Player, Round

def serialize_game_data(game):
    response_data = {
        'game_id': game.id, 
        'game_mode': game.mode,
        'players': [],
        'rounds': [],
    }

    # Populate player information
    for player in game.players.all():  # game.players is a related manager to Player model
        response_data['players'].append({
            'guest_name': player.guest_name,
        })

    # Populate round information
    for round_instance in game.rounds.all():  # game.rounds is a related manager to Round model
        response_data['rounds'].append({
            'round_number': round_instance.round_number,
            'player1': round_instance.player1,
            'player2': round_instance.player2,
        })
    return response_data