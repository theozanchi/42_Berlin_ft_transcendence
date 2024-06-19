import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
import requests
import uuid
import json
import asyncio
import redis
from asgiref.sync import async_to_sync, sync_to_async

# Initialize Redis client
#redis_client = redis.StrictRedis(host='localhost', port=6379, db=0)

GAME_MANAGER_URL = 'http://game_manager:8002'
GAME_LOGIC_URL = 'http://game_logic:8003'
GAME_LOBBY_URL = 'http://game_lobby:8004'

class LocalConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        # ISSUE: check if uuid is unique / store in database
        self.game_id = str(uuid.uuid4())[:8]
        self.game_id = f'{self.game_id}'
        
        await self.channel_layer.group_add(
            self.game_id,
            self.channel_name
        )

        await self.accept()
        await self.send_json({"game-id": self.game_id})

    async def disconnect(self, close_code):
        
        await self.channel_layer.group_discard(
            self.game_id,
            self.channel_name
        )

        await self.close(close_code)
    
    async def get_action(self, action):
        switcher = {
            'create-game': self.create_game,
            'pause-game': self.pause_game,
            'resume-game': self.resume_game,
            'ready-to-play': self.ready_to_play,
            'update-game': self.update_game,
        }
        return switcher.get(action)

    async def receive_json(self, content):
        print("Consumer received message:", content, "\nHeaders: ", self.scope['headers'])
        action = content.get('action')

        method = await self.get_action(action)
        if method:
            headers = {k.decode('utf-8'): v.decode('utf-8') for k, v in self.scope['headers']}
            content['game-id'] = self.game_id
            response = await method(content, headers)
            
            await self.send_json({"action": action, **response})
       
        else:
            await self.send_json({'error': 'Invalid action'})

    async def create_game(self, content, headers):
        content['game-mode'] = 'local'
        
        try:
            response = requests.post(GAME_MANAGER_URL + '/create-game/', json=content, headers=headers)
            response.raise_for_status()
            game_content = response.json()
            return game_content
        
        except requests.RequestException as e:
            return({'error': str(e)})
    
    async def ready_to_play(self, content, headers):
        try:
            response = requests.post(GAME_MANAGER_URL + '/play-next-round/', json=content, headers=headers)
            response.raise_for_status()
            round_result = response.json()
            return round_result
        
        except requests.RequestException as e:
            return({'error': str(e)})

    async def update_game(self, content, headers):
        try:
            response = requests.post(GAME_LOGIC_URL + '/update-game/', json=content, headers=headers)
            response.raise_for_status()
            game_state = response.json()
            self.channel_layer.group_send(game_state.get('game_id'), {
                'type': 'update_game_state',
                'game_state': game_state
            })
            return "Game state published to channel."
        
        except requests.RequestException as e:
            return({'error': str(e)})
        
    async def pause_game(self, content, headers):
        pass

    async def resume_game(self, content, headers):
        pass

class   HostConsumer(LocalConsumer):
    async def get_action(self, action):
        switcher = {
            'set-alias': self.set_alias,
            'kick-player': self.kick_player,
            'create-game': self.create_game,
            'ready-to-play': self.start_game,
            'update-game': self.update_game,
        }
        return switcher.get(action)
    
    async def set_alias(self, content, headers):
        if content.get('alias'):
            self.alias = content.get('alias')
            return {'alias': self.alias}
        else:
            return {'error': 'No alias received'}
        
    async def kick_player(self, content, headers):
        pass


class RemoteConsumer(LocalConsumer):
    async def connect(self):
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        self.game_id = f'{self.game_id}'
        
        await self.channel_layer.group_add(
            self.game_id,
            self.channel_name
        )

        await self.accept()
        await self.send_json({"connect": "Successful"})

    async def get_action(self, action):
        switcher = {
            'set-alias': self.set_alias,
            'update-game': self.update_game,
        }
        return switcher.get(action)
    
    async def set_alias(self, content):
        self.alias = content.get('alias')
