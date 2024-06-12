import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class APIConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        print("Connected API Consumer")
        # Establish connection
        await self.accept()

    async def disconnect(self, close_code):
        # Cleanup when connection is closed
        pass

    async def receive(self, text_data):
        # Handle incoming messages
        pass