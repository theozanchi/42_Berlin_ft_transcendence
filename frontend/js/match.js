class match extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({mode: 'open'});
	this.player1Name = '';
	this.player2Name = '';
	this.player1Score = '-';
	this.player2Score = '-';
	this.player1Avatar = 'assets/avatar_HIM.png';
	this.player2Avatar = 'assets/avatar_HIM.png';

	}

	static get observedAttributes() {
		return ['player1', 'player2', 'player1score', 'player2score', 'player1avatar', 'player2avatar'];
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'player1') {
			this.player1Name = newValue;
		} else if (name === 'player2') {
			this.player2Name = newValue;
		} else if (name === 'player1score' && newValue != '-1') {
			this.player1Score = newValue;
		} else if (name === 'player2score' && newValue != '-1') {
			this.player2Score = newValue;
		} else if (name === 'player1') {
			this.player1Name = newValue;
		} else if (name === 'player2') {
			this.player2Name = newValue;
		} else if (name === 'player1avatar') {
			this.player1Avatar = newValue;
		} else if (name === 'player2avatar') {
			this.player2Avatar = newValue;
		}
		this.render();
	}

	connectedCallback() {
		this.render();
	}

	render() {
		
		let isHistory = this.hasAttribute('history');


		let date = new Date();

		const dateFormatted = isHistory
			? `<small class="text-center mx-2">${date.getDate()}.${date.getMonth()}.${date.getFullYear()}</small>`
			: ""

		this.shadow.innerHTML = `
			<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
			<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
			<link rel="stylesheet" href="./css/styles.css">

			<div class="row align-items-center mx-0 g-0">
				<div class="col">
					<player-component name="${this.player1Name}" avatar="${this.player1Avatar}" order-right></player-component>
				</div>
				<div class="col-auto mx-2">
					<div class="text-center">
						<p class="fs-5 my-0 font-monospace"">${this.player1Score}:${this.player2Score}</p>
						${dateFormatted}
					</div>
				</div>
				<div class="col mx-0">
					<player-component name="${this.player2Name}" avatar="${this.player2Avatar}" table-column="right"></player-component>
				</div>
			</div>
		`;
	}
}

customElements.define('match-component', match);