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
			<link rel="stylesheet" href="./css/styles.css">
			<div class="d-flex align-items-center justify-content-center" style="margin: var(--player-element-margin);">
				<img style="height: var(--player-img-height); margin-right: var(--player-element-margin);" src="${imageUrl}" class="col-auto player-element">
					${hasInput 
						? 
							'<input type="text" class="form-control col" maxlength="30" value="' + this.getAttribute('name') + '">' 
						: 
							`<p class="col"> ${name} </p>`
					}
					${hasRemoveButton ? '<button id="removeButton" class="btn btn-outline-danger col-auto" style="margin-left: var(--player-element-margin);">X</button>' : ''}
			</div>
		`;
	}
}

customElements.define('player-component', MyPlayer);