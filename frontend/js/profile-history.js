import { getLoggedInState } from "./login_signup.js";

class GameHistory extends HTMLElement {

	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: 'open' });
	}

	async fetchData() {
		const userData = await getLoggedInState();
		if (userData && userData.user_id) { 
			this.user_id = userData.user_id
		}
		const response = await fetch(`/api/user_mgt/profile/${this.user_id}`);
		if (!response.ok) {
			console.error('Failed to fetch data');
			return;
		}
		this._data = await response.json();
        this.render(); 
	}

	connectedCallback() {
        this.fetchData();
    }

	render() {

		if (!this._data || !this._data.player_data || !this._data.player_data.games) {
			console.error('No data to render');
			return;
		}

		let gameHistoryHTML = '';

		if (this._data.player_data.games.length){
			let emptyState = document.getElementById('empty-state');
			if (emptyState)
				emptyState.setAttribute('hidden', '');
		}

		this._data.player_data.games.forEach(game => {

			
			const date = new Date(game.end_date);
			let GameDate = `${date.getDate()}.${date.getMonth()}.${date.getFullYear()}`;

			gameHistoryHTML += `<div class="spacer-24"></div>
								<h3 class="fw-bold">${GameDate}</h3>
								<div>`;

			game.rounds.forEach(round => {
				if (round.round_status === 'completed') {
					gameHistoryHTML += `<hr class="m-0">
										<match-component 
											status="${round.status}"
											player1="${round.player1.alias}" 
											player2="${round.player2.alias}" 
											player1Score="${round.player1.score}" 
											player2Score="${round.player2.score}">
										</match-component>`;
				}
			});
			gameHistoryHTML += '</div>'; // Close the game div
		});

		this.shadow.innerHTML = `
			<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
			<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
			<link rel="stylesheet" href="./css/styles.css">

			<div id="game-history" class="d-flex flex-column flex-grow-1 overflow-y-auto">
				${gameHistoryHTML}
			</div>
		`;
	}
}

customElements.define('game-history-component', GameHistory);