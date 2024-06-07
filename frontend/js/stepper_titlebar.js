// TITLE BAR THAT IS USED IN THE GAME SETUP STEPPER
// CONSIST OF:
	// BACK BUTTON
	// TITLE

class StepperTitleBar extends HTMLElement {
	constructor() {
		console.log("constructing");
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
				.d-flex > * {
                    margin: 6px 6px;
                }
				.btn-outline-secondary > * { width: 48px;}
            </style>
			<div class = "d-flex align-items-center justify-content-center border-bottom border-black border-2"> \
					<button id="backButton" class="btn btn-outline-secondary col-auto">←</button> \
					<h2 class="col text-truncate text-center" > ${this.getAttribute('title')} </h2> \
			</div>
			`
	}
}


customElements.define('stepper-titlebar', StepperTitleBar);