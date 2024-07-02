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

GAME_MANAGER_REST_URL = 'http://game_manager:8000'
GAME_LOGIC_REST_URL = 'http://game_logic:8000'

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class APIConsumer(AsyncJsonWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

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
            'broadcast': self.broadcast,
            'create-game': self.create_game,
            'pause-game': self.pause_game,
            'resume-game': self.resume_game,
            'start-game': self.start_game,
            'game-state': self.game_state, # Client sends an update
            'update-game': self.update_game, # Client receives an update
            'set-alias': self.set_alias,
            'create-game': self.create_game,
            'start-game': self.start_game,
            'update-game': self.update_game,
            'join-game': self.join_game,
        }.get(type)

    async def receive_json(self, content):
        type = content.get('type')

        method = await self.get_type(type)
        if method:
            headers = {k.decode('utf-8'): v.decode('utf-8') for k, v in self.scope['headers']}
            response = await method(content, headers)
            
            await self.send_json({"type": type, **response})
       
        else:
            await self.send_json({'error': 'Invalid "type" or missing "type" in json'})

    async def broadcast(self, content):
        await self.send_json(content)

    async def create_game(self, content, headers):
        try:
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

    async def game_state(self, content):
        #if self.current_round['player1'] != self.channel_name and self.current_round['player2'] != self.channel_name:
        #    return({'error': 'Not your turn'})
        try:
            content['game_id'] = self.game_id
            response = requests.post(GAME_LOGIC_REST_URL + '/game-update/', json=content, headers=self.get_headers())
            response.raise_for_status()
        except Exception as e:
            print({'error': str(e)})
        
    async def update_game(self, content):
        await self.send_json(content)
        
    async def pause_game(self, content, headers):
        pass

    async def resume_game(self, content, headers):
        pass
    
    async def set_alias(self, content, headers):
        if content.get('alias'):
            self.alias = content.get('alias')
            return {'alias': self.alias}
        else:
            return {'error': 'No alias received'}

    async def join_game(self, content, headers):
        try:
            response = requests.post(GAME_MANAGER_REST_URL + '/join-game/', json=content, headers=headers)
            if response.status_code == 404:
                self.game_id = content.get('game-id')
                raise ValueError(f'{self.game_id} not found.')
            response.raise_for_status()
            self.game_id = response.json().get('game-id')

            await self.channel_layer.group_add(self.game_id, self.channel_name)
            await self.channel_layer.group_send(
                self.game_id,
                {
                    'type': 'broadcast',
                    'content': response.json()
                }
            )

            return response.json()
        
        except requests.RequestException as e:
            await self.send_json({'error': str(e)})
            await self.close()
        except ValueError as e:
            await self.send_json({'error': str(e)})
            await self.close()
