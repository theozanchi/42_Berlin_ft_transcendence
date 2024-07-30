class match extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({mode: 'open'});
	this.player1Name = '';
	this.player2Name = '';
	this.player1Score = '-';
	this.player2Score = '-';
	this.player1Avatar = '';
	this.player2Avatar = '';
	this.player1Id = '0';
	this.player2Id = '0';

	}

	static get observedAttributes() {
		return ['player1', 'player2', 'player1score', 'player2score', 'player1avatar', 'player2avatar', 'player1id', 'player2id'];
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
		} else if (name === 'player1avatar' && newValue != 'null') {
			// console.log(`MATCH UPDATE IMAGETRACK: ${newValue}`);
			this.player1Avatar = newValue;
		} else if (name === 'player2avatar' && newValue != 'null') {
			// console.log(`MATCH UPDATE IMAGETRACK: ${newValue}`);
			this.player2Avatar = newValue;
		} else if (name === 'player1id') {
			this.player1Id = newValue;
		} else if (name === 'player2id') {
			this.player2Id = newValue;
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

		// console.log(`MATCH RENDER IMAGETRACK: ${this.player1Avatar} ${this.player1Id}"`);
		// console.log(`MATCH RENDER IMAGETRACK: ${this.player2Avatar} ${this.player2Id}"`);

		this.shadow.innerHTML = `
			<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
			<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
			<link rel="stylesheet" href="./css/styles.css">

			<div class="row align-items-center mx-0 g-0">
				<div class="col">
					<player-component name="${this.player1Name}" user_id="${this.player1Id}" avatar="${this.player1Avatar}" order-right></player-component>
				</div>
				<div class="col-auto mx-2">
					<div class="text-center">
						<p class="fs-5 my-0 font-monospace"">${this.player1Score}:${this.player2Score}</p>
						${dateFormatted}
					</div>
				</div>
				<div class="col mx-0">
					<player-component name="${this.player2Name}" user_id="${this.player2Id}"  avatar="${this.player2Avatar}" table-column="right"></player-component>
				</div>
			</div>
		`;
	}
}

customElements.define('match-component', match);