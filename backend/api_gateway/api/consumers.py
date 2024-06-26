import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
import requests
import uuid
import json
import asyncio
import redis
import websockets
from asgiref.sync import async_to_sync, sync_to_async

# Initialize Redis client
#redis_client = redis.StrictRedis(host='localhost', port=6379, db=0)

GAME_MANAGER_REST_URL = 'http://game_manager'
GAME_LOGIC_REST_URL = 'http://game_logic:8002'

GAME_LOGIC_WS_URL = 'ws://game_logic:8001/ws/'

class LocalConsumer(AsyncJsonWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.game_mode = 'local'
        self.game_id = None

    async def connect(self):
        self.__init__()
        # Get a unique game ID from the game manager
        try:
            response = await requests.post(GAME_MANAGER_REST_URL + '/create-game/', json={'game-mode': self.game_mode})
            response.raise_for_status()
            self.game_id = response.json()['game-id']
        except requests.RequestException as e:
            return({'error': str(e)})
        
        await self.channel_layer.group_add(self.game_id, self.channel_name)
        await self.accept()
        await self.send_json({"game-id": self.game_id})

    async def disconnect(self, close_code):
        
        await self.channel_layer.group_discard(self.game_id, self.channel_name)
        await self.close(close_code)
    
    async def get_type(self, type):
        return {
            'create-game': self.create_game,
            'pause-game': self.pause_game,
            'resume-game': self.resume_game,
            'start-game': self.start_game,
            'game_state': self.game_state, # Client sends an update
            'game_update': self.game_update, # Client receives an update
        }.get(type)

    async def receive_json(self, content):
        type = content.get('type')

        method = await self.get_type(type)
        if method:
            headers = {k.decode('utf-8'): v.decode('utf-8') for k, v in self.scope['headers']}
            content['game-id'] = self.game_id
            response = await method(content, headers)
            
            await self.send_json({"type": type, **response})
       
        else:
            await self.send_json({'error': 'Invalid "type" or missing "type" in json'})

    async def initialize_game(self, content, headers):
        content['game-mode'] = 'local'
        
        try:
            response = await requests.post(GAME_MANAGER_REST_URL + '/initialize-game/', json=content, headers=headers)
            response.raise_for_status()
            game_content = response.json()
            return game_content
        
        except requests.RequestException as e:
            return({'error': str(e)})
    
    async def start_game(self, content, headers):
        try:
            response = await requests.post(GAME_MANAGER_REST_URL + '/play-next-round/', json=content, headers=headers)
            response.raise_for_status()
            self.current_round = response.json()
            print(self.current_round)

        except requests.RequestException as e:
            return({'error': str(e)})

    async def game_state(self, content, headers):
        #if self.current_round['player1'] != self.alias and self.current_round['player2'] != self.alias:
        #    return({'error': 'Not your turn'})
        try:
            response = await requests.post(GAME_LOGIC_REST_URL + '/game-state/', json=content, headers=headers)
            response.raise_for_status()
            game_state = response.json()
            self.channel_layer.group_send(self.game_id, game_state)
            await self.game_update(game_state)
            return ({'Status': 'Game state sent successfully'})
        except Exception as e:
            return({'error': str(e)})
        
    async def game_update(self, content):
        await self.send_json(content)
        
    async def pause_game(self, content, headers):
        pass

    async def resume_game(self, content, headers):
        pass

class   HostConsumer(LocalConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.game_mode = 'remote'

    async def get_type(self, type):
        return {
            'set-alias': self.set_alias,
            'create-game': self.create_game,
            'start-game': self.start_game,
            'update-game': self.update_game,
        }.get(type)
    
    async def create_game(self, content, headers):
        content['game-mode'] = 'remote'
        content['host'] = self.channel_name
        
        try:
            response = requests.post(GAME_MANAGER_REST_URL + '/create-game/', json=content, headers=headers)
            response.raise_for_status()
            game_content = response.json()
            return game_content
        
        except requests.RequestException as e:
            return({'error': str(e)})
    
    async def set_alias(self, content, headers):
        if content.get('alias'):
            self.alias = content.get('alias')
            return {'alias': self.alias}
        else:
            return {'error': 'No alias received'}


class RemoteConsumer(LocalConsumer):
    async def connect(self):
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        # ISSUE check if game id is valid
        self.game_logic_ws = None
        await self.channel_layer.group_add(self.game_id, self.channel_name)
        await self.accept()
        await self.send_json({"connect": "Successful"})

    async def get_type(self, type):
        return {
            'set-alias': self.set_alias,
            'update-game': self.update_game,
        }.get(type)
