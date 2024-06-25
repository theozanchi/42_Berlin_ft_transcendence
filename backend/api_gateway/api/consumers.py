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

GAME_MANAGER_URL = 'http://game_manager:8002'
GAME_LOGIC_URL = 'http://game_logic:8003'
GAME_LOBBY_URL = 'http://game_lobby:8004'

GAME_LOGIC_WS_URL = 'ws://172.20.0.6:8002/ws/'

class LocalConsumer(AsyncJsonWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.game_logic_ws = None
    
    async def connect(self):
        print("API: Connecting to local game")
        # ISSUE: check if uuid is unique / store in database
        self.game_id = str(uuid.uuid4())[:8] # self.game_id = Tournament().game_id
        
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
    
    async def get_type(self, type):
        switcher = {
            'create-game': self.create_game,
            'pause-game': self.pause_game,
            'resume-game': self.resume_game,
            'start-game': self.start_game,
            'game_state': self.update_state,
        }
        return switcher.get(type)

    async def receive_json(self, content):
        print("Consumer received message:", content)
        type = content.get('type')

        method = await self.get_type(type)
        if method:
            headers = {k.decode('utf-8'): v.decode('utf-8') for k, v in self.scope['headers']}
            content['game-id'] = self.game_id
            response = await method(content, headers)
            
            await self.send_json({"type": type, **response})
       
        else:
            await self.send_json({'error': 'Invalid type'})

    async def create_game(self, content, headers):
        content['game-mode'] = 'local'
        
        try:
            response = requests.post(GAME_MANAGER_URL + '/create-game/', json=content, headers=headers)
            response.raise_for_status()
            game_content = response.json()
            return game_content
        
        except requests.RequestException as e:
            return({'error': str(e)})
    
    async def start_game(self, content, headers):
        try:
            # Establish WebSocket connection to game_logic
            print("Getting round info...")
            #response = requests.post(GAME_MANAGER_URL + '/play-next-round/', json=content, headers=headers)
            #response.raise_for_status()
            #self.current_round = response.json()
            #print(self.current_round)

            print("Connecting to game logic")
            self.game_logic_ws = await websockets.connect(GAME_LOGIC_WS_URL + self.game_id + '/')

        except requests.RequestException as e:
            return({'error': str(e)})

    async def update_state(self, content, headers):
        # Only for testing purposes

        print("API: Updating state")
        if self.game_logic_ws is None:
            await self.start_game(content, headers)
            #return({'error': 'Game not started'})
        #if self.current_round['player1'] != self.alias and self.current_round['player2'] != self.alias:
        #    return({'error': 'Not your turn'})
        
        try:
            await self.game_logic_ws.send_json(content)
        except Exception as e:
            return({'error': str(e)})
        
    async def game_update(self, event):
        print("API: Game update received from game logic via channel group")
        await self.send_json(event)
        
    async def pause_game(self, content, headers):
        pass

    async def resume_game(self, content, headers):
        pass

class   HostConsumer(LocalConsumer):
    async def get_type(self, type):
        switcher = {
            'set-alias': self.set_alias,
            'create-game': self.create_game,
            'start-game': self.start_game,
            'update-game': self.update_game,
        }
        return switcher.get(type)
    
    async def create_game(self, content, headers):
        content['game-mode'] = 'remote'
        content['host'] = self.channel_name
        
        try:
            response = requests.post(GAME_MANAGER_URL + '/create-game/', json=content, headers=headers)
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
        
        await self.channel_layer.group_add(
            self.game_id,
            self.channel_name
        )

        await self.accept()
        await self.send_json({"connect": "Successful"})

    async def get_type(self, type):
        switcher = {
            'set-alias': self.set_alias,
            'update-game': self.update_game,
        }
        return switcher.get(type)
    
    async def set_alias(self, content):
        self.alias = content.get('alias')
