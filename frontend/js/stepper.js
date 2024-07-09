// GAME SETUP STEPPER TO GENERATE OR JOIN GAMES
// CONSIST OF:
	// STEPPER TITLEBAR
	// VIEW TO EDIT SETTINGS
	// PROCCEED/START BUTTON

// import { generateLocalGame } from './api_calls.js';

let newsocket;
let openPromise;

function openSocket(path) {
    let openPromise, messagePromise;
    if (!newsocket || newsocket.readyState !== WebSocket.OPEN) {
        console.log('Opening new WebSocket');
        const url = `wss://${window.location.host}${path}`;
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

        newsocket.onclose = function(event) {
            console.log('Disconnected from WebSocket server.');
        };

        newsocket.onerror = function(error) {
            console.log('WebSocket error: ' + error.message);
        };
    }
    return { openPromise, messagePromise };
}

async function sendJson(json) {
	console.log("TRYING TO SEND A JSON");
    if (newsocket && newsocket.readyState === WebSocket.OPEN) {
        console.log(`Sending json to server: ${json}`);
        newsocket.send(json);
    } else {
        console.log('WebSocket is not connected.');
    }
}

function generateLocalGame() {

	console.log("GENERATING LOCAL GAME");

	let playerList = document.querySelector('player-list');
	let playerNames = playerList.getPlayerNames();

	// Create data object with action key
	let data = {action: 'create-game'}

	// Add players to JSON
	data.players = playerNames;

	openSocket('/ws/local/')
    .then(() => {
		// console.log("PREPARING JSON");
        var json = JSON.stringify(data);
		console.log(json);
        sendJson(json);
    })
    .catch(error => {
        console.error('Failed to open WebSocket connection:', error);
    });
}

function loadLocalGame() {
	// Get the game area element
    const gameArea = document.getElementById('game-column');

    // Create and append the script
    let script = document.createElement('script');
    script.type = 'module';
    // script.src = './js/pong/main.js';
    script.src = './js/game.js';
    gameArea.appendChild(script);

	console.log('Creating Game');

    // Create and append the canvas
    let canvas = document.createElement('canvas');
    canvas.id = 'bg';
    gameArea.appendChild(canvas);

}

function setGameID(gameID) {
	if (!gameID) {
		let params = new URLSearchParams(window.location.search);
		gameID = params.get('id');
	}

	let input = document.getElementById("lobbyGameID");
	if (input)
		input.value = gameID;
}

async function hostRemoteGame() {
	const { openPromise, messagePromise } = openSocket('/ws/host/');
	await openPromise;
    // console.log('MY RESPONSE');
	const message = await messagePromise;
	console.log('MY RESPONSE', message);
	const data = JSON.parse(message);
	const gameID = data['game-id'];
}

async function joinRemoteGame(gameID) {
    console.log(`JOINING: ${gameID}`);
	const { openPromise, messagePromise } = openSocket(`/ws/join/${gameID}`);
	await openPromise;
	const message = await messagePromise;
	console.log('MY RESPONSE', message);
	// const data = JSON.parse(message);
	// const gameID = data['game-id'];
	return message;
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
					loadLocalGame();
				});
			};

			myElement = document.getElementById('joinRemoteGameButton');
			if (myElement) {
				myElement.addEventListener('click', (event) => {
				event.preventDefault();
				
				let gameID = document.getElementById('searchGameID').value;

				joinRemoteGame(gameID);
				urlRoute(`/join-remote?id=${gameID}`);
			});
			};

			myElement = document.getElementById('hostRemoteGameButton');
			if (myElement) {
				myElement.addEventListener('click', (event) => {
				event.preventDefault();

				console.log("HOSTING REMOTE");

				hostRemoteGame();
				urlRoute(`/join-remote?id=${gameID}`);

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
			};
		}
	}
	
	
	customElements.define('stepper-component', StepperWrapper);