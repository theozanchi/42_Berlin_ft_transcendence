import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import requests
import uuid

GAME_MANAGER_URL = 'http://game_manager:8002'
GAME_LOGIC_URL = 'http://game_logic:8003'
GAME_LOBBY_URL = 'http://game_lobby:8004'

class LocalConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        print("Connected Local Consumer")
        # Establish connection
        await self.accept()

    async def disconnect(self, close_code):
        # Cleanup when connection is closed
        self.close(close_code)

    async def receive(self, text_data):
        # Handle incoming messages
        data = json.loads(text_data)
        action = data.get('action')

        switcher = {
            'create-game': self.create_game,
            #'start-game': self.start_game,
            #'pause-game': self.pause_game,
        }

        method = switcher.get(action)
        if method:
            await method(data)
        else:
            self.send(text_data=json.dumps({'error': 'Invalid action'}))
    
    async def create_game(self, data):
        try:
            response = requests.post(GAME_MANAGER_URL + '/create-game/', json=data)
            response.raise_for_status()  # Raise exception for any HTTP error status
            game_data = response.json()
            await self.send(text_data=json.dumps(game_data))
        except requests.RequestException as e:
            await self.send(text_data=json.dumps({'error': str(e)}))
                                                                                                                

class PlayerConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        print("Connected Player Consumer")
        self.lobby_id = self.scope['url_route']['kwargs']['lobby_id']
        self.group_name = f'lobby_{self.lobby_id}'
        await self.accept()
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

    async def disconnect(self, close_code):
        self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
        await self.close(close_code)

    async def receive(self, text_data):
        # Handle incoming messages
        data = json.loads(text_data)
        action = data.get('action')

        switcher = {
            'set-alias': self.set_alias,
        }

        method = switcher.get(action)
        if method:
            await method(data)
        else:
            self.send(text_data=json.dumps({'error': 'Invalid action'}))

    async def set_alias(self, data):
        self.alias = data.get('alias')

    
class   HostConsumer(PlayerConsumer):
    
    async def connect(self):
        print("Connected Host Consumer")
        self.lobby_id = str(uuid.uuid4())[:8]
        self.group_name = f'lobby_{self.lobby_id}'
        await self.accept()
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

    async def disconnect(self, close_code):
        self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
        self.close(close_code)

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')

        switcher = {
            'set-alias': self.set_alias,
            'kick-player': self.kick_player,
        }

        method = switcher.get(action)
        if method:
            await method(data)
        else:
            self.send(text_data=json.dumps({'error': 'Invalid action'}))

    async def kick_player(self, data):
        pass

    async def start_game(self, event):
        pass
    
"""     @database_sync_to_async
    async def create_game(self, event):
        pass"""