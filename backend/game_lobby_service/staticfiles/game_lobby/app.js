const apiUrl = 'http://localhost:8000/api/';

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const csrftoken = getCookie('csrftoken');

function createLobby() {
    const guestName = document.getElementById('guestName').value;
    fetch(apiUrl + 'create_lobby/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
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
    const guestName = document.getElementById('guestName').value;
    const lobbyId = document.getElementById('lobbyId').value;
    fetch(apiUrl + 'join_lobby/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify({
            guest_name: guestName,
            lobby_id: lobbyId
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

function connectWebSocket() {
    const socketUrl = 'ws://localhost:8000/ws/lobby/';
    const websocket = new WebSocket(socketUrl);
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
