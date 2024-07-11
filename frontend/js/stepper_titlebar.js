// TITLE BAR THAT IS USED IN THE GAME SETUP STEPPER
// CONSIST OF:
	// BACK BUTTON
	// TITLE


class StepperTitleBar extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({mode: 'open'});
	}

	async connectedCallback() {
		await this.render();
		this.shadow.getElementById('backButton').addEventListener('click', () => {
			console.log("WE NEED TO GO BACK");
			window.history.back();
		});
	}

	render() {
		return new Promise((resolve, reject) => {
			this.shadow.innerHTML = `
				<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"></link>
				<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
				<div class = "stepper-titlebar d-flex align-items-center justify-content-center"> \
						<button id="backButton" class="btn btn-outline-secondary col-auto"><i class="bi bi-arrow-left"></i></button> \
						<h2 class="col text-truncate m-0 text-center" > ${this.getAttribute('title')} </h2> \
						<button class="invisible btn btn-outline-secondary col-auto"><i class="invisible bi bi-arrow-left"></i></button> \
				</div>
				<hr>
				`
			resolve();
		});
	}
}


customElements.define('stepper-titlebar', StepperTitleBar);