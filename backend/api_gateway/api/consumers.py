import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
import requests
import uuid

GAME_MANAGER_URL = 'http://game_manager:8002'
GAME_LOGIC_URL = 'http://game_logic:8003'
GAME_LOBBY_URL = 'http://game_lobby:8004'

GAME_MANAGER_HOST = 'game_manager'
GAME_LOGIC_HOST = 'game_logic'
GAME_LOBBY_HOST = 'game_lobby'

class LocalConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        print("Connected Local Consumer")
        await self.accept()

    async def disconnect(self, close_code):
        await self.close(close_code)

    async def receive_json(self, content):
        action = content.get('action')

        switcher = {
            'create-game': self.create_game,
            #'start-game': self.start_game,
            #'pause-game': self.pause_game,
        }

        method = switcher.get(action)
        if method:
            headers = {k.decode('utf-8'): v.decode('utf-8') for k, v in self.scope['headers']}
            await method(content, headers)
        else:
            await self.send_json({'error': 'Invalid action'})

    async def create_game(self, content, headers):
        content['game-mode'] = 'local'
        try:
            response = requests.post(GAME_MANAGER_URL + '/create-game/', json=content, headers=headers)
            response.raise_for_status()
            game_content = response.json()
            await self.send_json(game_content)
        except requests.RequestException as e:
            await self.send_json({'error': str(e)})
                                                                                                                
    async def start_game(self, content):
        pass

    async def pause_game(self, content):
        pass


class PlayerConsumer(AsyncJsonWebsocketConsumer):
    
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
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
        await self.close(close_code)

    async def receive(self, content):
        # Handle incoming messages
        content = json.loads(content)
        action = content.get('action')

        switcher = {
            'set-alias': self.set_alias,
        }

        method = switcher.get(action)
        if method:
            await method(content)
        else:
           await self.send_json({'error': 'Invalid action'})

    async def set_alias(self, content):
        self.alias = content.get('alias')

    
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
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
        await self.close(close_code)

    async def receive(self, content):
        action = content.get('action')

        switcher = {
            'set-alias': self.set_alias,
            'kick-player': self.kick_player,
        }

        method = switcher.get(action)
        if method:
            headers = {k.decode('utf-8'): v.decode('utf-8') for k, v in self.scope['headers']}
            await method(content, headers)
        else:
            await self.send_json({'error': 'Invalid action'})

    async def kick_player(self, content, headers):
        pass

    async def start_game(self, content, headers):
        pass
    
"""     @database_sync_to_async
    async def create_game(self, event):
        pass"""