
import asyncio
import websockets
import ssl
import json

async def test_websocket():
    # Create an SSL context that does not verify the certificate
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    url = "wss://localhost:8443/ws/"

    async with websockets.connect(url, ssl=ssl_context) as websocket:
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
        assert data["type"] == "round", "Unexpected message type"
        assert data["action"] == "new", "Unexpected action"

        print("Game started successfully")

        # Step 5: Receive player ID
        response = await websocket.recv()
        data = json.loads(response)
        print(f"Received: {data}")

        # Validate the player ID
        assert "player_id" in data, "Player ID not found in response"

        game_state = {
            'type': 'game-state',
            'aiming_angle': 0 , # Initialize aiming_angle
            'aimingSpeed': 0.05,  # Example speed value, adjust as needed
            'maxaiming_angle': 1.57,  # Example max angle value (90 degrees in radians)
            'minaiming_angle': -1.57, 
            'cube_size': 2,
            'ball_radius': 0.05,
            'resetting_ball': False,
            'update_interval': 1 / 60,

            'player1': {'x': 0, 'y': 0, 'z': 1, 'rotation': {'x': 0, 'y': 0, 'z': 0}},
            'player2': {'x': 0, 'y': 0, 'z': -1, 'rotation': {'x': 0, 'y': 0, 'z': 0}},
            'ball': {'x': 0, 'y': 0, 'z': 0},
            'ballSpeed': {'x': 0, 'y': 0, 'z': 0},
            'playerTurn': True,  # Initial value, assuming player 1 starts
            'player1Score': 0,
            'player2Score': 0,
            'ballIsHeld': True,  # Initial value, assuming ball is held initially
            'current_face': 0,  # Adding initial value for current face
            'current_face2': 1,
            'wall_hits' : 0,
            'aiming_angle' : 0,
            'reset_ball': False,
            'is_processing': False,
            'current_player': None,
            'player1': {
                'x': 0,  # Player 1's position on the X-axis
                'y': 0,  # Player 1's position on the Y-axis
                'z': 0,  # Player 1's position on the Z-axis
                'rotation': {
                    'x': 0,  # Player 1's rotation around the X-axis
                    'y': 180,  # Player 1's rotation around the Y-axis to face Player 2
                    'z': 0  # Player 1's rotation around the Z-axis
                }
            },
            'player2': {
                'x': 10,  # Player 2's position on the X-axis, 10 units away from Player 1
                'y': 0,  # Player 2's position on the Y-axis
                'z': 0,  # Player 2's position on the Z-axis
                'rotation': {
                    'x': 0,  # Player 2's rotation around the X-axis
                    'y': 0,  # Player 2's rotation around the Y-axis to face Player 1
                    'z': 0  # Player 2's rotation around the Z-axis
                }
            },
        }
        print(f"Sending game state: {game_state}")
        await websocket.send(json.dumps(game_state))

        response = await websocket.recv()
        data = json.loads(response)
        print(f"Received: {data}")




asyncio.get_event_loop().run_until_complete(test_websocket())
