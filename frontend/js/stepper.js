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
				</style>
				<stepper-titlebar></stepper-titlebar>
				<h3>Players:</h3>
				<button class="btn btn-primary btn-lg d-grid">Generate Game</button>
				`
		}
	}
	
	
	customElements.define('stepper-component', StepperWrapper);