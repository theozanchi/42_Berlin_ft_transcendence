class GameHistory extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({mode: 'open'});
	}

	render() {
		if (!this._data) {
			// _data is not defined, so there's nothing to render
			// console.error('nothing to render tournament');
			return;
		}
		
		this._data.player_data.games.forEach(games => {
			// console.log(`MY ROUND: ${round}`);
			// console.log(`I GOT SOME DATA TO PLAY WITH: ${JSON.stringify(round, null, 2)}`);
			// if (!this._data.content.winner) {
			let GameHistory = `<div class="spacer-24"></div>
								<h3 class="fw-bold">${games.end_date}</h3>
								<div>`;

			games.rounds.forEach(round => {
				if (round.status === 'completed') {
					GameHistory += `<match-component 
										status="${round.status}"
										player1="${round.player1.alias}" 
										player2="${round.player2.alias}" 
										player1Score="${round.player1.score}" 
										player2Score="${round.player2.score}">
									</match-component>
									<hr class="m-0">`;
				}

			});
		});


		const baseUrl = document.location.href;
		let imageUrl = new URL('assets/avatar_blossom.png', baseUrl);
		const imgElement = `<img src="${imageUrl}" class="col-auto player-component">`;

		this.shadow.innerHTML = `
			<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
			<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
			<link rel="stylesheet" href="./css/styles.css">


			<div id="upcoming-games" class="d-flex flex-column flex-grow-1 overflow-y-auto">
				${nextGames}
				${finishedGames}
			</div>
			
		`;
	}
}

customElements.define('profile-history-component', GameHistory);