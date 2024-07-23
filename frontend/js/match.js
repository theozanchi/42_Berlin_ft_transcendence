class match extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({mode: 'open'});
        this.player1Name = '';
        this.player2Name = '';
        this.player1Score = 0;
        this.player2Score = 0;

	}

	static get observedAttributes() {
		return ['player1', 'player2', 'player1_score', 'player2_score'];
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'player1') {
			this.player1Name = newValue;
		} else if (name === 'player2') {
			this.player2Name = newValue;
		} else if (name === 'player1_score') {
			this.player1Score = newValue;
		} else if (name === 'player2_score') {
			this.player2Score = newValue;
		}
		this.render();
	}

	connectedCallback() {
		this.render();
	}

	render() {
		
		let isHistory = this.hasAttribute('history');

		// console.log(data);

		let date = new Date();

		const dateFormatted = isHistory
			? `<small class="text-center mx-2">${date.getDate()}.${date.getMonth()}.${date.getFullYear()}</small>`
			: ""
		
			
		this.shadow.innerHTML = `
			<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
			<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
			<link rel="stylesheet" href="./css/styles.css">

			<div  class="d-flex align-items-center">
				<player-component name="${this.player1Name}" order-right class="flex-grow-1"></player-component>
				<div class="d-grid g2">
					<p class="text-center fs-4 my-0 mx-3">${this.player1Score} : ${this.player2Score} </p>
					${dateFormatted}
				</div>
				<player-component name="${this.player2Name}" table-column="right" class="flex-grow-1"></player-component>
			</div>
		`;
	}
}

customElements.define('match-component', match);