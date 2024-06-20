// TITLE BAR THAT IS USED IN THE GAME SETUP STEPPER
// CONSIST OF:
	// BACK BUTTON
	// TITLE

	class StepperTitleBar extends HTMLElement {
		constructor() {
			super();
			this.shadow = this.attachShadow({ mode: 'open' });
		}
	
		connectedCallback() {
			this.render();
		}
	
		render() {
			const title = this.getAttribute('title') || ''; // Default title if attribute not provided
	
			this.shadow.innerHTML = `
				<div class="stepper-titlebar">
					<button id="backButton" class="btn btn-outline-secondary">←</button>
					<h2>${title}</h2>
				</div>
			`;
		}
	}
	
	customElements.define('stepper-titlebar', StepperTitleBar);
	