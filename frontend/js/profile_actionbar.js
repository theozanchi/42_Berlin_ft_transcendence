import { getLoggedInState } from './login_signup.js';
import { getCSRFToken } from './login_signup.js';

async function usersAreFriends(userIdA, userIdB) {
	const userData = await getLoggedInState(userIdA);
	console.log(`COMPARING: ${userIdA} ${userIdB}`);
	if (!userData || userData.status !== 'success') {
		console.error(`Cannot validate friendship: User ID ${userIdA} unknown.`);
		return false;
	}
	try {
		const response = await fetch(`/api/user_mgt/profile/${userIdA}`);
		if (response.ok && response.headers.get('Content-Type').includes('application/json')) {
			const data = await response.json();
			const userIdAFriends = data.player_data.friends;
			return (userIdAFriends.find(friend => friend.user_id === userIdB));

		} else {
			throw new Error('Non-JSON response received');
		}
	} catch (error) {
		console.error(error);
		return false;
	}
}

async function addFriend(user_id) {
	try {
		const response = await fetch(`/api/user_mgt/add_friend/`, {
			method: 'POST',
			headers: {
				'friend': user_id,
				'Content-Type': 'application/json',
				'X-CSRFToken': getCSRFToken(),
			},
		});
		if (response.ok && response.headers.get("Content-Type").includes("application/json")) {
			const data = await response.json();
			// alert(data.message);
			if (data.status === "success") {
				return true;
			}
		} else {
			throw new Error('Non-JSON response received');
		}
	} catch (error) {
		console.error('Error:', error);
	}
	return false;
}

async function removeFriend(user_id) {
	try {
		const response = await fetch(`/api/user_mgt/remove_friend/`, {
			method: 'POST',
			headers: {
				'friend': user_id,
				'Content-Type': 'application/json',
				'X-CSRFToken': getCSRFToken(),

			},
		});
		if (response.ok && response.headers.get("Content-Type").includes("application/json")) {
			const data = await response.json();
			// alert(data.message);
			if (data.status === "success") {
				return true;
			}
		} else {
			throw new Error('Non-JSON response received');
		}
	} catch (error) {
		console.error('Error:', error);
	}
	return false;
}

class ProfileAction extends HTMLElement {
	connectedCallback() {
		const urlQuery = new URLSearchParams(window.location.search);
		this.RequestedUserId = +urlQuery.get('user');
		this.render();
	}

	setupEventListeners() {
		const befriendButton = document.getElementById('userBefriendButton');
		const unfriendButton = document.getElementById('userUnfriendButton');
		if (befriendButton) {
			befriendButton.onclick = null;
			befriendButton.addEventListener('click', async () => {
				const success = await addFriend(this.RequestedUserId);
				if (success) {
					befriendButton.style.display = 'none'; // Hide befriend button
					unfriendButton.style.display = 'block'; // Show unfriend button
				}
			});
		}
		if (unfriendButton) {
			unfriendButton.onclick = null;
			unfriendButton.addEventListener('click', async () => {
				const success = await removeFriend(this.RequestedUserId);
				if (success) {
					befriendButton.style.display = 'block'; // Shoe befriend button
					unfriendButton.style.display = 'none'; // Hide unfriend button
				}
			});
		}
	}

	async render() {
		const loggedIn = await getLoggedInState();

		if (loggedIn.status === 'success' && loggedIn.user_id === this.RequestedUserId) {
			console.log(`OKAY`);
			fetch(`/api/user_mgt/profile/${loggedIn.user_id}`)
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
			this.innerHTML = `
			<div id="userEditAccount" class="d-grid gap-2">
				<hr class="m-0">
				<div class="spacer-12"></div>
				<nav class="d-grid gap-2"><a href="/edit-profile" id="editProfileButton" class="btn btn-lg btn-primary">Edit Account</a></nav>
					<button id="logoutUserButton" class="btn btn-lg btn-secondary">Logout</button>
				<div class="spacer-48"></div>
			</div>
			`;
		} else if (loggedIn.status === 'success') {

			this.innerHTML = `
				<div id="userEditFriend" class="d-grid gap-2">
					<hr class="m-0">
					<div class="spacer-12"></div>
					<button id="userBefriendButton" class="btn btn-lg btn-success"><i class="bi bi-person-add"></i> Befriend</button>
					<button id="userUnfriendButton" class="btn btn-lg btn-danger"><i class="bi bi-person-dash"></i> Unfriend</button>
					<div class="spacer-48"></div>
				</div>
			`

			const BefriendButton = document.getElementById('userBefriendButton')
			const UnfriendButton = document.getElementById('userUnfriendButton')

			const Friendship = await usersAreFriends(loggedIn.user_id, this.RequestedUserId);
			console.log(`STATE OF FRIENDSHIP: ${Friendship}`);
			if (Friendship)
				BefriendButton.style.display = 'none';
			else
				UnfriendButton.style.display = 'none';
			this.setupEventListeners();
		} else {
			this.innerHTML = `<div class="spacer-48"></div>`;
		}
	}
}

customElements.define('profile-actionbar', ProfileAction);