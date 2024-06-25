// GAME SETUP STEPPER TO GENERATE OR JOIN GAMES
// CONSIST OF:
	// STEPPER TITLEBAR
	// VIEW TO EDIT SETTINGS
	// PROCCEED/START BUTTON

// import { generateLocalGame } from './api_calls.js';

let newsocket;
let openPromise;

function openSocket() {
    if (!newsocket || newsocket.readyState !== WebSocket.OPEN) {
        console.log('Opening new WebSocket');
        newsocket = new WebSocket('wss://localhost:8443/ws/local/');

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
    await openSocket();
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
	let data = {action: 'start-game'}

	// Add players to JSON
	data.players = playerNames;

	// Convert to JSON
	var json = JSON.stringify(data);

	//OPEN SOCKET
	openSocket();

	// Send JSON VIA WEBSOCKET
	sendJson(json);
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
			document.getElementById('generateLocalGameButtonWS').addEventListener('click', () => {
				generateLocalGame();
			});

			document.getElementById('generateLocalGameButton').addEventListener('click', () => {
				generateLocalGame();

				document.getElementById('00-welcome').style.display = 'block';
				document.getElementById('10-local').style.display = 'none';
			});

			document.getElementById('joinRemoteGameButton').addEventListener('click', () => {
    			document.getElementById('21-remote-join').style.display = 'block';
				document.getElementById('20-remote-switch').style.display = 'none';
			});

			document.getElementById('hostRemoteGameButton').addEventListener('click', () => {
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