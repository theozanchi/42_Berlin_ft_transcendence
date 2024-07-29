// GAME SETUP STEPPER TO GENERATE OR JOIN GAMES
// CONSIST OF:
	// STEPPER TITLEBAR
	// VIEW TO EDIT SETTINGS
	// PROCCEED/START BUTTON

import { init, updateGameState, displayScore } from './game.js';

import { initTournament, updateTournament } from './tournament.js';

import { urlRoute } from './url-router.js';

import { updatePlayingGameInfo } from './tournament.js';

import { setGameID } from './lobby.js';

import { replacePlayerList } from './player_list.js';

// import { startGameButton } from './lobby.js';

export var newsocket;
let openPromise;
let messagePromise;
let game_id;
let is_host = false;

// For game area
export var gameStarted = false;
export var gameOver = false;
export var remote = false;
export var round_number;
export var player_id;

export function setGameStarted(value) {
    gameStarted = value;
}

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

async function handleMessage(data) {
	switch (data.type) {	
		case 'broadcast':
			console.log('Broadcast:', data);

			if (data.content.message === 'tournament-over') {
				console.log('Game Over. Winner is: ' + data.content.winner);
				newsocket.close();
				displayScore(data.content.winner);
				alert('Game Over. Winner is: ' + data.content.winner);
				urlRoute('/')
			}
			break;
		
		case 'create-game':
			console.log('Game created:', data);
			game_id = data.game_id;
			is_host = true;
			if (data.mode === 'local') {
				urlRoute(`/game?id=${game_id}`);
				sendJson(JSON.stringify({ type: 'start-game' }));
			} else {
				urlRoute(`/host-remote?id=${game_id}`);

				await replacePlayerList(data.users);
			}
			break;
		
		case 'start-game':
			if (data.mode === 'remote') {
				remote = true;
				player_id = data.player_id;
				console.log('Player ID:', player_id);
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
				// Start next round

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
			console.log('Round:', data);
			switch (data.action) {
				case 'new':
					initTournament(data);
					break;
				case 'update':
					updateTournament(data);
					break;
			}
			let startedRound = data.content.find(round => round.status === 'started');
			if (startedRound)
				updatePlayingGameInfo(startedRound);
			break;

		case 'new-player':
			await replacePlayerList(data.content.users);
			 if (is_host && data.content.users.length > 1){
				let startRemoteButton = document.getElementById('StartRemoteGameButton');
				startRemoteButton.removeAttribute('disabled');
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
		console.log(json);
    }
}

function generateLocalGame() {

	let playerList = document.querySelector('player-list');
	let playerData = playerList.getPlayerData();
	console.log(playerData);
	
	// Create data object with type key
	let data = {type: 'create-game'}
	data['mode'] = 'local';
	
	// Add players to JSON
	// data.players = playerNames;
	data.players = playerData; // THIS SENDS AVATARS TO BACKEND

	openSocket()
    .then(() => {
        var json = JSON.stringify(data);
        sendJson(json);
    })
    .catch(error => {
        console.error('Failed to open WebSocket connection:', error);
    });
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
	
	let data = {type: 'join-game', 'game_id': gameId, 'mode': 'remote', 'user_id': userId};

	openSocket()
	.then(() => {
        var json = JSON.stringify(data);
		console.log('Sending JSON:', data);
        sendJson(json);
		urlRoute('join-remote?id=' + gameId);
    })
    .catch(error => {
        console.error('Failed to open WebSocket connection:', error);
    });
}

async function hostRemoteGame() {	
	// Create data object with type key
	const userId = await getCurrentUser();
	let data = {type: 'create-game', 'mode': 'remote', 'user_id': userId};

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

	class StepperWrapper extends HTMLElement {
		constructor() {
			super();
			this.shadow = this.attachShadow({mode: 'open'});
		}
	
		connectedCallback() {
			console.log("rendering stepper form");
			this.setupEventListeners();
			setGameID();
		}

		setupEventListeners() {
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
					if (is_host) {
						sendJson(JSON.stringify({ type: 'start-game' }));
					} else {
						alert('Only the host can start the game.');
					}
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

			myElement = document.getElementById('shareUrlRemoteGameIDButton');
			if (myElement) {
				myElement.addEventListener('click', function() {
					// Get the input field
					const input = this.previousElementSibling.previousElementSibling;
					// Get the span element containing the icon
					const iconSpan = this.querySelector('span');
			
					// Construct the URL
					const url = `${window.location.origin}/join-remote?id=${input.value}`;
			
					// Copy the constructed URL to the clipboard
					navigator.clipboard.writeText(url).then(function() {
						// Change the icon to bi-share-fill
						iconSpan.className = 'bi bi-share-fill';
						// Set a timeout to change the icon back to bi-share after 3 seconds
						setTimeout(function() {
							iconSpan.className = 'bi bi-share';
						}, 3000);
					}, function(err) {
						console.error('Could not copy text: ', err);
					});
				});
			}
		}
	}
	
	customElements.define('stepper-component', StepperWrapper);