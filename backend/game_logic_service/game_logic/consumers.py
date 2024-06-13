import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
import logging

logging.basicConfig(level=logging.INFO)

class PongConsumer(WebsocketConsumer):
    game_state = {
        'player1': {'x': 0, 'y': 0, 'z': 1},
        'player2': {'x': 0, 'y': 0, 'z': -1},
        'ball': {'x': 0, 'y': 0, 'z': 0},
        'ballSpeed': {'x': 0, 'y': 0, 'z': 0},
        'playerTurn': True,  # Initial value, assuming player 1 starts
        'playerScore': 0,
        'aiScore': 0,
        'ballIsHeld': True  # Initial value, assuming ball is held initially
    }

    def connect(self):
        self.accept()
        self.room_group_name = 'pong_game'

        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )

        # Send initial game state to the newly connected client
        self.send(text_data=json.dumps({
            'type': 'game_state',
            'player1': self.game_state['player1'],
            'player2': self.game_state['player2'],
            'ball': self.game_state['ball'],
            'ballSpeed': self.game_state['ballSpeed'],
            'playerTurn': self.game_state['playerTurn'],
            'playerScore': self.game_state['playerScore'],
            'aiScore': self.game_state['aiScore'],
            'ballIsHeld': self.game_state['ballIsHeld']
        }))

    def disconnect(self, close_code):
        # Leave room group
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )

    def receive(self, text_data):
        data = json.loads(text_data)

        if data['type'] == 'game_state':
            self.game_state['player1'] = data['player1']
            self.game_state['player2'] = data['player2']
            self.game_state['ball'] = data['ball']
            self.game_state['ballSpeed'] = data['ballSpeed']
            self.game_state['playerTurn'] = data['playerTurn']
            self.game_state['playerScore'] = data['playerScore']
            self.game_state['aiScore'] = data['aiScore']
            self.game_state['ballIsHeld'] = data['ballIsHeld']

            # Broadcast updated game state to the room group
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'game_update',
                    'player1': self.game_state['player1'],
                    'player2': self.game_state['player2'],
                    'ball': self.game_state['ball'],
                    'ballSpeed': self.game_state['ballSpeed'],
                    'playerTurn': self.game_state['playerTurn'],
                    'playerScore': self.game_state['playerScore'],
                    'aiScore': self.game_state['aiScore'],
                    'ballIsHeld': self.game_state['ballIsHeld']
                }
            )

    def game_update(self, event):
        # Send updated game state to WebSocket
        self.send(text_data=json.dumps({
            'type': 'game_state',
            'player1': event['player1'],
            'player2': event['player2'],
            'ball': event['ball'],
            'ballSpeed': event['ballSpeed'],
            'playerTurn': event['playerTurn'],
            'playerScore': event['playerScore'],
            'aiScore': event['aiScore'],
            'ballIsHeld': event['ballIsHeld']
        }))
