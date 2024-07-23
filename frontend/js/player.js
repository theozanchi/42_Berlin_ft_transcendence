class MyPlayer extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({mode: 'open'});
	}

	connectedCallback() {
		this.render();
		if (this.hasAttribute('remove-button')){
			this.shadow.getElementById('removeButton').addEventListener('click', () => {
				// console.log("REMOVE CLICKED");
				this.dispatchEvent(new CustomEvent('removePlayer'));
			});
		}
		// MAKING PLAYER COMPONENT CLICKABLE
		if (this.hasAttribute('user_id')) {
			this.addEventListener('click', () => {
				const userId = this.getAttribute('user_id');
				if (userId) {
					window.location.href = `/profile?user=${userId}`;
				}
			});
		}
	}

    get name() {
        return this.getAttribute('name');
    }

    set name(newValue) {
        this.setAttribute('name', newValue);
        this.render();
    }

    static get observedAttributes() {
        return ['name'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'name' && oldValue !== newValue) {
			console.log(`RERENDERING: ${name} ${oldValue}  ${newValue}`);
            this.render();
        }
    }

	render() {
		const hasInput = this.hasAttribute('input');
		const hasRemoveButton = this.hasAttribute('remove-button');
		const hasAvatar = this.hasAttribute('avatar');
		const rightToLeft = this.hasAttribute('order-right');
		const tableColumn = this.getAttribute('table-column');
		const baseUrl = document.location.href;
		const name = this.getAttribute('name');
		let imageUrl = new URL('assets/avatar_blossom.png', baseUrl);
	
		if (hasAvatar)
			imageUrl = new URL(this.getAttribute('avatar'), baseUrl);
	
		const nameAligned = (tableColumn === "right")
			? `<p class="col align-middle fs-5 m-0 text-end">${name}</p>`
			: `<p class="col align-middle fs-5 m-0">${name}</p>`

		const inputElement = hasInput 
			? `<input id="playerNicknameInput" type="text" class="form-control col" maxlength="30" value="${name}">` 
			: `${nameAligned}`;
	
		const removeButtonElement = hasRemoveButton 
			? '<button id="removeButton" class="btn btn-outline-danger col-auto square-button"><i class="bi bi-x-lg"></i></button>' 
			: '';
	
		const imgElement = `<div class="masked-avatar"><img src="${imageUrl}" class="col-auto player-component"></div>`;
	
		this.shadow.innerHTML = `
			<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
			<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
			<link rel="stylesheet" href="./css/styles.css">
			<div class="player-component d-flex align-items-center">
				${rightToLeft
						? removeButtonElement + inputElement + imgElement
						: imgElement + inputElement + removeButtonElement}
			</div>
		`;

		if (hasInput) {
			this.shadow.getElementById('playerNicknameInput').addEventListener('change', (event) => {
				this.name = event.target.value;
			});
		}
	}
}

customElements.define('player-component', MyPlayer);