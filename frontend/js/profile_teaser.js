import {getLoggedInState} from './login_signup.js';
import {setProfileImage} from './profile.js'

async function adjustButtonVisibility() {
	const loggedInState = await getLoggedInState();
	const localGameButton = document.getElementById('localGameButton');
	const remoteGameButton = document.getElementById('remoteGameButton');

	if (loggedInState && loggedInState.status === 'success') {
	// User is logged in
	if (localGameButton) localGameButton.style.display = 'none'; // Hide local game button
	if (remoteGameButton) remoteGameButton.style.display = 'block'; // Show remote game button
	} else {
	// User is not logged in or an error occurred
	if (localGameButton) localGameButton.style.display = 'block'; // Show local game button
	if (remoteGameButton) remoteGameButton.style.display = 'none'; // Hide remote game button
	}
}

// Call the function to adjust the button visibility based on the user's login state
adjustButtonVisibility();

class ProfileTeaser extends HTMLElement {
	connectedCallback() {
		try {
			this.render();
		} catch (error) {
			console.error('Error rendering profile teaser:', error);
			this.innerHTML = `<div class="error-message">Oops! Something went wrong. Please try again later.</div>`;
		}
	}

	async render() {
		await adjustButtonVisibility();
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

			const avatar = await setProfileImage(loggedIn.user_id);
			this.innerHTML = `
			<div id="teaserAccout">
				<hr class="m-0">
				<div class="spacer-12"></div>
				<nav class="d-flex gap-2 align-items-center justify-content-between">
					<player-component name=${userCredentials.player_data.nickname} avatar=${avatar}></player-component>
					<a href="/profile?user=${loggedIn.user_id}" id="showProfile" class="btn btn-lg btn-outline-primary">Account<i class="bi bi-arrow-right-short"></i></a>
				</nav>
				<div class="spacer-48"></div>
			</div>
			`;
		} else {
			this.innerHTML = `
			<div id="teaserLogIn">
				<hr class="m-0">
				<h2>Login to play Remote</h2>
				<div class="spacer-12"></div>
				<nav class="d-grid gap-2 d-md-block">
					<a href="/login" id="goToLoginButton" class="btn btn-lg btn-outline-primary">Login</a>
					<a href="/signup" class="btn btn-link text-decoration-none">Create account</a>
				</nav>
				<div class="spacer-48"></div>
			</div>
			`;
		}
	}
}

customElements.define('profile-teaser', ProfileTeaser);