// GAME SETUP STEPPER TO GENERATE OR JOIN GAMES
// CONSIST OF:
	// STEPPER TITLEBAR
	// VIEW TO EDIT SETTINGS
	// PROCCEED/START BUTTON

// import { generateLocalGame } from './api_calls.js';

function generateLocalGame() {

	let playerList = document.querySelector('player-list');
	let playerNames = playerList.getPlayerNames();

	// 2. Create data obejct
	let data = { players: playerNames };

	// 3. Convert to JSON
	var json = JSON.stringify(data);

	// 4. Send POST request
	fetch ('ws://localhost:8443/local', {
		method:		'POST',
		body:		json,
		headers:	{ 'Content-Type': 'application/json' }
	})

	// 5. Handle response
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
				const urlParams = new URLSearchParams(window.location.search);
				// const currentStep = parseInt(urlParams.get('step') || '1');
				// alert(currentStep);
			
				// Navigate to the next step
				// navigate(currentStep + 1);
				document.getElementById('00-welcome').style.display = 'none';
    			document.getElementById('10-local').style.display = 'block';
				// history.pushState({ currentStep }, `Step ${step}`, `?step=${step}`);
			});

			document.getElementById('remoteGameButton').addEventListener('click', () => {
				document.getElementById('00-welcome').style.display = 'none';
    			document.getElementById('20-remote-switch').style.display = 'block';
				
			});

			document.getElementById('generateLocalGameButton').addEventListener('click', () => {
				document.getElementById('00-welcome').style.display = 'block';
				document.getElementById('10-local').style.display = 'none';
				// generateLocalGame();
				// document.addEventListener('DOMContentLoaded', generateLocalGame());
				setTimeout(generateLocalGame(), 1000);
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