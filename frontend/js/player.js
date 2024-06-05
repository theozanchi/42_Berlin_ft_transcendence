class MyPlayer extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({mode: 'open'});
	}

	connectedCallback() {
		this.render();
	}

	render () {
		console.log(`Trying to render Player ` + this.getAttribute('name'));
		const	hasInput = this.hasAttribute('input');
		const	hasRemoveButton = this.hasAttribute('remove-button');

		console.log(hasInput);
		console.log(hasRemoveButton);


		this.shadow.innerHTML = `
			
			${hasInput 
				? 
					console.log('<input type="text" value="' + this.getAttribute('name') + '"></input>') && 
					'<input type="text" \
					value="' + this.getAttribute('name') + '"></input>' 
				: 
				console.log('<p>' + this.getAttribute('name') + '</p>') && '<p>' + this.getAttribute('name') + '</p>';
			}
			${hasRemoveButton ? '<button class="btn btn-outline-danger col-auto">X</button>' : ''}
			`;
	}
}

customElements.define('player-component', MyPlayer);