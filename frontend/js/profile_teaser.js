class ProfileTeaser extends HTMLElement {
	connectedCallback() {
		this.render();
	}

	render() {
		const loggedIn = fetch('/api/user_mgt/me')
			.then(response => response.json())
			.catch(() => ({ status: "error" }));

		console.log(loggedIn.status);

		if (loggedIn.status === 'success') {
			const userStatus = 'active'; // Add the missing userStatus variable
			const userCredentials = fetch(`/api/user_mgt/profile/${userStatus}`)
				.then(response => response.json())
				.catch(() => ({ status: "error" }));
			this.innerHTML = `
			<div id="teaserAccout">
				<hr>
				<h2>Logged in as:</h2>
				<div class="spacer-24"></div>
				<nav class="d-grid gap-2 d-md-block">
					<player-component name=${userCredentials.nickname} avatar=${userCredentials.avatar}></player-component>
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