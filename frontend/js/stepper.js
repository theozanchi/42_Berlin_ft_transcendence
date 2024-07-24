// GAME SETUP STEPPER TO GENERATE OR JOIN GAMES
// CONSIST OF:
	// STEPPER TITLEBAR
	// VIEW TO EDIT SETTINGS
	// PROCCEED/START BUTTON

// import { generateLocalGame } from './api_calls.js';
import { init, updateGameState, displayScore } from './game.js';

var newsocket;
let openPromise;
let messagePromise;
let game_id;

// For game area
export var gameStarted = false, gameOver = false, remote = false;
export var round_number;
export var player_id;

//Create the staert button
let startGameButton = document.createElement('button');
startGameButton.textContent = 'START ROUND';  // Set the text content of the button

// Add a margin to the top of the button
startGameButton.style.marginTop = '100px';  // Adjust this value as needed

function openSocket() {
	if (!newsocket || newsocket.readyState !== WebSocket.OPEN) {
		console.log('Opening new WebSocket');
		const url = `wss://${window.location.host}/ws/`;
		newsocket = new WebSocket(url);

		openPromise = new Promise((resolve) => {
			newsocket.onopen = function(event) {
				console.log('Connected to WebSocket server.');
				resolve();
			};
		});

        messagePromise = new Promise((resolve) => {
            newsocket.onmessage = function(event) {
                console.log('Received: ' + event.data);
                resolve(event.data);
            };
        });

		newsocket.onmessage = function(event) {
			//console.log('Received: ' + event.data);
			let data = JSON.parse(event.data);
				if (data.type === 'broadcast') {
					console.log('Broadcast:', data);

					if (data.content.message === 'tournament-over') {
						console.log('Game Over. Winner is: ' + data.content.winner);
						newsocket.close();
						displayScore(data.content.winner);
					}
				}
				if (data.type === 'create-game') {
						game_id = data.game_id;
						console.log('Game ID:', game_id);
				}
                if (data.type === 'start-game') {
					console.log('Game starting...');
					if (startGameButton) {
						startGameButton.remove();
					}
					if (data.mode === 'remote') {
						remote = true;

						player_id = data.player_id;
					}
				
                    gameStarted = true;
					round_number = data.round_number;
					init();
                }
				if (data.type === 'update') {
					if (gameStarted === false)
						return;
					if (data.content.gameOver === true) {
						console.log('Round Over. Winner is: ', data.content.winner);
						gameStarted = false;
						player_id = null;

						//createStartButton();
						if (gameStarted) {
							console.log('Game already started!');
							return;
						}
						console.log('SENDING Starting game...');
						sendJson(JSON.stringify({ type: 'start-game' }));
					}
					else {
						updateGameState(data);
					}
				}
		};

		newsocket.onclose = function(event) {
			console.log('Disconnected from WebSocket server.');
		};

		newsocket.onerror = function(error) {
			console.log('WebSocket error: ' + error.message);
		};
    }
/* 		// Keep-Alive Mechanism
		function sendKeepAlive() {
			if (socket.readyState === WebSocket.OPEN) {
				socket.send(JSON.stringify({ type: 'keep_alive' }));
			}    
		}    
	
		setInterval(sendKeepAlive, 30000); // Send a keep-alive message every 30 seconds
	 */
	return (openPromise);
}

export async function sendJson(json) {
	//console.log("TRYING TO SEND A JSON");
    if (newsocket && newsocket.readyState === WebSocket.OPEN) {
        await newsocket.send(json);
    } else {
        console.log('WebSocket is not connected.');
    }
}

function createStartButton() {
    const canvas = document.getElementById('bg');
    const canvasContainer = canvas.parentNode;
    
    // Ensure the container has a relative position
    canvasContainer.style.position = 'relative';
    
    // Assuming startGameButton is already created elsewhere in your code
    startGameButton.style.position = 'absolute';
    startGameButton.style.top = '35%'; // Center vertically
    startGameButton.style.left = '50%'; // Center horizontally
    startGameButton.style.transform = 'translate(-50%, -50%)'; // Adjust to center precisely
	// Additional styling for the start game button
	startGameButton.style.backgroundColor = 'lightcoral'; // Light red color
	startGameButton.style.color = 'white'; // Text color
	startGameButton.style.border = 'none'; // Remove default border
	startGameButton.style.borderRadius = '20px'; // Rounded corners
	startGameButton.style.padding = '20px 40px'; // Padding inside the button
	startGameButton.style.fontFamily = 'Arial, sans-serif'; // Different font
	startGameButton.style.fontSize = '24px'; // Font size
	startGameButton.style.fontWeight = 'bold'; // Bold font weight
	startGameButton.style.cursor = 'pointer'; // Cursor on hover
	startGameButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)'; // Optional: Add a subtle shadow for depth
		
    if (canvasContainer) {
        canvasContainer.appendChild(startGameButton);
        console.log('Start Game Button created on top of the canvas');
    } else {
        console.error('Container for canvas with id "bg" not found');
    }
    
	
	// Add event listener to start game button
	startGameButton.addEventListener('click', function() {
		if (gameStarted) {
			console.log('Game already started!');
			return;
		}
		console.log('SENDING Starting game...');
		sendJson(JSON.stringify({ type: 'start-game' }));
	});
}

function generateLocalGame() {

	console.log("GENERATING LOCAL GAME");

	let playerList = document.querySelector('player-list');
	let playerNames = playerList.getPlayerNames();
	
	// Create data object with type key
	let data = {type: 'create-game'}
	data['game-mode'] = 'local';
	
	// Add players to JSON
	data.players = playerNames;

	openSocket()
    .then(() => {
		console.log("PREPARING JSON");
        var json = JSON.stringify(data);
		console.log(json);
        sendJson(json);

		createStartButton();
    })
    .catch(error => {
        console.error('Failed to open WebSocket connection:', error);
    });
}

function loadLocalGame() {
/* 	if (!gameStarted) {
		console.error('Game not started yet!');
		return;
	}

	// Get the game area element
    const gameArea = document.getElementById('game-column');

    // Create and append the script
    let script = document.createElement('script');
    script.type = 'module';
    script.src = './js/game.js';
    gameArea.appendChild(script);

    // Create and append the canvas
    let canvas = document.createElement('canvas');
    canvas.id = 'bg';
    gameArea.appendChild(canvas); */
	//init();
	return;
}

function joinRemoteGame() {
	const gameId = document.getElementById('searchGameID').value.trim(); 
	const playerAlias = 'NewPlayer';
	let data = {type: 'join-game', 'game_id': gameId, 'game-mode': 'remote', players: [playerAlias]};

	openSocket()
	.then(() => {
        var json = JSON.stringify(data);
		console.log('Sending JSON:', data);
        sendJson(json);
    })
    .catch(error => {
        console.error('Failed to open WebSocket connection:', error);
    });
}

async function hostRemoteGame() {	
	// Create data object with type key
	let data = {type: 'create-game', 'game-mode': 'remote', 'players': ['Player1']};

	openSocket()
    .then(() => {
        var json = JSON.stringify(data);
		console.log('Sending JSON:', data);
        sendJson(json);

		
		createStartButton();
    })
    .catch(error => {
        console.error('Failed to open WebSocket connection:', error);
    });
}

	class StepperWrapper extends HTMLElement {
		constructor() {
			super();
			this.shadow = this.attachShadow({mode: 'open'});
		}
	
		connectedCallback() {
			// console.log("rendering stepper form");

			// let myElement = document.querySelector('')

			let myElement = document.getElementById('generateLocalGameButton');
			if (myElement) {
				myElement.addEventListener('click', (event) => {
					event.preventDefault();

					generateLocalGame();
				});
			};

			myElement = document.getElementById('joinRemoteGameButton');
			if (myElement) {
				myElement.addEventListener('click', (event) => {
				event.preventDefault();
				
				joinRemoteGame();
			});
			};

			myElement = document.getElementById('hostRemoteGameButton');
			if (myElement) {
				myElement.addEventListener('click', (event) => {
				event.preventDefault();
				console.log('hosting remote');
				hostRemoteGame();

			});
			};


			myElement = document.getElementById('startRemoteGameButton');
			if (myElement) {
				myElement.addEventListener('click', (event) => {
					event.preventDefault();
					
					alert(`Get Ready to Play Your Remote Game`)	
				});
			};

			myElement = document.getElementById('shareRemoteGameIDButton');
			if (myElement) {
				myElement.addEventListener('click', function() {
				// Get the input field
				const input = this.previousElementSibling;
				// Get the span element containing the icon
				const iconSpan = this.querySelector('span');

				// Copy the input field's value to the clipboard
				navigator.clipboard.writeText(input.value).then(function() {
										
					// Change the icon to bi-clipboard-check
					iconSpan.className = 'bi bi-clipboard-check';
					// Set a timeout to change the icon back to bi-clipboard after 3 seconds
					setTimeout(function() {
						iconSpan.className = 'bi bi-clipboard';
					}, 3000);
				}, function(err) {
					console.error('Could not copy text: ', err);
				});
			});
			};
		}
	}
	
	
	customElements.define('stepper-component', StepperWrapper);