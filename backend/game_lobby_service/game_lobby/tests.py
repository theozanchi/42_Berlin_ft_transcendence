from django.test import TestCase, Client
from django.urls import reverse
import json
import time
from websocket import create_connection
# Create your tests here.

""" class TestLobbyConsumer(TestCase):
    async def create_lobby(self):
        ws = create_connection("ws://localhost:8004/ws/")
        time.sleep(2)
        ws.send(json.dumps({"action": "create_lobby", "host": "test_host"}))

    async def join_lobby(self):
        ws = create_connection("ws://localhost:8004/ws/")
        time.sleep(2)
        ws.send(json.dumps({"action": "join_lobby", "guest_name": "test_guest"})) """