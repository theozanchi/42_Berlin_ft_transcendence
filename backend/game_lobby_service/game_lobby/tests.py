from django.test import TestCase
from channels.testing import WebsocketCommunicator
from game_lobby_service.asgi import application
import json
import asyncio

class TestLobbyConsumer(TestCase):
    
    def test_create_lobby(self):
        print('Running test_create_lobby')
        async def async_test():
            communicator = WebsocketCommunicator(application, "")
            connected, subprotocol = await communicator.connect()
            self.assertTrue(connected)

            await communicator.send_json_to({"action": "create_lobby", "host": "test_host"})
            response = await communicator.receive_json_from()
            print(f"Received message: {response}")
            await communicator.disconnect()

        # Run the async test
        loop = asyncio.get_event_loop()
        loop.run_until_complete(async_test())

    def test_join_lobby(self):
        print('Running test_join_lobby')
        async def async_test():
            communicator = WebsocketCommunicator(application, "")
            connected, subprotocol = await communicator.connect()
            self.assertTrue(connected)

            await communicator.send_json_to({"action": "join_lobby", "lobby_id": None, "guest_name": "test_guest"})
            response = await communicator.receive_json_from()
            print(f"Received message: {response}")
            await communicator.disconnect()

        # Run the async test
        loop = asyncio.get_event_loop()
        loop.run_until_complete(async_test())

    def test_create_and_join(self):
        print('Running test_create_and_join')
        async def async_test():
            communicator = WebsocketCommunicator(application, "")
            connected, subprotocol = await communicator.connect()
            self.assertTrue(connected)

            await communicator.send_json_to({"action": "create_lobby", "host": "test_host"})
            response = await communicator.receive_json_from()
            print(f"Received message: {response}")
            lobby_id = response['lobby_id']  # Save the lobby ID for later use
            
            await communicator.send_json_to({"action": "join_lobby", "lobby_id": lobby_id, "guest_name": "test_guest"})
            response = await communicator.receive_json_from()
            print(f"Received message: {response}")
            await communicator.disconnect()

        # Run the async test
        loop = asyncio.get_event_loop()
        loop.run_until_complete(async_test())
