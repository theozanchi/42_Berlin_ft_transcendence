// GAME SETUP STEPPER TO GENERATE OR JOIN GAMES
// CONSIST OF:
	// STEPPER TITLEBAR
	// VIEW TO EDIT SETTINGS
	// PROCCEED/START BUTTON

// import { generateLocalGame } from './api_calls.js';

function generateLocalGame() {

	let playerList = document.querySelector('player-list');
	let playerNames = playerList.getPlayerNames();

	// Create data object with action key
	let data = {action: 'start-game'}

	// Add players to JSON
	data.players = playerNames;

	// Convert to JSON
	var json = JSON.stringify(data);

	// Send POST request
	fetch ('wss://localhost:8443/ws/local/', {
		method:		'POST',
		body:		json,
		headers:	{ 'Content-Type': 'application/json' }
	})

	// Handle response
	.then(response => response.json())
	.then(data => {
		console.log('Success:', data);
	})

	// 6. Handle errors
	.catch((error) => {
		console.error('Error:', error);
	});
	console.log(json);

alert(`Generating Game with Players: ${json}`);
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