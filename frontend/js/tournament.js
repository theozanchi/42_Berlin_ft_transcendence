import { setProfileImage } from "./profile.js";
import { pongerAvatars } from "./login_signup.js";

export function initTournament(data) {
	// The expected data.content is an array of rounds('d-none');
	if (!data.content || !Array.isArray(data.content)) {
		// console.error('Invalid tournament update data format');
		return;
	}

	//sort JSON
	data.content.sort((a, b) => a.round_number - b.round_number);

	// Update the tournament data
	const gameTableComponent = document.querySelector('game-table-component');
	if (gameTableComponent) {
		gameTableComponent.setAttribute('rounds', JSON.stringify(data));
	} else {
		console.error('game-table-component not found');
	}
}

export function updateTournament(data) {
	// The expected data.content is an array of rounds('d-none');
	if (!data.content || !Array.isArray(data.content)) {
		// console.error('Invalid tournament update data format');
		return;
	}

	//sort JSON
	data.content.sort((a, b) => a.round_number - b.round_number);

	// Update the tournament data
	const gameTableComponent = document.querySelector('game-table-component');
	if (gameTableComponent) {
		gameTableComponent.setAttribute('rounds', JSON.stringify(data));
	} else {
		console.error('game-table-component not found');
	}
}

export async function updatePlayingGameInfo(data) {

	const baseUrl = new URL(document.location).origin;
	let player1name = document.getElementById('gameLivePlayer1Name');
	let player2name = document.getElementById('gameLivePlayer2Name');
	let player1avatar = document.getElementById('gameLivePlayer1Avatar');
	let player2avatar = document.getElementById('gameLivePlayer2Avatar');

		player1name.innerHTML = data.player1.name;
		player2name.innerHTML = data.player2.name;

		
		if (data.player1.avatar && pongerAvatars.includes(data.player1.avatar))
			player1avatar.src = data.player1.avatar;
		else
			player1avatar.src = await setProfileImage(data.player1.user_id);
		if (data.player2.avatar && pongerAvatars.includes(data.player1.avatar))
			player2avatar.src = data.player2.avatar;
		else
			player2avatar.src = await setProfileImage(data.player2.user_id);
}

class GameTable extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({mode: 'open'});
	}

	connectedCallback() {
		this.render();
	}

	static get observedAttributes() {
		return ['rounds'];
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'rounds') {
			this._data = JSON.parse(newValue);
			console.log(this._data);
			this.render();
		}
	}

	async render() {
		if (!this._data) {
			// _data is not defined, so there's nothing to render
			// console.error('nothing to render tournament');
			return;
		}

		let player1Avatar = '';
		let player2Avatar = '';

		let nextNum = 0;
		let finishedNum = 0;

		let nextGames = 		`<div class="spacer-24"></div>
								<h3 class="fw-bold">Next Up</h3>
								<div>`;
		let finishedGames = 	`<div class="spacer-24"></div>
								<h3 class="fw-bold">Completed</h3>
								<div>`;
		
		this._data.content.forEach(round => {
			if (pongerAvatars.includes(round.player1.avatar))
				player1Avatar = round.player1.avatar;
			if (pongerAvatars.includes(round.player2.avatar))
				player2Avatar = round.player2.avatar;
			if (round.status === 'pending') {
				nextGames += `<match-component 
									status="${round.status}"
									player1Score="-" 
									player2Score="-" 
									player1="${round.player1.name}" 
									player2="${round.player2.name}"
									player1Id="${round.player1.user_id}" 
									player2Id="${round.player2.user_id}"
									player1Avatar="${player1Avatar}" 
									player2Avatar="${player2Avatar}">
								</match-component>`;
				nextGames += '<hr class="m-0">';
				nextNum++;
			} else if (round.status === 'completed') {
				finishedGames += `<match-component 
			 						status="${round.status}"
									player1Score="${round.player1_score}" 
									player2Score="${round.player2_score}" 
									player1="${round.player1.name}" 
									player2="${round.player2.name}" 
									player1Id="${round.player1.user_id}" 
									player2Id="${round.player2.user_id}"
									player1Avatar="${player1Avatar}" 
									player2Avatar="${player2Avatar}">
			 					</match-component>`;
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
