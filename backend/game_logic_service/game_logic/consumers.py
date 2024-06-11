import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.exceptions import ObjectDoesNotExist
from .models import GamePosition, Lobby, Player

####### FOR JAVASCRIPT#######
""" const socket = new WebSocket('wss://yourserver.com/ws/lobby/some_lobby_id/');

socket.onclose = function(event) {
    switch(event.code) {
        case 4001:
            console.error('Position out of bounds.');
            break;
        default:
            console.error('WebSocket closed with code:', event.code);
    }
}; """
#########################################

class LobbyConsumer(AsyncWebsocketConsumer):
    game = GamePosition()

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

    async def update_position(self, position):
        if self.channel_name == self.game.player1.ws_id:
            player = self.game.player1
        for pos in position[]:
            player.pos = pos

        
    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action', '')
        
        if action == 'update_position':
            await self.create_lobby(data.get("positon", []))
        else:
            await self.close(code=4004)  # Custom code for invalid action
            return {'error': 'Invalid action'}


