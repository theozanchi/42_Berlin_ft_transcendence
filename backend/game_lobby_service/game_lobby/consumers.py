import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.exceptions import ObjectDoesNotExist
from .models import Lobby, Player
import uuid

####### FOR JAVASCRIPT#######
""" const socket = new WebSocket('wss://yourserver.com/ws/lobby/some_lobby_id/');

socket.onclose = function(event) {
    switch(event.code) {
        case 4001:
            console.error('Authentication failed.');
            break;
        case 4002:
            console.error('Invalid lobby ID.');
            break;
        case 4003:
            console.error('Lobby is full.');
            break;
        case 4004:
            console.error('Invalid action.');
            break;
        default:
            console.error('WebSocket closed with code:', event.code);
    }
}; """
#########################################

class LobbyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Establish connection
        await self.accept()

    async def disconnect(self, close_code):
        # Leave lobby group
        await self.channel_layer.group_discard(
            self.lobby_group_name,
            self.channel_name
        )

    async def send_to_group(self, message):
        # Send message to group
        await self.channel_layer.group_send(
            self.lobby_group_name,
            {
                'type': 'chat.message',
                'message': message,
            }
        )

    async def create_lobby(self, host_name):
        while True:
            random_uuid = str(uuid.uuid4())[:8]
            if not Lobby.objects.filter(lobby_id=random_uuid).exists():
                break
    #  if request.user.is_authenticated:
  #      lobby = Lobby.objects.create(host=request.user)
  #      return {'lobby_id': lobby.lobby_id}
  # else:
  #       await self.close(code=4001)
  #      return {'error': 'User is not authenticated'}

        lobby = Lobby.objects.create(host=host_name, lobby_id=random_uuid)
        
        # Join lobby group
        await self.channel_layer.group_add(
            f'lobby_{self.lobby.lobby_id}',
            self.channel_name
        )

        return {'lobby_id': lobby.lobby_id}

    async def join_lobby(self, lobby_id, guest_name):
        self.lobby_group_name = f'{lobby_id}'

        try:
            self.lobby = await self.get_lobby(lobby_id)
        except ObjectDoesNotExist:
            await self.close(code=4002)  # Custom code for invalid lobby_id
            return {'error': 'Invalid Lobby ID'}
        
        if self.lobby.is_full():
            await self.close(code=4003)  # Custom code for full lobby
            return {'error': 'Lobby is full'}
        
        await self.add_player_to_lobby(lobby_id, guest_name)
        
        # Join lobby group
        await self.channel_layer.group_add(
            f'{self.lobby.lobby_id}',
            self.channel_name
        )
        
        await self.send_to_group(f'{self.player.display_name} has joined the lobby.')

        
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
            await self.close(code=4004)  # Custom code for invalid action
            return {'error': 'Invalid action'}

    @database_sync_to_async
    def get_lobby(self, lobby_id):
        return Lobby.objects.get(lobby_id=lobby_id)

    def generate_unique_guest_name(lobby, guest_name):
        existing_names = set(player.guest_name for player in lobby.players.all() if player.guest_name)
        existing_names.update(player.user.username for player in lobby.players.all() if player.user)

        if guest_name not in existing_names:
            return guest_name

        base_name = guest_name
        counter = 2
        while f"{base_name}#{counter}" in existing_names:
            counter += 1

        return f"{base_name}#{counter}"

    @database_sync_to_async
    def add_player_to_lobby(self, guest_name):
        self.player = Player.objects.create(lobby=self.lobby,
                              guest_name=self.generate_unique_guest_name(self.lobby, guest_name), 
                              ws_id=self.channel_name)

