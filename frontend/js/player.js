class MyPlayer extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({mode: 'open'});
	}

	connectedCallback() {
		this.render();
		if (this.hasAttribute('remove-button'))
			this.shadow.getElementById('removeButton').addEventListener('click', () => {
				console.log("REMOVE CLICKED");
				this.dispatchEvent(new CustomEvent('removePlayer'));
			});
	}

	render () {
		const	hasInput = this.hasAttribute('input');
		const	hasRemoveButton = this.hasAttribute('remove-button');
		const	baseUrl = document.location.href;
		let		imageUrl = new URL('assets/avatar_blossom.png', baseUrl);
		const	name = this.getAttribute('name');
		if (this.hasAttribute('avatar'))
			imageUrl = new URL(this.getAttribute('avatar'), baseUrl);

		this.shadow.innerHTML = `
			<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
			<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
			<link rel="stylesheet" href="./css/styles.css">
			<div class="player-component d-flex align-items-center justify-content-center">
				<img class="player-component" src="${imageUrl}" class="col-auto player-component">
				${hasInput 
					? 
					'<input type="text" class="form-control col" maxlength="30" value="' + this.getAttribute('name') + '">' 
					: 
					`<p class="col"> ${name} </p>`
				}
				${hasRemoveButton 
					? 
					'<button id="removeButton" class="btn btn-outline-danger col-auto"><i class="bi bi-x-lg"></i></button>' 
					: 
					''}
			</div>
		`;
	}
}

customElements.define('player-component', MyPlayer);