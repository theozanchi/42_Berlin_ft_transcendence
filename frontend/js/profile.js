import {getLoggedInState} from './login_signup.js';
import { urlRoute } from './url-router.js';
// import {urlRoute} from './url-router.js';


// export function setProfileImage(user_id) {
// 	const url = new URL(document.location.href);
// 	const baseUrl = new URL(document.location).origin;
// 	let imageUrl = new URL('assets/avatar_blossom.png', baseUrl);

// 	fetch(`/api/user_mgt/profile/${user_id}`)
// 		.then(response => {
// 			// Check if the response is ok and content type is JSON
// 			if (response.ok && response.headers.get('Content-Type').includes('application/json')) {
// 				return response.json();
// 			}
// 			throw new Error('Non-JSON response received');
// 	})	
// 	.then(response => {
// 	if (response.player_data.user_avatar)
// 		imageUrl = baseUrl + '/media/' + response.player_data.avatar;
// 		console.log(baseUrl + '/media/' + response.player_data.avatar)
// 		console.log(`returning: ${imageUrl}`)
// 		return (imageUrl);
// 	})
// 	return (imageUrl);
// }

export async function setProfileImage(user_id) {
    const baseUrl = new URL(document.location).origin;
    let imageUrl = new URL('assets/avatar_blossom.png', baseUrl).toString();

	console.log('setting image');

    try {
        const response = await fetch(`/api/user_mgt/profile/${user_id}`);
        if (response.ok && response.headers.get('Content-Type').includes('application/json')) {
            const data = await response.json();
            if (data.player_data && data.player_data.avatar) {
				console.log(data);
                imageUrl = baseUrl + '/media/' + data.player_data.avatar;
				console.log(imageUrl);
            }
        } else {
            throw new Error('Non-JSON response received');
        }
    } catch (error) {
        console.error('Error:', error);
    }
    return imageUrl;
}

export function updateProfileData() {
	const updateProfileAvatar = document.getElementById('updateProfileAvatar');
	const updateProfileNickname = document.getElementById('updateProfileNickname');
	const updateProfilePassword = document.getElementById('updateProfilePassword');
	const updateProfilePasswordConfirm = document.getElementById('updateProfilePasswordConfirm');
	const deleteButton = document.getElementById('deleteProfileButton');
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
		})
		.then(response => {
			if (response.ok && response.headers.get('Content-Type').includes('application/json')) {
				return response.json();
			}
			throw new Error('Non-JSON response recieved');
		})
		.then(data => {
			console.log('Success:', data);
		})
		.catch((error) => {
			console.error('Error:', error);
		});
	});

	validateForm();
}

// const ProfileObserver = new MutationObserver((mutations) => {
// export function loadProfileData() {

// 	// console.log(mutations);

// 	const userAvatar = document.getElementById('userAvatar');
// 	const userNickname = document.getElementById('userNickname');
// 	const userGamesPlayed = document.getElementById('userGamesPlayed');
// 	const userRank = document.getElementById('userRank');
// 	const userScore = document.getElementById('userScore');
// 	const userGamesWon = document.getElementById('userGamesWon');
// 	const userGamesLost = document.getElementById('userGamesLost');
// 	const userFriendsList = document.getElementById('userFriendsList');
// 	const urlQuery = new URLSearchParams(window.location.search);
// 	const userId = urlQuery.get('user');

// 	if (!userId) {
// 		console.error('No user ID found in URL query');
// 		return;
// 	}

// 	fetch(`/api/user_mgt/profile/${userId}`)
// 		.then(response => {
// 			if (response.ok && response.headers.get('Content-Type').includes('application/json')) {
// 				return response.json();
// 			}
// 			throw new Error('Non-JSON response received');
// 		})
// 		.then(data => {
// 			console.log('Starting to work');
// 			if (userAvatar && userNickname && userGamesPlayed && userRank && userScore && userGamesWon && userGamesLost && userFriendsList) {
// 				// console.log('Starting to work');
// 				data = data.player_data;
// 				// console.log(`HERE IS SOME DATA: ${data}`);
// 				// ProfileObserver.disconnect();
				
// 				//WRITE USER DATA TO TEMPLATE
// 				userAvatar.src = setProfileImage(data.user_id);
// 				userNickname.textContent = data.nickname;
// 				userRank.textContent = data.rank.rank;
// 				userScore.textContent = data.total_score;
// 				userGamesPlayed.textContent = data.games.length;
// 				userGamesWon.textContent = data.total_wins;
// 				userGamesLost.textContent = data.total_lost;
// 				if (data.friends) {
// 					// userFriendsList.style.display = 'block'; 
// 					userFriendsList.removeAttribute('hidden');
// 					let noFriendsState = document.getElementById('emptyState');
// 					if (noFriendsState && data.friends.length)
//         				// noFriendsState.style.display = 'none';
// 						noFriendsState.setAttribute('hidden', '');
// 					data.friends.forEach(element => {
// 						let newPlayer = document.createElement('player-component');
// 						let separator = document.createElement('hr');
// 						separator.setAttribute('class', 'm-0');
// 						// newPlayer.setAttribute('remove-button', '');
// 						newPlayer.setAttribute('name', element.username);
// 						newPlayer.setAttribute('user_id', element.user_id); 
// 						newPlayer.setAttribute('avatar', setProfileImage(element.user_id)); // FIX THIS IN PLAYER COMPONENT 
// 						userFriendsList.appendChild(newPlayer);
// 						userFriendsList.appendChild(separator);
// 					});
// 				}
// 			}
// 		})
// 		.catch(error => {
// 			console.error(`Error fetching profile for user ID ${userId}:`, error);
// 		});
// };

export async function loadProfileData() {
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

    if (!userId) {
        console.error('No user ID found in URL query');
        return;
    }

    try {
        const response = await fetch(`/api/user_mgt/profile/${userId}`);
        if (response.ok && response.headers.get('Content-Type').includes('application/json')) {
            let data = await response.json();
            // console.log('Starting to work');
            if (userAvatar && userNickname && userGamesPlayed && userRank && userScore && userGamesWon && userGamesLost && userFriendsList) {
                data = data.player_data;
                
                // Set user avatar asynchronously
                userAvatar.src = await setProfileImage(data.user_id);
                userNickname.textContent = data.nickname;
                userRank.textContent = data.rank.rank;
                userScore.textContent = data.total_score;
                userGamesPlayed.value = +data.games.length;
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

	urlRoute('/profile');
	}
});

ProfileEditObserver.observe(document, { childList: true, subtree: true });