import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
import requests
import uuid
import json
import asyncio
import websockets
import logging
from asgiref.sync import async_to_sync, sync_to_async

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

GAME_MANAGER_REST_URL = 'http://game_manager:8000'
GAME_LOGIC_REST_URL = 'http://game_logic:8001'

class APIConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        self.game_id = None
        self.host = False

        await self.accept()

    async def disconnect(self, close_code):
        if self.game_id:
            await self.channel_layer.group_discard(self.game_id, self.channel_name)
        self.channel_layer.group_send(self.game_id, 
            {'type': 'broadcast', 
            'content': {'player': self.alias, 
            'message': 'left the game'}})
        await self.close(close_code)
    
    async def receive_json(self, content):
        logging.debug('received: ' + str(content))
        type_to_method = {
            'broadcast': self.broadcast,
            'game-state': self.game_state,
            'create-game': self.create_game,
            'join-game': self.join_game,
            'start-game': self.start_game,
            'set-alias': self.set_alias
        }

        method = type_to_method.get(content.get('type'))

        if method:
            await method(content)
        else:
            await self.send_json({'error': 'Invalid type or missing type in json'})

    def get_headers(self):
        return {k.decode('utf-8'): v.decode('utf-8') for k, v in self.scope['headers']}
    
    async def broadcast(self, content):
        logging.debug('broadcasting: ' + str(content))
        await self.send_json(content)

    async def create_game(self, content):
        try:
            response = requests.post(GAME_MANAGER_REST_URL + '/create-game/', json=content, headers=self.get_headers())
            response.raise_for_status()

            self.game_id = response.json().get('game-id')
            self.player_count = 1
            await self.channel_layer.group_add(self.game_id, self.channel_name)

            await self.send_json({"game-id": self.game_id})
        
        except requests.RequestException as e:
            await self.send_json({'error': str(e)})

    async def create_game(self, content):
        try:
            response = requests.post(GAME_MANAGER_REST_URL + '/create-game/', json=content, headers=self.get_headers()) 
            response.raise_for_status()
            self.game_id = response.json().get('game-id')
            self.host = True
            if self.game_id:
                await self.channel_layer.group_add(self.game_id, self.channel_name)
            return response.json()
        
        except requests.RequestException as e:
            self.send_json({'error': str(e)})
    
    async def start_game(self, content):
        if self.host is not True:
            return {'error': 'Only host can start game'}
        if self.player_count < 2:
            return {'error': 'Not enough players to start game'}
        try:
            response = requests.get(GAME_MANAGER_REST_URL + '/round/${self.game_id}', headers=self.get_headers())
            response.raise_for_status()
            self.current_round = response.json()
            await self.channel_layer.group_send(self.game_id, {'type': 'player_id', 'content': self.current_round})

        except requests.RequestException as e:
            self.send_json({'error': str(e)})
    
    def player_id(self, content):
        if self.current_round['player1'] == self.channel_name:
            self.player_id = 'player1'
        elif self.current_round['player2'] == self.channel_name:
            self.player_id = 'player2'
        else:
            self.player_id = 'spectator'
        self.send_json({'type': 'start-game', 'player_id': self.player_id})

    async def game_state(self, content):
        #if self.current_round['player1'] != self.channel_name and self.current_round['player2'] != self.channel_name:
        #    return({'error': 'Not your turn'})
        try:
            content['game_id'] = self.game_id
            response = requests.post(GAME_LOGIC_REST_URL + '/game-update/', json=content, headers=self.get_headers())
            response.raise_for_status()
            self.channel_layer.group_send(self.game_id, response.json())
        except Exception as e:
            print({'error': str(e)})
        
    async def update(self, content):
        await self.send_json(content)

    async def set_alias(self, content):
        if content.get('alias'):
            self.alias = content.get('alias')
            self.send_json({'alias': self.alias})
        else:
            return {'error': 'No alias received'}

    async def join_game(self, content, headers):
        try:
            response = requests.post(GAME_MANAGER_REST_URL + '/join-game/', json=content, headers=self.get_headers())
            if response.status_code == 404:
                self.game_id = content.get('game-id')
                raise ValueError(f'{self.game_id} not found.')
            response.raise_for_status()
            self.game_id = response.json().get('game-id')
            await self.channel_layer.group_add(self.game_id, self.channel_name)
            await self.game_status(content, headers)
            return response.json()
        
        except requests.RequestException as e:
            await self.send_json({'error': str(e)})
            await self.close()
        except ValueError as e:
            await self.send_json({'error': str(e)})
            await self.close()
