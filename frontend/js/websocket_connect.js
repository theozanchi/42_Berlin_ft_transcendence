let socket;
const baseUrlWithoutProtocol = `${document.location.hostname}${(document.location.port ? `:${document.location.port}` : '')}`;

function connectWebSocket() {
	// Check if WebSocket is already open
	if (socket && socket.readyState === WebSocket.OPEN) {
		alert('WebSocket is already connected.');
		return;
	}

	// Connect to WebSocket server
	socket = new WebSocket(`wss://${baseUrlWithoutProtocol}/ws/local/`);

	socket.onopen = function(event) {
		logMessage('Connected to WebSocket server.');
	};

	socket.onmessage = function(event) {
		logMessage('Received: ' + event.data);
	};

	socket.onclose = function(event) {
		logMessage('Disconnected from WebSocket server.');
	};

	socket.onerror = function(error) {
		logMessage('WebSocket error: ' + error.message);
	};

	return socket;
}

function disconnectWebSocket() {
	if (socket) {
		socket.close();
	}
}

function sendMessage(message) {
	if (socket && socket.readyState === WebSocket.OPEN) {
		socket.send(message);
		logMessage('Sent: ' + message);
	} else {
		alert('WebSocket is not connected.');
	}
}

function logMessage(message) {
	const messagesArea = document.getElementById('messages');
	messagesArea.value += message + '\n';
}