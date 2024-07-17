import {getLoggedInState} from './login_signup.js';

class ProfileTeaser extends HTMLElement {
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
			<div id="teaserAccout">
				<hr>
				<h2>Logged in as:</h2>
				<div class="spacer-24"></div>
				<nav class="d-grid gap-2 d-md-block">
					<player-component name=${userCredentials.player_data.nickname} avatar=${userCredentials.player_data.avatar}></player-component>
					<a href="/profile" id="showProfile" class="btn btn-lg btn-outline-primary">Show Account</a>
				</nav>
				<div class="spacer-48"></div>
			</div>
			`;
		} else {
			this.innerHTML = `
			<div id="teaserLogIn">
				<hr>
				<h2>You have an Account?</h2>
				<div class="spacer-24"></div>
				<nav class="d-grid gap-2 d-md-block">
					<a href="/login" id="login42Button" class="btn btn-lg btn-outline-primary">Login</a>
					<a href="/signup" class="btn btn-link text-decoration-none">Create account</a>
				</nav>
				<div class="spacer-48"></div>
			</div>
			`;
		}
	}
}

customElements.define('profile-teaser', ProfileTeaser);