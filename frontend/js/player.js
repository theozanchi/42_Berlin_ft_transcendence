class MyPlayer extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({mode: 'open'});
	}

	connectedCallback() {
		this.render();
	}

	render () {
		const	hasInput = this.hasAttribute('input');
		const	hasRemoveButton = this.hasAttribute('remove-button');
		const	baseUrl = document.location.href;
		const	imageUrl = new URL('assets/avatar_blossom.png', baseUrl);
		if (this.hasAttribute('avatar'))
			imageUrl = new URL(this.getAttribute('avatar'), baseUrl);


		this.shadow.innerHTML = `
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
            <style>
                img {
                    height: 48px;
                }
				.d-flex > * {
                    margin: 6px 6px;
                }
            </style>
            <div class="d-flex align-items-center justify-content-center border-bottom">
                <img src="${imageUrl}" class="col-auto">
                ${hasInput 
                    ? 
                        '<input type="text" class="form-control col" value="' + this.getAttribute('name') + '">' 
                    : 
                        '<p class="col">' + this.getAttribute('name') + '</p>'
                }
                ${hasRemoveButton ? '<button class="btn btn-outline-danger col-auto">X</button>' : ''}
			<span class="border-bottom"></span>
			</div>
        `;
	}
}

customElements.define('player-component', MyPlayer);