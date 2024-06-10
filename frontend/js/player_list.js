// LISTS ALL PLAYERS OF A GAME
// CONSIST OF:
	// LIST OF PLAYER-COMPONENT
	// ADD PLAYER BUTTON (OPTIONAL)

	class PlayerList extends HTMLElement {
		constructor() {
			console.log("constructing Playerlist");
			super();
			this.shadow = this.attachShadow({mode: 'open'});
			this.count = 1;
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
			console.log(this.count);
		}
		
		dec () {
			this.count--;
			console.log(this.count);
		}
	
		connectedCallback() {
			let 	PongerChars = ['Blossom', 'Bubbles', 'Buttercup', 'Professor Utonium', 'The Mayor of Townsville', 'Ms. Bellum', 'Ms. Keane', 'Narrator', 'Talking Dog', 'Mitch Mitchelson', 'Stanley Whitfield', 'Mojo Jojo', 'Fuzzy Lumpkins', 'HIM', 'Princess Morbucks', 'The Gangreen Gang', 'The Amoeba Boys', 'Sedusa', 'The Rowdyruff Boys'];
			
			console.log("rendering PlayerList");
			this.render();

			this.render();

			this.shadow.getElementById('addPlayerButton').addEventListener('click', () => {
				this.addPlayer();
			});
		}

		addPlayer() {
			let playerList = this.shadow.getElementById('list-of-players');

			let newPlayer = document.createElement('player-component');
			newPlayer.setAttribute('name', `${PongerChars[playerList.childElementCount]}`);
			newPlayer.setAttribute('input', '');
			newPlayer.setAttribute('remove-button', '');

			// Add an event listener for the 'removePlayer' event
			newPlayer.addEventListener('removePlayer', () => {
				playerList.removeChild(newPlayer);
				this.dec(); // Assuming you have a method to decrease the count
				this.shadow.getElementById('playerCount').textContent = `${this.count} Players`;
			});

			playerList.appendChild(newPlayer);

			// Increase the count of players
			this.count++;

			// Update the player count display
			this.shadow.getElementById('playerCount').textContent = `${this.count} Players`;
		}
	
		render() {
			const	isLocal = this.hasAttribute('local');
			const	isRemoteHost = this.hasAttribute('host');
			const	isRemoteGuest = this.hasAttribute('join');

			const	playerComposition = "";

			(isRemoteHost) ? playerComposition += " remove-button" :
				isLocal ? playerComposition += " input" : null ;
			
			console.log(`ATTRIBUTES: ${isLocal}, ${isRemoteGuest}, ${isRemoteHost}`);
			console.log("PLAYER COMPOSITION" + playerComposition);

			this.shadow.innerHTML = `
				<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"></link>
				<style>
				</style>
	
				<h3 id="playerCount"> ${this.count} Players</h3>
				<div id="list-of-players">
					<player-component name="USER" input></player-component>
					${isLocal}
				</div>
				<button id="addPlayerButton" class="btn btn-outline-primary d-grid">+ Add Player</button>
				`
		}
	}
	

	customElements.define('player-list', PlayerList);