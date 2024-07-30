import {getLoggedInState, pongerAvatars} from './login_signup.js';
import { urlRoute } from './url-router.js';
import { getCSRFToken } from './login_signup.js';


export async function setProfileImage(user_id) {
	const baseUrl = new URL(document.location).origin;
	let ranIndex = Math.floor(Math.random() * pongerAvatars.length);
	if (user_id)
		ranIndex = +user_id % (pongerAvatars.length -1);
	let randomImageFilename = pongerAvatars[ranIndex];
	let imageUrl = new URL(randomImageFilename, baseUrl).toString();

	if (user_id){
		try {
			const response = await fetch(`/api/user_mgt/profile/${user_id}`,
				{
					method: 'GET',
					credentials: 'include',
					headers: {
						'X-CSRFToken': getCSRFToken(),
					},
				}
			);
			if (response.ok && response.headers.get('Content-Type').includes('application/json')) {
				const data = await response.json();
				if (data.player_data && data.player_data.avatar) {
					imageUrl = baseUrl + '/media/' + data.player_data.avatar;
					return imageUrl;
				}
			} else {
				throw new Error('Non-JSON response received');
			}
		} catch (error) {
			console.error('Error:', error);
		}
	}

	return imageUrl;
}

export function updateProfileData() {
	const updateProfileAvatar = document.getElementById('updateProfileAvatar');
	const updateProfileNickname = document.getElementById('updateProfileNickname');
	const updateProfilePassword = document.getElementById('updateProfilePassword');
	const updateProfilePasswordConfirm = document.getElementById('updateProfilePasswordConfirm');
	const updateButton = document.getElementById('updateProfileButton');

	function validateForm() {
		if (updateProfilePassword.value || updateProfilePasswordConfirm.value || updateProfileNickname.value || (updateProfileAvatar && updateProfileAvatar.files.length > 0)) {
			updateButton.disabled = false;
		} else {
			updateButton.disabled = true;
		}
	}

	[updateProfilePassword, updateProfilePasswordConfirm, updateProfileNickname, updateProfileAvatar].forEach(input => {
		if (input) { // Check if the input exists
			input.addEventListener('input', validateForm);
		}
	});

	document.getElementById('updateProfileButton').addEventListener('click', function(e) {
		e.preventDefault();
		const password1 = updateProfilePassword.value;
		const password2 = updateProfilePasswordConfirm.value;
		const nickname = updateProfileNickname.value;

		if (password1 != password2) {
			alert('Passwords do not match.');
			return;
		}

		const formData = new FormData();
		if (nickname)
			formData.append('username', document.getElementById('updateProfileNickname').value);
		if (password1)
			formData.append('password', document.getElementById('updateProfilePassword').value);

		if (updateProfileAvatar.files.length > 0) {
			const imageFile = updateProfileAvatar.files[0];
			formData.append('image', imageFile);
		}

		fetch('/api/user_mgt/update/', {
			method: 'POST',
			body: formData,
			credentials: 'include',
			headers: {
				'X-CSRFToken': getCSRFToken(),
			}
		})
		.then(response => {
			if (response.ok && response.headers.get('Content-Type').includes('application/json')) {
				return response.json();
			}
			throw new Error('Non-JSON response received');
		})
		.then(data => {
			if (data.status === 'success') {
				urlRoute('/profile');
				console.log('Success:', data);
			} else if (data.status === 'error') {
				alert(data.message);
				console.error('Error:', data.message);
			}
		})
		.catch((error) => {
			console.error('Error:', error);
		});
	});

	validateForm();
}

export async function loadProfileData() {
	const errorContainer = document.getElementById('userProfileError');
	const userDataContainer = document.getElementById('userProfileData');
	const userActionBar = document.getElementById('userActionBar');
	const userAvatar = document.getElementById('userAvatar');
	const userNickname = document.getElementById('userNickname');
	const userGamesPlayed = document.getElementById('userGamesPlayed');
	const userRank = document.getElementById('userRank');
	const userScore = document.getElementById('userScore');
	const userGamesWon = document.getElementById('userGamesWon');
	const userGamesLost = document.getElementById('userGamesLost');
	const userFriendsList = document.getElementById('userFriendsList');
	const showUserGameHistoryButton = document.getElementById('showUserGameHistory');
	const urlQuery = new URLSearchParams(window.location.search);
	const userId = urlQuery.get('user');

	if (!userId) {
		console.error('No user ID found in URL query');
		return;
	}

	showUserGameHistoryButton.addEventListener('click', function(event) {
		event.preventDefault(); // Prevent the default anchor behavior

		const urlParams = new URLSearchParams(window.location.search);
		const user = urlParams.get('user'); // Get the "user" query parameter

		if (user) {
			// If the "user" parameter exists, append it to the href of the button
			const newHref = `/game-history?user=${user}`;
			urlRoute(newHref);
		}
	});

	if (userId) {
		try {
			const response = await fetch(`/api/user_mgt/profile/${userId}`,
				{
					method: 'GET',
					credentials: 'include',
					headers: {
						'X-CSRFToken': getCSRFToken(),
					},
				}
			);
			if (response.ok && response.headers.get('Content-Type').includes('application/json')) {
				let data = await response.json();

				if (data.status === 'error')
					throw new Error (data.message);
				else if (userAvatar && userNickname && userGamesPlayed && userRank && userScore && userGamesWon && userGamesLost && userFriendsList) {
					data = data.player_data;
					errorContainer.setAttribute('hidden', '');
					userDataContainer.removeAttribute('hidden');
					userActionBar.removeAttribute('hidden');
					// Set user avatar asynchronously
					userAvatar.src = await setProfileImage(data.user_id);
					userNickname.textContent = data.nickname;
					if (data.rank)
						userRank.textContent = data.rank.rank;
					userScore.textContent = data.total_score;
					userGamesPlayed.value = +data.tournaments;
					userGamesWon.value = +data.total_wins;
					userGamesLost.value = +data.total_lost;

					if (data.friends) {
						userFriendsList.removeAttribute('hidden');
						let noFriendsState = document.getElementById('emptyState');
						if (noFriendsState && data.friends.length) {
							noFriendsState.setAttribute('hidden', '');
						}
						for (const element of data.friends) {
							let newPlayer = document.createElement('player-component');
							let separator = document.createElement('hr');
							separator.setAttribute('class', 'm-0');
							newPlayer.setAttribute('name', element.username);
							newPlayer.setAttribute('user_id', element.user_id);
							if (element.online)
								newPlayer.setAttribute('online', '');
							// Await the setProfileImage call for each friend
							newPlayer.setAttribute('avatar', await setProfileImage(element.user_id));
							userFriendsList.appendChild(newPlayer);
							userFriendsList.appendChild(separator);
						}
					}
				}
			} else {
				throw new Error('Non-JSON response received');
			}
		} catch (error) {
			console.error(`Error fetching profile for user ID ${userId}:`, error);
		}
	}
};

const ProfileEditObserver = new MutationObserver(() => {
	const	userEditAvatar = document.getElementById('profileEditAvatar');
	let	 	userEditNickname = document.getElementById('profileEditNickname');
	const	userPassword = document.getElementById('userEditPassword');
	const	userPasswordConfirm = document.getElementById('userEditPasswordConfirm');
	const	userAccountDelete = document.getElementById('userEditProfileButton');


	if (userEditAvatar && userEditNickname && userPassword && userPasswordConfirm && userAccountDelete) {
		fetch('/api/user_mgt/me',
			{
				method: 'GET',
				credentials: 'include',
				headers: {
					'X-CSRFToken': getCSRFToken(),
				},
			}
		)
		.then(response => {
			// Check if the response is ok and content type is JSON
			if (response.ok && response.headers.get('Content-Type').includes('application/json')) {
				//
				return response.json();
			}
			throw new Error('Non-JSON response received');
		})
		.then(data => {
			// Use the user_id from the first API call in the second API call
			return fetch(`/api/user_mgt/profile/${data.user_id}`,
				{
					method: 'GET',
					credentials: 'include',
					headers: {
						'X-CSRFToken': getCSRFToken(),
					},
				}
			);
		})
		.then(response => response.json())
		.then(data => {
			userEditNickname.value = data.nickname;
		})
		.catch(error => {
			console.error('Error:', error);
		});

	urlRoute('/profile');
	}
});

ProfileEditObserver.observe(document, { childList: true, subtree: true });