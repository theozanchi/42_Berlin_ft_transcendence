from django.test import TestCase

# Create your tests here.
import asyncio
import websockets
import json

async def test_websocket():
    url = "wss://localhost:8443/ws/"

    async with websockets.connect(url) as websocket:
        # Step 1: Send create game message
        create_game_message = {
            "type": "create-game",
            "game-mode": "local",
            "players": ["Player1", "Player2"]
        }
        await websocket.send(json.dumps(create_game_message))
        print("Sent create game message")

        # Step 2: Wait for create game response
        response = await websocket.recv()
        data = json.loads(response)
        print(f"Received: {data}")

        # Validate the create game response
        assert data["type"] == "create-game", "Unexpected message type"
        assert "game_id" in data, "Game ID not found in response"
        game_id = data["game_id"]
        print(f"Game ID: {game_id}")

        # Step 3: Send start game message
        start_game_message = {
            "type": "start-game"
        }
        await websocket.send(json.dumps(start_game_message))
        print("Sent start game message")

        # Step 4: Wait for start game response
        response = await websocket.recv()
        data = json.loads(response)
        print(f"Received: {data}")

        # Validate the start game response
        assert data["type"] == "start-game", "Unexpected message type"
        assert data["mode"] == "local", "Unexpected game mode"
        assert data["round_number"] == 1, "Unexpected round number"

        print("Game started successfully")

asyncio.get_event_loop().run_until_complete(test_websocket())
