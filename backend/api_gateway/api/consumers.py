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
redis_client = redis.StrictRedis(host='localhost', port=6379, db=0)

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

        self.pubsub = redis_client.pubsub()
        await sync_to_async(self.pubsub.subscribe)(self.game_id)

        asyncio.create_task(self.listen_to_redis())

        await self.accept()
        await self.send_json({"game-id": self.game_id})

    async def disconnect(self, close_code):
        await sync_to_async(self.pubsub.unsubscribe)(self.channel_name)
        self.pubsub.close()
        
        await self.channel_layer.group_discard(
            self.game_id,
            self.channel_name
        )

        await self.close(close_code)
    
    async def get_action(self, action):
        switcher = {
            'create-game': self.create_game,
            'start-game': self.start_game,
            'pause-game': self.pause_game,
            'resume-game': self.resume_game,
            'ready-to-play': self.ready_to_play,
            'update-game': self.update_game,
        }
        return switcher.get(action)

    async def receive_json(self, content):
        print("Consumer received message:", content, "\nHeaders: ", self.scope['headers'])
        action = content.get('action')

        method = self.get_action(action)
        if method:
            headers = {k.decode('utf-8'): v.decode('utf-8') for k, v in self.scope['headers']}
            response = method(content, headers)
            
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
                                                                                                                
    async def start_game(self, content):
        pass

    async def pause_game(self, content):
        pass

    async def resume_game(self, content):
        pass

    async def ready_to_play(self, content):
        # indicate ready for round, only applicable to players in this round
        pass

########################################## REDIS PUBSUB METHODS ##########################################
    
    async def update_game(self, content):
        data['game-id'] = self.game_id
        data += content.get('game-state')

        redis_client.publish(f'player_{self.channel_name}', json.dumps(data))
        return "Game state published."

    async def listen_to_redis(self):
        while True:
            message = await sync_to_async(self.pubsub.get_message)()
            if message and message['type'] == 'message':
                await self.send_json(json.loads(message['data']))
            await asyncio.sleep(0.01)
    
    async def game_update(self, content):
        self.send_json(content['game-state'])


class   HostConsumer(LocalConsumer):
    async def get_action(self, action):
        switcher = {
            'set-alias': self.set_alias,
            'kick-player': self.kick_player,
            'create-game': self.create_game,
            'start-game': self.start_game,
            'update-game': self.update_game,
        }
        return switcher.get(action)

    async def kick_player(self, content, headers):
        pass

    async def start_game(self, content, headers):
        pass

class RemoteConsumer(LocalConsumer):
    async def connect(self):
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        self.game_id = f'{self.game_id}'
        
        await self.channel_layer.group_add(
            self.game_id,
            self.channel_name
        )

        self.pubsub = redis_client.pubsub()
        await sync_to_async(self.pubsub.subscribe)(self.game_id)

        asyncio.create_task(self.listen_to_redis())

        await self.accept()

    async def get_action(self, action):
        switcher = {
            'set-alias': self.set_alias,
            'update-game': self.update_game,
        }
        return switcher.get(action)
    
    async def set_alias(self, content):
        self.alias = content.get('alias')
