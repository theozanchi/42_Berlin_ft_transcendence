import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
import requests
import uuid
import json
import asyncio
import websockets
from asgiref.sync import async_to_sync, sync_to_async

# Initialize Redis client
#redis_client = redis.StrictRedis(host='localhost', port=6379, db=0)

GAME_MANAGER_REST_URL = 'http://game_manager:8000'
GAME_LOGIC_REST_URL = 'http://game_logic:8000'

GAME_LOGIC_WS_URL = 'ws://game_logic:8001/ws/socket-server/'

class APIConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.game_id = None
        await self.accept()

    async def disconnect(self, close_code):
        if self.game_id:
            await self.channel_layer.group_discard(self.game_id, self.channel_name)
        await self.close(close_code)
    
    async def receive_json(self, content):
        await self.send_json({'error': 'Invalid "type" or missing "type" in json'})

    def get_headers(self):
        return {k.decode('utf-8'): v.decode('utf-8') for k, v in self.scope['headers']}
    
    async def create_game(self, content):
        try:
            response = requests.post(GAME_MANAGER_REST_URL + '/create-game/', json=content, headers=self.get_headers())
            response.raise_for_status()

            self.game_id = response.json().get('game-id')
            await self.channel_layer.group_add(self.game_id, self.channel_name)

            await self.send_json({"game-id": self.game_id})
        
        except requests.RequestException as e:
            await self.send_json({'error': str(e)})

    async def join_game(self, content):
        self.game_id = content.get('game-id')
        await self.channel_layer.group_add(self.game_id, self.channel_name)

    async def add_players(self, content):
        try:
            response = requests.post(GAME_MANAGER_REST_URL + 'add-players', json=content, headers=self.get_headers())
            response.raise_for_status()
            game_content = response.json()
            return game_content
        
        except requests.RequestException as e:
            return({'error': str(e)})
    
    async def start_game(self, content):
        try:
            response = await requests.post(GAME_MANAGER_REST_URL + '/play-next-round/', json=content, headers=self.get_headers())
            response.raise_for_status()
            self.current_round = response.json()
            print(self.current_round)

        except requests.RequestException as e:
            return({'error': str(e)})

    async def game_state(self, content):
        #if self.current_round['player1'] != self.alias and self.current_round['player2'] != self.alias:
        #    return({'error': 'Not your turn'})
        try:
            response = await requests.post(GAME_LOGIC_REST_URL + '/game-state/', json=content, headers=self.get_headers())
            response.raise_for_status()
            game_state = response.json()
            self.channel_layer.group_send(self.game_id, game_state)
            await self.game_update(game_state)
            return ({'Status': 'Game state sent successfully'})
        except Exception as e:
            return({'error': str(e)})
        
    async def game_update(self, content):
        await self.send_json(content)
        
    async def pause_game(self, content):
        pass

    async def resume_game(self, content):
        pass
    
    async def set_alias(self, content):
        if content.get('alias'):
            self.alias = content.get('alias')
            return {'alias': self.alias}
        else:
            return {'error': 'No alias received'}

