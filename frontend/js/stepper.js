// GAME SETUP STEPPER TO GENERATE OR JOIN GAMES
// CONSIST OF:
	// STEPPER TITLEBAR
	// VIEW TO EDIT SETTINGS
	// PROCCEED/START BUTTON

import { init, animate, resetGame, updateGameState, displayScore } from './game.js';

import { initTournament, updateTournament } from './tournament.js';

import { urlRoute } from './url-router.js';

// import { startGameButton } from './lobby.js';

var newsocket;
let openPromise;
let messagePromise;
let game_id;

// For game area
export var gameStarted = false;
export var gameOver = false;
export var remote = false;
export var round_number;
export var player_id;

export function openSocket() {
	if (!newsocket || newsocket.readyState !== WebSocket.OPEN) {
		const url = `wss://${window.location.host}/ws/`;
		newsocket = new WebSocket(url);

		openPromise = new Promise((resolve) => {
			newsocket.onopen = function(event) {
				resolve();
			};
		});

        messagePromise = new Promise((resolve) => {
            newsocket.onmessage = function(event) {
                resolve(event.data);
            };
        });

		newsocket.onmessage = function(event) {
			let data = JSON.parse(event.data);
			handleMessage(data);
		};

		newsocket.onclose = function(event) {
			console.log('Disconnected from WebSocket server.');
		};

		newsocket.onerror = function(error) {
			console.log('WebSocket error: ' + error.message);
		};
    
		return (openPromise);
	}
}

function handleMessage(data) {
	switch (data.type) {	
		case 'broadcast':
			console.log('Broadcast:', data);

			if (data.content.message === 'tournament-over') {
				console.log('Game Over. Winner is: ' + data.content.winner);
				newsocket.close();
				displayScore(data.content.winner);
			}
			break;
		
		case 'create-game':
			game_id = data.game_id;
			console.log('Game ID:', game_id);
			break;
		
		case 'start-game':
			// if (startGameButton) {
			// 	startGameButton.remove();
			// }
			if (data.mode === 'remote') {
				remote = true;
				player_id = data.player_id;
				console.log('Player ID:', player);
			}
			gameStarted = true;
			round_number = data.round_number;
			console.log('Game started! round number:', round_number);
			init();
			break;
		
		case 'update':
			if (gameStarted === false)
				return;
			if (data.content.gameOver === true) {
				console.log('Round Over. Winner is: ', data.content.winner);
				player_id = null;
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
			break;

		case 'round':
			switch (data.action) {
				case 'new':
					initTournament(data);
					break;
				case 'update':
					updateTournament(data);
					break;
			}
			break;
	}
}

export async function sendJson(json) {
	//console.log("TRYING TO SEND A JSON");
    if (newsocket && newsocket.readyState === WebSocket.OPEN) {
        await newsocket.send(json);
    } else {
        console.log('WebSocket is not connected.');
    }
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

		sendJson(JSON.stringify({ type: 'start-game' }));
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

async function getCurrentUser() {
    try {
        const response = await fetch('/api/user_mgt/me');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('User credentials received:', data);
        return data.user_id;
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        return null;
    }
}

async function joinRemoteGame() {
	const gameId = document.getElementById('searchGameID').value.trim();

	const userId = await getCurrentUser();
	
	let data = {type: 'join-game', 'game_id': gameId, 'game-mode': 'remote', 'user_id': userId};

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
	const userId = await getCurrentUser();
	let data = {type: 'create-game', 'game-mode': 'remote', 'user_id': userId};

	openSocket()
    .then(() => {
		urlRoute("/host-remote");
        var json = JSON.stringify(data);
		console.log('Sending JSON:', data);
        sendJson(json);
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
			console.log("rendering stepper form");

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


			myElement = document.getElementById('StartRemoteGameButton');
			if (myElement) {
				myElement.addEventListener('click', (event) => {
					urlRoute('/game');
					event.preventDefault();
					sendJson(JSON.stringify({ type: 'start-game' }));
					console.log('Start Game button clicked');
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