export function initTournament(data) {
	// The expected data.content is an array of rounds
	if (!data.content || !Array.isArray(data.content)) {
        console.error('Invalid tournament update data format');
        return;
    }

	//sort JSON
	data.content.sort((a, b) => a.round_number - b.round_number);

    // Update the tournament data
    const gameTable = document.querySelector('game-table-component');
    if (gameTable) {
        gameTable.setAttribute('rounds', JSON.stringify(data));
    } else {
        console.error('game-table-component not found');
    }
}

export function updateTournament(data) {

}

export function updatePlayingGameInfo(data) {
	// console.log(`I GOT SOME DATA TO PLAY WITH: ${JSON.stringify(data, null, 2)}`);

	let player1name = document.getElementById('gameLivePlayer1Name');
	let player2name = document.getElementById('gameLivePlayer2Name');
	let player1avatar = document.getElementById('gameLivePlayer1Avatar');
	let player2avatar = document.getElementById('gameLivePlayer2Avatar');

	player1name.innerHTML = data.player1;
	player2name.innerHTML = data.player2;
	// player1avatar.src = data.player1avatar;
	// player2avatar.src = data.player2avatar;
}

class GameTable extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({mode: 'open'});
	}

	static get observedAttributes() {
		return ['rounds'];
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'rounds') {
			this._data = JSON.parse(newValue);
			this.render();
		}
	}

	render() {
		if (!this._data) {
			// _data is not defined, so there's nothing to render
			// console.error('nothing to render tournament');
			return;
		}

		let nextNum = 0;
		let finishedNum = 0;

		let nextGames = 		`<div class="spacer-24"></div>
								<h3 class="fw-bold">Next Up</h3>
								<div>`;
		let finishedGames = 	`<div class="spacer-24"></div>
								<h3 class="fw-bold">Completed</h3>
								<div>`;
		
		this._data.content.forEach(round => {
			// console.log(`MY ROUND: ${round}`);
			console.log(`I GOT SOME DATA TO PLAY WITH: ${JSON.stringify(round, null, 2)}`);
			// if (!this._data.content.winner) {
			if (round.status === 'pending') {
				nextGames += `<match-component 
									status="${round.status}"
									player1="${round.player1}" 
									player2="${round.player2}" 
									player1Score="${round.player1_score}" 
									player2Score="${round.player2_score}">
								</match-component>`;
				nextGames += '<hr class="m-0">';
				nextNum++;
			} else if (round.status === 'completed') {
				finishedGames += `<match-component 
			// 						status="${round.status}"
			// 						player1="${round.player1}" 
			// 						player2="${round.player2}" 
			// 						player1Score="${round.player1_score}" 
			// 						player2Score="${round.player2_score}">
			// 					</match-component>`;
				finishedGames += '<hr class="m-0">';
				finishedNum++;
			}
		});

		nextGames += '</div>';
		finishedGames += '</div>';


		if (!nextNum)
			nextGames = '';
		if (!finishedNum && !nextNum)
			finishedGames = '';

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

customElements.define('game-table-component', GameTable);
