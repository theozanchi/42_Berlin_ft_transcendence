const socketUrl = 'ws://localhost:8000/ws/lobby/'; // WebSocket URL
const apiUrl = 'http://localhost:8000/api/'; // API URL for creating/joining lobby

let websocket;

function connectWebSocket() {
    websocket = new WebSocket(socketUrl);
    websocket.onopen = () => {
        console.log('WebSocket connection established');
    };
    websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    websocket.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
    };
}

function createLobby() {
    // Send POST request to create a lobby
    const guestName = document.getElementById('guestName').value;
    fetch(apiUrl + 'create_lobby/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ guest_name: guestName })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Create lobby response:', data);
        if (data.websocket_id) {
            connectWebSocket();
        }
    })
    .catch(error => {
        console.error('Error creating lobby:', error);
    });
}

function joinLobby() {
    // Send POST request to join a lobby
    const guestName = document.getElementById('guestName').value;
    const lobbyId = document.getElementById('lobbyId').value;
    fetch(apiUrl + 'join_lobby/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            guest_name: guestName,
            lobby_id: lobbyId,
            websocket_id: websocket?.url // Pass the WebSocket URL as websocket_id
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Join lobby response:', data);
        if (data.message) {
            connectWebSocket();
        }
    })
    .catch(error => {
        console.error('Error joining lobby:', error);
    });
}
