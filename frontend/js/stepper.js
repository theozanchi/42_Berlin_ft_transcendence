// GAME SETUP STEPPER TO GENERATE OR JOIN GAMES
// CONSIST OF:
	// STEPPER TITLEBAR
	// VIEW TO EDIT SETTINGS
	// PROCCEED/START BUTTON

// import { generateLocalGame } from './api_calls.js';

let newsocket;
let openPromise;

function openSocket(path) {
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

        newsocket.onmessage = function(event) {
            console.log('Received: ' + event.data);
        };

        newsocket.onclose = function(event) {
            console.log('Disconnected from WebSocket server.');
        };

        newsocket.onerror = function(error) {
            console.log('WebSocket error: ' + error.message);
        };
    }
    return openPromise;
}

async function sendJson(json) {
    if (newsocket && newsocket.readyState === WebSocket.OPEN) {
        console.log(`Sending json to server: ${json}`);
        newsocket.send(json);
    } else {
        console.log('WebSocket is not connected.');
    }
}

function generateLocalGame() {

	let playerList = document.querySelector('player-list');
	let playerNames = playerList.getPlayerNames();

	// Create data object with action key
	let data = {action: 'create-game'}

	// Add players to JSON
	data.players = playerNames;

	openSocket('/ws/local/')
    .then(() => {
        var json = JSON.stringify(data);
        sendJson(json);
    })
    .catch(error => {
        console.error('Failed to open WebSocket connection:', error);
    });
}

function joinRemoteGame() {
	const gameId = document.getElementById('searchGameID').value.trim(); 

	uri = `/ws/join/${gameId}/`;
	openSocket(uri);
}

function hostRemoteGame() {
	openSocket('/ws/host/');
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

				document.getElementById('00-welcome').style.display = 'block';
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
			
			document.getElementById('startRemoteGameButton').addEventListener('click', () => {
				document.getElementById('00-welcome').style.display = 'block';
				document.getElementById('22-remote-host').style.display = 'none';
				alert(`Get Ready to Play Your Remote Game`)	
			});

			document.getElementById('shareRemoteGameIDButton').addEventListener('click', function() {
				// Get the input field
				const input = this.previousElementSibling;
			
				// Copy the input field's value to the clipboard
				navigator.clipboard.writeText(input.value).then(function() {
					console.log('Copying to clipboard was successful!');
				}, function(err) {
					console.error('Could not copy text: ', err);
				});
			});
		}
	}
	
	
	customElements.define('stepper-component', StepperWrapper);