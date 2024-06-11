import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.exceptions import ObjectDoesNotExist
from .models import Lobby, Player
import uuid

class LobbyConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        print('Connected')
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def send_to_group(self, message):
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'chat.message',
                'message': message,
            }
        )

    async def create_lobby(self, host_name):
        print('Creating lobby')
        while True:
            random_uuid = str(uuid.uuid4())[:8]
            if not await self.lobby_exists(random_uuid):
                break

        lobby = await self.create_lobby_record(host_name, random_uuid)
        self.group_name = f'lobby_{lobby.lobby_id}'

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.send(text_data=json.dumps({'lobby_id': lobby.lobby_id}))

    async def join_lobby(self, lobby_id, guest_name):
        print('Joining lobby with ID: ', lobby_id)

        try:
            await self.get_lobby(lobby_id)
        except ObjectDoesNotExist:
            await self.send(text_data=json.dumps({'error': 'Invalid Lobby ID'}))
            await self.close(code=4002)

        if await self.is_lobby_full(lobby_id):
            await self.send(text_data=json.dumps({'error': 'Lobby is full'}))
            await self.close(code=4003)

        await self.add_player_to_lobby(guest_name, lobby_id)
        
        self.group_name = f'{lobby_id}'

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.send_to_group(f'{self.player.display_name} has joined the lobby.')
        await self.send(text_data=json.dumps({'message': f'Joined lobby {lobby_id}'}))

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action', '')

        if action == 'create_lobby':
            await self.create_lobby(data.get('host', ''))
        elif action == 'join_lobby':
            await self.join_lobby(data.get('lobby_id', ''), data.get('guest_name', ''))
        elif action == 'send_message':
            await self.send_message_to_group(data.get('message', ''))
        else:
            await self.send(text_data=json.dumps({'error': 'Invalid action'}))
            await self.close(code=4004)

    @database_sync_to_async
    def get_lobby(self, lobby_id):
        return Lobby.objects.get(lobby_id=lobby_id)

    @database_sync_to_async
    def is_lobby_full(self, lobby_id):
        lobby = Lobby.objects.get(lobby_id=lobby_id)
        return lobby.is_full()

    @database_sync_to_async
    def lobby_exists(self, lobby_id):
        return Lobby.objects.filter(lobby_id=lobby_id).exists()

    @database_sync_to_async
    def create_lobby_record(self, host_name, lobby_id):
        return Lobby.objects.create(host=host_name, lobby_id=lobby_id)

    @database_sync_to_async
    def add_player_to_lobby(self, guest_name, lobby_id):
        lobby = Lobby.objects.get(lobby_id=lobby_id)
        self.player = Player.objects.create(lobby=lobby,
                                            guest_name=self.generate_unique_guest_name(lobby, guest_name),
                                            ws_id=self.channel_name)

    def generate_unique_guest_name(self, lobby, guest_name):
        existing_names = set(player.guest_name for player in lobby.players.all() if player.guest_name)
        existing_names.update(player.user.username for player in lobby.players.all() if player.user)

        if guest_name not in existing_names:
            return guest_name

        base_name = guest_name
        counter = 2
        while f"{base_name}#{counter}" in existing_names:
            counter += 1

        return f"{base_name}#{counter}"
