// TITLE BAR THAT IS USED IN THE GAME SETUP STEPPER
// CONSIST OF:
	// BACK BUTTON
	// TITLE

class StepperTitleBar extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({mode: 'open'});
	}

	connecterCallback() {
		this.render();
	}

	render() {
		this.shadow.innerHTML = 
			'<div class = "row"> <div class="col-auto"> \
				<button id="backButton" class="btn btn-secondary">Back</button> \
			</div> \
			<div class="col"> \
				<h2>' + this.getAttribute('title') + '</h2> \
			</div>	\
			</div>';
	}
}


customElements.define('stepper-titlebar', StepperTitleBar);