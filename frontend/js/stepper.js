// GAME SETUP STEPPER TO GENERATE OR JOIN GAMES
// CONSIST OF:
	// STEPPER TITLEBAR
	// VIEW TO EDIT SETTINGS
	// PROCCEED/START BUTTON

// import { generateLocalGame } from './api_calls.js';
import { init, animate, resetGame, updateGameState, displayScore } from './game.js';

var newsocket;
let openPromise;
let messagePromise;
let game_id;

// For game area
export var gameStarted = false;
export var gameOver = false;
export var remote = false;
export var round_number;
export let currentPlayer;

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
					if (startGameButton) {
						startGameButton.remove();
					}
					if (data.mode === 'remote') {
						remote = true;

						if (data.player_id === 'player1')
							currentPlayer = player;
						else if (data.player_id === 'player2')
							currentPlayer = player2;
						else
							currentPlayer = 'spectator';
					}
				
                    gameStarted = true;
					round_number = data.round_number;
                    console.log('Game started! round number:', round_number);
					init();
					animate();
                }
				if (data.type === 'update') {
					if (gameStarted === false)
						return;
					if (data.content.gameOver === true) {
						console.log('Round Over. Winner is: ', data.content.winner);
						currentPlayer = null;
						//unloadLocalGame();
						// Start next round
						displayScore(data.content);

						gameStarted = false;
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