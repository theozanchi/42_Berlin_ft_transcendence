// GAME SETUP STEPPER TO GENERATE OR JOIN GAMES
// CONSIST OF:
	// STEPPER TITLEBAR
	// VIEW TO EDIT SETTINGS
	// PROCCEED/START BUTTON

	class StepperWrapper extends HTMLElement {
		constructor() {
			super();
			this.shadow = this.attachShadow({mode: 'open'});
		}
	
		connectedCallback() {
			console.log("rendering");
			this.render();
		}
	
		render() {
			this.shadow.innerHTML = `
				<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"></link>
				<style>
					.stepper-container {
						display: flex;
						flex-direction: column;
						height: 100%;
					}
					.generate-game-button {
						margin-top: auto;
					}
				</style>
				<stepper-titlebar></stepper-titlebar>
				<player-list "local" "join" "host"></player-list>
				<button class="btn btn-primary btn-lg d-grid generate-game-button">Generate Game</button>
				`
		}
	}
	
	
	customElements.define('stepper-component', StepperWrapper);