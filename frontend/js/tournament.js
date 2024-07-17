export function initTournament(data) {
	// The expected data.content is an array of rounds
	if (!data.content || !Array.isArray(data.content)) {
        console.error('Invalid tournament update data format');
        return;
    }

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
			console.error('nothing to render tournament');
			return;
		}

		let nextGames = '<div>';

		this._data.content.forEach(round => {
			if (!this._data.content.winner) {
				nextGames += '<hr class="m-0">';
				nextGames += `<match-component 
									player1="${round.player1}" 
									player2="${round.player2}" 
									player1Score="${round.player1_score}" 
									player2Score="${round.player2_score}">
								</match-component>`;
			}
		});

		nextGames += '</div>';

		const baseUrl = document.location.href;
		let imageUrl = new URL('assets/avatar_blossom.png', baseUrl);
		const imgElement = `<img src="${imageUrl}" class="col-auto player-component">`;

		this.shadow.innerHTML = `
			<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
			<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
			<link rel="stylesheet" href="./css/styles.css">

			<div id="upcoming-games" class="d-flex flex-column ppg-green flex-grow-1 overflow-auto">
				${nextGames}
			</div>
		`;
	}
}

customElements.define('game-table-component', GameTable);