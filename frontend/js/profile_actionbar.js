import {getLoggedInState} from './login_signup.js';

class ProfileAction extends HTMLElement {
	connectedCallback() {
		this.render();
	}

	async render() {
		const loggedIn = await getLoggedInState();


		if (loggedIn.status === 'success') {
			const userCredentials = await fetch(`/api/user_mgt/profile/${loggedIn.user_id}`)
				.then(response => {
					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}
					return response.json();
				})
				.catch(error => {
					console.error('There was a problem with the fetch operation:', error);
					return { status: "error" };
				});
			console.log(userCredentials);
			this.innerHTML = `
			<div id="userEditAccount" class="d-grid gap-2">
				<hr class="m-0">
				<div class="spacer-12"></div>
				<nav class="d-grid gap-2"><a href="/edit-profile" id="editProfileButton" class="btn btn-lg btn-primary">Edit Account</a></nav>
					<button id="logoutUserButton" class="btn btn-lg btn-secondary">Logout</button>
				<div class="spacer-48"></div>
			</div>
			`;
		} else {
			this.innerHTML = `
			<div id="userEditFriend" class="d-grid gap-2">
				<hr class="m-0">
				<div class="spacer-12"></div>
				<button id="userBefriendButton" class="btn btn-lg btn-success"><i class="bi bi-plus-lg me-2"></i>Befriend</button>
				<button id="userUnfriendButton" class="btn btn-lg btn-danger" >Unfriend</button>
				<button id="userUnfriendButton" class="btn btn-lg btn-danger" disabled><i class="spinner-border"></i></button>
				<div class="spacer-48"></div>
			</div>
			`;
		}
	}
}

customElements.define('profile-actionbar', ProfileAction);