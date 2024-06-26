import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
import asyncio
import redis
import time
#from rest.framework import request
from threading import Thread

# Initialize Redis client
redis_client = redis.StrictRedis(host='localhost', port=6379, db=0)

GAME_MANAGER_URL = 'http://game_manager:8002'

class GameLogic:
    def __init__(self):
        self.pubsub = redis_client.pubsub()
        self.games = {}

    def create_game(self, game_id):
        self.games[game_id] = {
            'player1': {'x': 0, 'y': 0, 'z': 1},
            'player2': {'x': 0, 'y': 0, 'z': -1},
            'ball': {'x': 0, 'y': 0, 'z': 0},
            'ballSpeed': {'x': 0, 'y': 0, 'z': 0},
            'playerTurn': True,
            'player1_score': 0,
            'player2_score': 0,
            'ballIsHeld': True
        }

    def finish_game(self, game_id):
        """ player1_score = self.games[game_id]['player1_score']
        player2_score = self.games[game_id]['player2_score']
        winner = 'player1' if player1_score > player2_score else 'player2'
        response = request.post(f'{GAME_MANAGER_URL}/finish-game', json={'game_id': game_id, 'winner': winner, 'player1_score': player1_score, 'player2_score': player2_score}) """
        if game_id in self.games:
            del self.games[game_id]

    def start_listening(self):
        self.pubsub.psubscribe('player_*')
        while True:
            print('Listening for updates...')
            message = self.pubsub.get_message()
            if message and message['type'] == 'pmessage':
                self.process_update(json.loads(message['data']))
            time.sleep(0.01)

    def process_update(self, data):
        print('Processing update:', data)
        game_id = data['game_id']
        if not game_id in self.games:
            self.create_game(game_id)
        game_state = self.games.get(game_id)

        # update game_state now based on the data
        # game logic ......

        # update game instance and publish the update
        self.games[game_id].update(game_state)
        redis_client.publish(f'game_id', json.dumps(game_state))

if __name__ == "__main__":
    print('Starting Game Logic Service...')
    game_logic_service = GameLogic()
    game_logic_service.start_listening()
