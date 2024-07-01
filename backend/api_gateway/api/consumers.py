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

GAME_MANAGER_REST_URL = 'http://game_manager:8000'
GAME_LOGIC_REST_URL = 'http://game_logic:8000'

class LocalConsumer(AsyncJsonWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.game_mode = 'local'
        self.game_id = None

    async def connect(self):
        self.__init__()
        await self.accept()
        await self.send_json({"connection": "success"})

    async def disconnect(self, close_code):
        if self.game_id:
            await self.channel_layer.group_discard(self.game_id, self.channel_name)
        await self.close(close_code)
    
    async def get_type(self, type):
        return {
            'create-game': self.create_game,
            'pause-game': self.pause_game,
            'resume-game': self.resume_game,
            'start-game': self.start_game,
            'game-state': self.game_state, # Client sends an update
            'update-game': self.update_game, # Client receives an update
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

    async def create_game(self, content, headers):
        try:
            content['game-mode'] = self.game_mode
            response = requests.post(GAME_MANAGER_REST_URL + '/create-game/', json=content, headers=headers)
            response.raise_for_status()
            self.game_id = response.json().get('game-id')
            if self.game_id:
                await self.channel_layer.group_add(self.game_id, self.channel_name)
            return response.json()
        
        except requests.RequestException as e:
            return({'error': str(e)})
    
    async def start_game(self, content, headers):
        try:
            response = requests.post(GAME_MANAGER_REST_URL + '/play-next-round/', json=content, headers=headers)
            response.raise_for_status()
            self.current_round = response.json()
            print(self.current_round)

        except requests.RequestException as e:
            return({'error': str(e)})

    async def game_state(self, content, headers):
        #if self.current_round['player1'] != self.alias and self.current_round['player2'] != self.alias:
        #    return({'error': 'Not your turn'})
        try:
            response = requests.post(GAME_LOGIC_REST_URL + '/game-state/', json=content, headers=headers)
            response.raise_for_status()
            game_state = response.json()
            self.channel_layer.group_send(self.game_id, game_state)
            await self.update_game(game_state)
            return ({'Status': 'Game state sent successfully'})
        except Exception as e:
            return({'error': str(e)})
        
    async def update_game(self, content):
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
    
    async def set_alias(self, content, headers):
        if content.get('alias'):
            self.alias = content.get('alias')
            return {'alias': self.alias}
        else:
            return {'error': 'No alias received'}


class RemoteConsumer(LocalConsumer):
    async def get_type(self, type):
        return {
			'join-game': self.join_game,
        }.get(type)

    async def join_game(self, content, headers):
        try:
            response = requests.post(GAME_MANAGER_REST_URL + '/join-game/', json=content, headers=headers)
            response.raise_for_status()
            response_json = response.json()
            self.game_id = response_json.get('game-id')
            if self.game_id:
                await self.channel_layer.group_add(self.game_id, self.channel_name)
            return response_json
        
        except requests.RequestException as e:
            return({'error': str(e)})
