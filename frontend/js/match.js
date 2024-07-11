class match extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({mode: 'open'});

	}

	connectedCallback() {
		this.render();
	}

	render() {
		
		let isHistory = this.hasAttribute('history');

///// START DUMMY CONTENT TO TEST UI /////
		let date = new Date(2024, 7, 10);
		// console.log(date);

		let gameData = {
			date: date.toISOString(),
			player1: "USER",
			player2: "ThisWillChange",
			winner: null,
			player1_score: 0,
			player2_score: 0,
			player1_channel_name: "specific.4465620cc3b24e4c93ffc8140ba86f30!459330cb3a334ab09ea7c97444b86a54",
			player2_channel_name: "specific.4465620cc3b24e4c93ffc8140ba86f30!459330cb3a334ab09ea7c97444b86a54"
		};
		
		let gameDataStringified = JSON.stringify(gameData);
///// END DUMMY CONTENT /////

		let data = JSON.parse(gameDataStringified)
		let player1Name = data['player1'];
		let player2Name = data['player2'];
		let player1Score = data['player1_score'];
		let player2Score = data['player2_score'];

		// console.log(data);

		date = new Date(data['date']);

		const dateFormatted = isHistory
			? `<small class="text-center mx-2">${date.getDate()}.${date.getMonth()}.${date.getFullYear()}</small>`
			: ""
		
			
		this.shadow.innerHTML = `
			<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
			<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
			<link rel="stylesheet" href="./css/styles.css">

			<div  class="d-flex align-items-center">
				<player-component name="${player1Name}" order-right class="flex-grow-1"></player-component>
				<div class="d-grid g2">
					<p class="text-center fs-4 my-0 mx-3">${player1Score} : ${player2Score} </p>
					${dateFormatted}
				</div>
				<player-component name="${player2Name}" table-column="right" class="flex-grow-1"></player-component>
			</div>
		`;
	}
}

customElements.define('match-component', match);