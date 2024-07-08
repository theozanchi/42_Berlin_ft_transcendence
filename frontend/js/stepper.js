// GAME SETUP STEPPER TO GENERATE OR JOIN GAMES
// CONSIST OF:
	// STEPPER TITLEBAR
	// VIEW TO EDIT SETTINGS
	// PROCCEED/START BUTTON

// import { generateLocalGame } from './api_calls.js';

import { updateGameState } from './game.js';
var newsocket;
let openPromise;

// For game area
var gameStarted = false;
var playerId = null;
var remote = false;

//Create the staert button
let startGameButton = document.createElement('button');
startGameButton.textContent = 'Start Game';

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
			console.log('Received: ' + event.data);
                let data = JSON.parse(event.data);
               
				if (data.type === 'broadcast') {
					var messageElement = document.createElement('p');
					messageElement.textContent = data.message;
					messageArea.appendChild(messageElement);
				}
				if (data.type === 'create-game') {
						game_id = data.game_id;
				}
                if (data.type === 'start-game') {
					if (data.mode === 'remote') {
						remote = true;
						playerId = data.player_id;
						currentPlayer = (playerId === 'player1') ? player : player2;
					}

                    gameStarted = true;
                    console.log('Game started!');
					loadLocalGame();
					if (startGameButton) {
						startGameButton.remove();
					}
                }
				if (data.type === 'update') {
					updateGameState(data);
				}
				if (data.type === 'finish-game') {
					unloadLocalGame();
					console.log('Game finished! Winner is: ' + data.winner);
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

async function sendJson(json) {
	console.log("TRYING TO SEND A JSON");
    if (newsocket && newsocket.readyState === WebSocket.OPEN) {
        console.log(`Sending json to server: ${json}`);
        await newsocket.send(json);
    } else {
        console.log('WebSocket is not connected.');
    }
}

function createStartButton() {

	const gameArea = document.getElementById('game-column');
	if (gameArea) {
		gameArea.appendChild(startGameButton);
	} else {
		console.error('Element with id "game-column" not found');
	}
	
	// Add event listener to start game button
	startGameButton.addEventListener('click', function() {
		if (gameStarted) {
			console.log('Game already started!');
			return;
		}
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
	
	openSocket('/ws/')
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

function loadLocalGame() {
	if (!gameStarted) {
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

	console.log('Creating Game');

    // Create and append the canvas
    let canvas = document.createElement('canvas');
    canvas.id = 'bg';
    gameArea.appendChild(canvas);

}

function unloadLocalGame() {
	// Get the game area element
	const gameArea = document.getElementById('game-column');
	
	// Remove the script
	let script = gameArea.querySelector("script[src='./js/game.js']");
	if (script) {
		gameArea.removeChild(script);
	}
	
	// Remove the canvas
	let canvas = document.getElementById('bg');
	if (canvas) {
		gameArea.removeChild(canvas);
	}
}

function joinRemoteGame() {
	const gameId = document.getElementById('searchGameID').value.trim(); 
	const playerAlias = 'NewPlayer';
	let data = {type: 'join-game', 'game_id': gameId, 'game-mode': 'remote', players: [playerAlias]};

	openSocket('/ws/')
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
	// const { openPromise, messagePromise } = openSocket('/ws/host/');
	// await openPromise;
    // console.log('MY RESPONSE');
    // const message = await messagePromise;
    // console.log('MY RESPONSE', message);
	
	// Create data object with type key
	let data = {type: 'create-game', 'game-mode': 'remote', 'players': ['Player1']};

	openSocket('/ws/')
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

			document.getElementById('generateLocalGameButton').addEventListener('click', (event) => {
				event.preventDefault();

				generateLocalGame();
				console.log("heyhey");
				//loadLocalGame();
			});

			document.getElementById('joinRemoteGameButton').addEventListener('click', (event) => {
				event.preventDefault();
				
				joinRemoteGame();
			});

			document.getElementById('hostRemoteGameButton').addEventListener('click', (event) => {
				event.preventDefault();
				hostRemoteGame();

			});
			
			document.getElementById('startRemoteGameButton').addEventListener('click', (event) => {
				event.preventDefault();
				
				alert(`Get Ready to Play Your Remote Game`)	
			});

			document.getElementById('shareRemoteGameIDButton').addEventListener('click', function() {
				// Get the input field
				const input = this.previousElementSibling;
				// Get the span element containing the icon
				const iconSpan = this.querySelector('span');

				// Copy the input field's value to the clipboard
				navigator.clipboard.writeText(input.value).then(function() {
					console.log('Copying to clipboard was successful!');
										
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
		}
	}
	
	
	customElements.define('stepper-component', StepperWrapper);