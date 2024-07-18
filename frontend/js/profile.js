import {getLoggedInState} from './login_signup.js';
// import {urlRoute} from './url-router.js';


export function setProfileImage(user_id) {
	const baseUrl = document.location.href;
	let imageUrl = new URL('assets/avatar_blossom.png', baseUrl);

	fetch(`/api/user_mgt/profile/${user_id}`)
		.then(response => {
			// Check if the response is ok and content type is JSON
			if (response.ok && response.headers.get('Content-Type').includes('application/json')) {
				return response.json();
			}
			throw new Error('Non-JSON response received');
	})	
	.then(response => {
	if (response.player_data.user_avatar)
		imageUrl = response.player_data.user_avatar;
		console.log(`imageURL: ${imageUrl}`)
		return (imageUrl);
	})
	return (imageUrl);
}

// const ProfileObserver = new MutationObserver((mutations) => {
export function updateProfile() {

	// console.log(mutations);

	const userAvatar = document.getElementById('userAvatar');
	const userNickname = document.getElementById('userNickname');
	const userGamesPlayed = document.getElementById('userGamesPlayed');
	const userRank = document.getElementById('userRank');
	const userScore = document.getElementById('userScore');
	const userGamesWon = document.getElementById('userGamesWon');
	const userGamesLost = document.getElementById('userGamesLost');
	const userFriendsList = document.getElementById('userFriendsList');
	const urlQuery = new URLSearchParams(window.location.search);
	const userId = urlQuery.get('user');

	console.log('SO MUCH THINGS TO DO')
	console.log(userId);

	if (!userId) {
		console.error('No user ID found in URL query');
		return;
	}

	fetch(`/api/user_mgt/profile/${userId}`)
		.then(response => {
			if (response.ok && response.headers.get('Content-Type').includes('application/json')) {
				return response.json();
			}
			throw new Error('Non-JSON response received');
		})
		.then(data => {
			console.log('Starting to work');
			if (userAvatar && userNickname && userGamesPlayed && userRank && userScore && userGamesWon && userGamesLost && userFriendsList) {
				console.log('Starting to work');
				data = data.player_data;
				console.log(`HERE IS SOME DATA: ${data}`);
				// ProfileObserver.disconnect();
				
				//WRITE USER DATA TO TEMPLATE
				userAvatar.src = setProfileImage(data.user_id);
				userNickname.textContent = data.nickname;
				userRank.textContent = data.rank.rank;
				userScore.textContent = data.total_score;
				userGamesPlayed.textContent = data.games.length;
				userGamesWon.textContent = data.total_wins;
				userGamesLost.textContent = data.total_lost;
				if (data.friends) {
					// userFriendsList.style.display = 'block'; 
					userFriendsList.removeAttribute('hidden');
					let noFriendsState = document.getElementById('emptyState');
					if (noFriendsState && data.friends.length)
        				// noFriendsState.style.display = 'none';
						noFriendsState.setAttribute('hidden', '');
					data.friends.forEach(element => {
						let newPlayer = document.createElement('player-component');
						let separator = document.createElement('hr');
						separator.setAttribute('class', 'm-0');
						// newPlayer.setAttribute('remove-button', '');
						newPlayer.setAttribute('name', element.username);
						newPlayer.setAttribute('user_id', element.user_id); 
						newPlayer.setAttribute('avatar', setProfileImage(element.user_id)); // FIX THIS IN PLAYER COMPONENT 
						userFriendsList.appendChild(newPlayer);
						userFriendsList.appendChild(separator);
					});
				}
			}
		})
		.catch(error => {
			console.error(`Error fetching profile for user ID ${userId}:`, error);
		});
};

// ProfileObserver.observe(document, { childList: true, subtree: true });

const ProfileEditObserver = new MutationObserver(() => {
	const	userEditAvatar = document.getElementById('profileEditAvatar');
	let	 	userEditNickname = document.getElementById('profileEditNickname');
	const	userPassword = document.getElementById('userEditPassword');
	const	userPasswordConfirm = document.getElementById('userEditPasswordConfirm');
	const	userAccountDelete = document.getElementById('userEditProfileButton');

	// fetch('/api/user_mgt/profile/2/')

// PREPARED FOR USER_MGMT
	if (userEditAvatar && userEditNickname && userPassword && userPasswordConfirm && userAccountDelete) {
		fetch('/api/user_mgt/me')
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
			return fetch(`/api/user_mgt/profile/${data.user_id}`);
		})
		.then(response => response.json())
		.then(data => {
			// ProfileEditObserver.disconnect();
			console.log(data.nickname)
			userEditNickname.value = data.nickname;
			// Use the data here
			// console.log("USER DATA");
			// console.log(data);
			// userAvatar.src = data.avatar;
		})
		.catch(error => {
			console.error('Error:', error);
		});
	}
});

ProfileEditObserver.observe(document, { childList: true, subtree: true });