// LISTS ALL PLAYERS OF A GAME
// CONSIST OF:
	// LIST OF PLAYER-COMPONENT
	// ADD PLAYER BUTTON (OPTIONAL)

	import { setProfileImage } from "./profile.js";

	import { pongerAvatars, PongerChars } from "./login_signup.js";
	
	class PlayerList extends HTMLElement {
		constructor() {
			super();
			this.shadow = this.attachShadow({mode: 'open'});
			this.count = 2;
			const gameModes = ["local", "host", "join", "friends", "online"];
		}
	
		get count() {
			return this.getAttribute("count");
		}
	
		set count(val) {
			this.setAttribute("count", val);
		}
	
		static get observedAttributes() {
			return ["count"];
		}
		
		inc () {
			this.count++;
		}
		
		dec () {
			this.count--;
		}
	
		connectedCallback() {
			this.render();
	
			if (this.gameMode === 'local')
				this.shadow.getElementById('addPlayerButton').addEventListener('click', () => {
					this.addPlayer();
				});
		}
	
		addPlayer() {
			let playerList = this.shadow.getElementById('list-of-players');
	
			let newPlayer = document.createElement('player-component');
			let separator = document.createElement('hr');
			separator.style.margin = '6px';
	
			newPlayer.setAttribute('name', PongerChars[this.count % PongerChars.length]);
			newPlayer.setAttribute('avatar', pongerAvatars[this.count % pongerAvatars.length]);
	
			if (this.gameMode === 'local')
				newPlayer.setAttribute('input', '');
			if (this.gameMode === 'host' || this.gameMode === 'local')
				newPlayer.setAttribute('remove-button', '');
	
			// Add an event listener for the 'removePlayer' event
			newPlayer.addEventListener('removePlayer', () => {
				let separator = newPlayer.previousElementSibling;
				if (separator) {
					newPlayer.parentNode.removeChild(separator);
				}
				playerList.removeChild(newPlayer);
				this.dec();
				if (this.count < 7)
					addPlayerButton.removeAttribute('disabled', '');
				this.shadow.getElementById('playerCount').textContent = `${this.count} Players`;
			});
	
			playerList.appendChild(separator);
			playerList.appendChild(newPlayer);
	
			// Increase the count of players
			this.count++;
	
			// (de-)achtivate add-player button for 7 participants
			let addPlayerButton = this.shadow.getElementById('addPlayerButton');
			if (this.count == 7)
				addPlayerButton.setAttribute('disabled', '');
			else
				addPlayerButton.removeAttribute('disabled');
	
			// Update the player count display
			this.shadow.getElementById('playerCount').textContent = `${this.count} Players`;
		}
	
		getPlayerData() {
			const players = this.shadow.querySelectorAll('player-component');
		
			let playerData = {};
		
			players.forEach((player, index) => {
						let name = player.name;
						let avatar = player.avatar;
						playerData[`player${index}`] = { name : name, avatar : avatar};
					});
		
			return (playerData);
		}
	
		getPlayerNames() {
			const players = this.shadow.querySelectorAll('player-component');
	
			let playerNames = [];
	
			players.forEach(player => {
				let name = player.name;
				playerNames.push(name);
			});
	
			return playerNames;
		}
	
		render() {
			this.gameMode = this.getAttribute('mode');
			
			if (this.gameMode === 'remote') {
				this.shadow.innerHTML = `
				<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"></link>
				<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
				<div id="list-of-players"></div>
				
				<div class="d-flex justify-content-center">
					<div class="spinner-border" role="status">	<span class="visually-hidden">Loading...</span></div><p>Waiting for Players to join</p>
				</div>
				`;
	
			} else if (this.gameMode === 'local') {
				this.shadow.innerHTML = `
					<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"></link>
					<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
	
					<h3 id="playerCount"> ${this.count} Players (7 max)</h3>
					<div id="list-of-players">
						<player-component name="${PongerChars[0]}" avatar="${pongerAvatars[0]}" input></player-component>
						<hr class="my-0">
						<player-component name="${PongerChars[1]}" avatar="${pongerAvatars[1]}" input></player-component>
					</div>
					
					<div class="d-flex justify-content-center">
						<button id="addPlayerButton" class="btn btn-outline-primary d-flex"><i class="bi bi-plus-lg"></i>Add Player</button>
					</div>
					`;
			}
			else
				throw new Error (`Error: Unknown gamemode: ${this.gameMode}`);
		}
	}
	
	customElements.define('player-list', PlayerList);
	
	export async function replacePlayerList(usersArray) {
		let playerList = document.getElementById('list-of-players');
		if (playerList) {
			while (playerList.firstChild) {
				playerList.removeChild(playerList.firstChild);
			}
	
			for (const playerData of usersArray) {
				let newPlayer = document.createElement('player-component');
				let separator = document.createElement('hr');
				separator.style.margin = '6px';
	
				const avatar = await setProfileImage(playerData.user_id);
	
				newPlayer.setAttribute('name', playerData.username);
				newPlayer.setAttribute('avatar', avatar);
	
				// Append the new player component to the last player-component's parent
				playerList.appendChild(separator);
				playerList.appendChild(newPlayer);
			}
		} else {
			console.error('No list-of-players found');
		}
	}
	