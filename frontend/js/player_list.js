// LISTS ALL PLAYERS OF A GAME
// CONSIST OF:
	// LIST OF PLAYER-COMPONENT
	// ADD PLAYER BUTTON (OPTIONAL)

class PlayerList extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({mode: 'open'});
		this.count = 1;
		// this.gameMode = "local";
		const gameModes = ["local", "host", "join"];
		const 	PongerChars = ['Blossom', 'Bubbles', 'Buttercup', 'Professor Utonium', 'The Mayor of Townsville', 'Ms. Bellum', 'Ms. Keane', 'Narrator', 'Talking Dog', 'Mitch Mitchelson', 'Stanley Whitfield', 'Mojo Jojo', 'Fuzzy Lumpkins', 'HIM', 'Princess Morbucks', 'The Gangreen Gang', 'The Amoeba Boys', 'Sedusa', 'The Rowdyruff Boys'];
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

		// newPlayer.setAttribute('name', `${this.PongerChars[this.count]}`);
		newPlayer.setAttribute('name', 'ThisWillChange');

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
		let players = this.shadow.querySelectorAll('player-component');

		let playerNames = [];

		players.forEach(player => {
			let name = player.getAttribute('name');
			playerNames.push(name);
		});

		return playerNames;
	}

	render() {
		this.gameMode = this.getAttribute('mode');

		// if (!gameModes.includes(gameMode))
			// console.error(`invalid game mode: ${gameMode}`);

		this.shadow.innerHTML = `
			<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"></link>
			<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">

			<h3 id="playerCount"> ${this.count} Players</h3>
			<div id="list-of-players" style="max-height: 60vh; overflow-y: auto>
				<player-component name="USER" input></player-component>
			</div>
			
			<div class="d-flex justify-content-center">
			${this.gameMode === "local" ?
					'<button id="addPlayerButton" class="btn btn-outline-primary d-flex"><i class="bi bi-plus-lg"></i>Add Player</button>'
				:	'<div class="spinner-border" role="status">	<span class="visually-hidden">Loading...</span></div><p>Waiting for Players to join</p>'
			}
			</div>
			`;
	}
}
	

	customElements.define('player-list', PlayerList);