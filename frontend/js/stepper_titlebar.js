// TITLE BAR THAT IS USED IN THE GAME SETUP STEPPER
// CONSIST OF:
	// BACK BUTTON
	// TITLE


import { newsocket, gameStarted } from "./stepper.js";
import { resetGame } from "./game.js"
class StepperTitleBar extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({mode: 'open'});
	}

	async connectedCallback() {
		await this.render();
		this.shadow.getElementById('backButton').addEventListener('click', (event) => {
			let location = window.location.pathname;
			if (["/game", "/host-remote", "/join-remote"].includes(location)) {
				let userConfirmation = confirm('All game data will be lost, when you leave this page. Continue?');
				if (userConfirmation){
					if (newsocket && newsocket.readyState === WebSocket.OPEN)
						newsocket.close();
					resetGame();
					window.history.back();
				}
			} else
				window.history.back();
		}
		);
	}

	render() {
		return new Promise((resolve, reject) => {
			this.shadow.innerHTML = `
				<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"></link>
				<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
				<div class = "stepper-titlebar d-flex align-items-center justify-content-center"> \
						<button id="backButton" class="btn btn-outline-secondary col-auto"><i class="bi bi-arrow-left"></i></button> \
						<h1 class="col text-truncate m-0 text-center fs-2" > ${this.getAttribute('title')} </h1> \
						<button class="invisible btn btn-outline-secondary col-auto"><i class="invisible bi bi-arrow-left"></i></button> \
				</div>
				<hr class="mb-0">
				`
			resolve();
		});
	}
}


customElements.define('stepper-titlebar', StepperTitleBar);