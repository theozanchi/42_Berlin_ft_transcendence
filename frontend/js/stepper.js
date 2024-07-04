// GAME SETUP STEPPER TO GENERATE OR JOIN GAMES
// CONSIST OF:
	// STEPPER TITLEBAR
	// VIEW TO EDIT SETTINGS
	// PROCCEED/START BUTTON

// import { generateLocalGame } from './api_calls.js';

let socket;
let openPromise;

let gameStarted = false;
let playerId;
let remote = false;

const startGameButton = document.getElementById('start-game-button');


function openSocket(path) {
	if (!socket || socket.readyState !== WebSocket.OPEN) {
		console.log('Opening new WebSocket');
		const url = `wss://${window.location.host}${path}`;
		socket = new WebSocket(url);

		openPromise = new Promise((resolve) => {
			socket.onopen = function(event) {
				console.log('Connected to WebSocket server.');
				resolve();
			};
		});

        messagePromise = new Promise((resolve) => {
            socket.onmessage = function(event) {
                console.log('Received: ' + event.data);
                resolve(event.data);
            };
        });

		socket.onmessage = function(event) {
			console.log('Received: ' + event.data);
                let data = JSON.parse(event.data);
               
                if (data.type === 'start-game') {
					if (data.mode === 'remote') {
						remote = true;
						playerId = data.player_id;
					}
                    gameStarted = true;
					loadLocalGame();
                    console.log('Game started!');
                }
				if (data.type === 'game_state') {
					updateGameState(data);
				}
		};

		socket.onclose = function(event) {
			console.log('Disconnected from WebSocket server.');
		};

		socket.onerror = function(error) {
			console.log('WebSocket error: ' + error.message);
		};
    }
		// Keep-Alive Mechanism
		function sendKeepAlive() {
			if (socket.readyState === WebSocket.OPEN) {
				socket.send(JSON.stringify({ type: 'keep_alive' }));
			}    
		}    
	
		setInterval(sendKeepAlive, 30000); // Send a keep-alive message every 30 seconds
	
	return (openPromise);
}

async function sendJson(json) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        await socket.send(json);
    } else {
        console.log('WebSocket is not connected.');
    }
}

function generateLocalGame() {

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
    })
    .catch(error => {
        console.error('Failed to open WebSocket connection:', error);
    });

	startGameButton.addEventListener('click', function() {
    	sendJson(JSON.stringify({ type: 'start-game' }));
	});
}

function loadLocalGame() {
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
    gameArea.appendChild(canvas);
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

			document.getElementById('localGameButton').addEventListener('click', () => {
				// Get the current step from the URL
				// const urlParams = new URLSearchParams(window.location.search);

				document.getElementById('00-welcome').style.display = 'none';
    			document.getElementById('10-local').style.display = 'block';
				// history.pushState({ currentStep }, `Step ${step}`, `?step=${step}`);
			});

			document.getElementById('remoteGameButton').addEventListener('click', () => {
				document.getElementById('00-welcome').style.display = 'none';
    			document.getElementById('20-remote-switch').style.display = 'block';
				
			});

			//THIS SENDS A JSON OF ALL PLAYERS TO THE WEBSOCKET AFTER ESTABLISHING A CONNECTION
/* 			document.getElementById('generateLocalGameButtonWS').addEventListener('click', () => {
				generateLocalGame();
			}); */

			document.getElementById('generateLocalGameButton').addEventListener('click', (event) => {
				event.preventDefault();

				generateLocalGame();

				// document.getElementById('00-welcome').style.display = 'block';
				document.getElementById('30-game-mode').style.display = 'block';
				document.getElementById('10-local').style.display = 'none';

			});

			document.getElementById('joinRemoteGameButton').addEventListener('click', (event) => {
				event.preventDefault();
				
				joinRemoteGame();

				document.getElementById('21-remote-join').style.display = 'block';
				document.getElementById('20-remote-switch').style.display = 'none';
			});

			document.getElementById('hostRemoteGameButton').addEventListener('click', (event) => {
				event
				hostRemoteGame();

				document.getElementById('20-remote-switch').style.display = 'none';
				document.getElementById('22-remote-host').style.display = 'block';
			});
			
			document.getElementById('startRemoteGameButton').addEventListener('click', (event) => {
				event.preventDefault();
				
				document.getElementById('00-welcome').style.display = 'block';
				document.getElementById('22-remote-host').style.display = 'none';
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