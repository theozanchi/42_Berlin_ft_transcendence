import { setProfileImage } from "./profile.js";
import { urlRoute } from "./url-router.js";

class MyPlayer extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({mode: 'open'});
	}

	connectedCallback() {
		this.render();
		if (this.hasAttribute('remove-button')){
			this.shadow.getElementById('removeButton').addEventListener('click', () => {
				this.dispatchEvent(new CustomEvent('removePlayer'));
			});
		}
		// MAKING PLAYER COMPONENT CLICKABLE
		if (this.hasAttribute('user_id')) {
			this.addEventListener('click', () => {
				const userId = this.getAttribute('user_id');
				if (userId) {
					urlRoute(`/profile?user=${userId}`);
				}
			});
		}
	}

	get name() {
		return this.getAttribute('name');
	}

	set name(newValue) {
		this.setAttribute('name', newValue);
	}

	get avatar() {
		return this.getAttribute('avatar');
	}
		
	set avatar(newValue) {
		this.setAttribute('avatar', newValue);
	}

	static get observedAttributes() {
		return ['name', 'avatar'];
	}

	// attributeChangedCallback(name, oldValue, newValue) {
	// 	if ((name === 'name') && oldValue !== newValue) {
	// 		this.render();
	// 	}
	// 	if (name === 'avatar' && oldValue !== newValue) {
	// 		this.render();
	// 	}
	// }

	async render() {
		const	hasInput = this.hasAttribute('input');
		const	hasRemoveButton = this.hasAttribute('remove-button');
		const	isOnline = this.hasAttribute('online');
		const	rightToLeft = this.hasAttribute('order-right');
		const	tableColumn = this.getAttribute('table-column');
		const	baseUrl = document.location.href;
		const	name = this.getAttribute('name');
		const	avatar = this.getAttribute('avatar');
		const	user_id = this.getAttribute('user_id');
		let		imageUrl;
	
		if (avatar && avatar != 'null')
			imageUrl = new URL(avatar, baseUrl);
		else if (user_id)
			imageUrl = await setProfileImage(user_id);

		const nameAligned = (tableColumn === "right")
			? `<p class="col align-middle fs-5 m-0 text-end text-truncate">${name}</p>`
			: `<p class="col align-middle fs-5 m-0 text-truncate">${name}</p>`

		const inputElement = hasInput 
			? `<input id="playerNicknameInput" type="text" class="form-control col" maxlength="30" value="${name}">` 
			: `${nameAligned}`;
	
		const removeButtonElement = hasRemoveButton 
			? '<button id="removeButton" class="btn btn-outline-danger col-auto square-button"><i class="bi bi-x-lg"></i></button>' 
			: '';
	
		const imgElement = `<div class="masked-avatar"><img src="${imageUrl}" class="col-auto player-component"></div>`;

		const onlineBadge = isOnline
			? `<span class="badge rounded-pill text-bg-success">online</span>`
			: ``;
	
		this.shadow.innerHTML = `
			<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
			<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
			<link rel="stylesheet" href="./css/styles.css">
			<div class="player-component d-flex align-items-center">
				${rightToLeft
						? removeButtonElement + onlineBadge + inputElement + imgElement
						: imgElement + inputElement + onlineBadge + removeButtonElement}
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