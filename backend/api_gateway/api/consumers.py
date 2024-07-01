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
GAME_LOGIC_REST_URL = 'http://game_logic:8001'

class APIConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.game_id = None
        await self.accept()

        #TEST
        self.game_id = 'test'
        await self.channel_layer.group_add(self.game_id, self.channel_name)
        #

        await self.send_json({'message': {'channel_name': self.channel_name}})

    async def disconnect(self, close_code):
        if self.game_id:
            await self.channel_layer.group_discard(self.game_id, self.channel_name)
        await self.close(close_code)
    
    async def receive_json(self, content):
        type_to_method = {
            'game-state': self.game_state,
            'create-game': self.create_game,
            'join-game': self.join_game,
            'leave-game': self.leave_game,
            'add-players': self.add_players,
            'start-game': self.start_game,
            'game-update': self.game_update,
            'pause-game': self.pause_game,
            'resume-game': self.resume_game,
            'set-alias': self.set_alias
        }

        method = type_to_method.get(content.get('type'))

        if method:
            await method(content)
        else:
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
        if self.game_id:
            await self.send_json({'error': 'Already in a game'})
            return
        self.game_id = content.get('game-id')
        await self.channel_layer.group_add(self.game_id, self.channel_name)
        await self.channel_layer.group_send(self.game_id, {'type': 'player_joined', 'content': {'player': self.alias}})

    async def leave_game(self, content):
        self.channel_layer.group_send(self.game_id, 
            {'type': 'player_left', 
            'content': {'player': self.alias, 
            'message': 'left the game'}})

    async def add_players(self, content):
        try:
            response = requests.post(GAME_MANAGER_REST_URL + 'add-players', json=content, headers=self.get_headers())
            response.raise_for_status()
            self.send_json(response.json())
        
        except requests.RequestException as e:
            self.send_json({'error': str(e)})
    
    async def start_game(self, content):
        if self.host is not True:
            return {'error': 'Only host can start game'}
        try:
            response = requests.post(GAME_MANAGER_REST_URL + '/play-next-round/', json=content, headers=self.get_headers())
            response.raise_for_status()
            self.current_round = response.json()
            await self.channel_layer.group_send(self.game_id, {'type': 'game-start', 'content': self.current_round})

        except requests.RequestException as e:
            self.send_json({'error': str(e)})
    
    def game_start(self, content):
        if self.current_round['player1'] == self.channel_name:
            self.player_id = 'player1'
        elif self.current_round['player2'] == self.channel_name:
            self.player_id = 'player2'
        else:
            self.player_id = 'spectator'
        self.send_json({'type': 'init-game', 'player_id': self.player_id})

    async def game_state(self, content):
        #if self.current_round['player1'] != self.channel_name and self.current_round['player2'] != self.channel_name:
        #    return({'error': 'Not your turn'})
        try:
            response = requests.post(GAME_LOGIC_REST_URL + '/game-update/', json=content, headers=self.get_headers())
            response.raise_for_status()
            print("response from game logic: ", response.json())
        except Exception as e:
            print({'error': str(e)})
        
    async def game_update(self, content):
        print('game_update received:' + str(content))
        
        await self.send_json(content)
        
    async def pause_game(self, content):
        pass

    async def resume_game(self, content):
        pass
    
    async def set_alias(self, content):
        if content.get('alias'):
            self.alias = content.get('alias')
            self.send_json({'alias': self.alias})
        else:
            return {'error': 'No alias received'}

