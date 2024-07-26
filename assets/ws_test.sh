#!/bin/bash

# WebSocket server URL
WS_URL="wss://localhost:8443/ws/"

# JSON message to send
JSON_MESSAGE='{"type": "create-game", "mode": "local", "players": ["Esther", "Sofie"]}'

# Send the JSON message and ignore SSL certificate errors, then wait for the response
GAME_ID=$(echo -n "$JSON_MESSAGE" | websocat --insecure "$WS_URL" | jq -r '.["game-id"]')

# Check if GAME_ID is not empty
if [ -n "$GAME_ID" ]; then
    # Construct the next JSON message using the GAME_ID
    NEXT_MESSAGE="{\"type\": \"start-game\", \"game-id\": \"$GAME_ID\"}"

    # Send the next message
    echo -n "$NEXT_MESSAGE" | websocat --insecure "$WS_URL"
else
    echo "Failed to retrieve game ID"
fi