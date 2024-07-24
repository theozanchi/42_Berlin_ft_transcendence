// LISTS ALL PLAYERS OF A GAME
// CONSIST OF:
	// LIST OF PLAYER-COMPONENT
	// ADD PLAYER BUTTON (OPTIONAL)

class PlayerList extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({mode: 'open'});
		this.count = 2;
		// this.gameMode = "local";avatar_blossom.png
		const gameModes = ["local", "host", "join", "friends", "online"];
		this.pongerAvatars = ['assets/avatar_blossom.png', 'assets/avatar_bubbles.png', 'assets/avatar_buttercup.png', 'assets/avatar_professor_utonium.png', 'assets/avatar_ms_kean.png', 'assets/avatar_mojo_jojo.png', 'assets/avatar_HIM.png'];
		this.PongerChars = ['Blossom', 'Bubbles', 'Buttercup', 'Professor Utonium', 'Ms. Keane', 'Mojo Jojo', 'HIM'];
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
		// console.log("rendering PlayerList");
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

		console.log(this.PongerChars.length);
		newPlayer.setAttribute('name', this.PongerChars[this.count % this.PongerChars.length]);
		newPlayer.setAttribute('avatar', this.pongerAvatars[this.count % this.pongerAvatars.length]);
		console.log
		// newPlayer.setAttribute('name', 'ThisWillChange');

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
			this.shadow.getElementById('playerCount').textContent = `${this.count} Players`;
		});

		playerList.appendChild(separator);
		playerList.appendChild(newPlayer);

		// Increase the count of players
		this.count++;

		// Update the player count display
		this.shadow.getElementById('playerCount').textContent = `${this.count} Players`;
	}

	getPlayerNames() {
		const players = this.shadow.querySelectorAll('player-component');

		let playerNames = [];

		players.forEach(player => {
			console.log(player);
			// let nameInput = player.shadowRoot.getElementById('playerNicknameInput');
			// console.log(`has this input: ${nameInput}`);
			// let name = nameInput.getAttribute('value');
			let name = player.name;
			// console.log(`has this name: ${name}`);
			playerNames.push(name);
		});

		return playerNames;
	}

	render() {

		//MODES: local, remote
		this.gameMode = this.getAttribute('mode');
		// const isRemote = this.hasAttribute('remote')
		// this.userID = this.getAttribute('userID');
		
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

				<h3 id="playerCount"> ${this.count} Players</h3>
				<div id="list-of-players">
					<player-component name="${this.PongerChars[0]}" avatar="${this.pongerAvatars[0]}" input></player-component>
					<hr class="my-0">
					<player-component name="${this.PongerChars[1]}" avatar="${this.pongerAvatars[1]}" input></player-component>
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