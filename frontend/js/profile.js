function setProfileImage() {
	const baseUrl = document.location.href;
	let imageUrl = new URL('assets/avatar_blossom.png', baseUrl);

	let image = document.getElementById('profileAvatar');
	image.setAttribute('src', imageURL);
}


const ProfileObserver = new MutationObserver(() => {
	const userAvatar = document.getElementById('userAvatar');
	const userNickname = document.getElementById('userNickname');
	const userGamesPlayed = document.getElementById('userGamesPlayed');
	const userRank = document.getElementById('userRank');
	const userScore = document.getElementById('userScore');
	const userGamesWon = document.getElementById('userGamesWon');
	const userGamesLost = document.getElementById('userGamesLost');
	const userFriendsList = document.getElementById('UserFriendsList');


	// fetch('/api/user_mgt/profile/2/')

// PREPARED FOR USER_MGMT
	fetch('/api/user_mgt/user_mgt/me')
	.then(response => {
		// Check if the response is ok and content type is JSON
		if (response.ok && response.headers.get('Content-Type').includes('application/json')) {
		return response.json();
		}
		throw new Error('Non-JSON response received');
	})
	.then(response => {
		// Check if the response is ok and content type is JSON
		if (response.ok && response.headers.get('Content-Type').includes('application/json')) {
		return response.json();
		}
		throw new Error('Non-JSON response received');
// PREPARED FOR USER_MGMT
		fetch(`/api/user_mgt/profile/${response.user_id}`);
	})
	.then(data => {
		ProfileObserver.disconnect();

		// userAvatar.src = data.avatar;
		if (userAvatar && userNickname && userGamesPlayed && userRank && userScore && userGamesWon && userGamesLost && userFriendsList) {
			userNickname.textContent = data.nickname;
			userRank.textContent = data.rank.rank;
			userScore.textContent = data.total_score;
			userGamesPlayed.value = data.games.length;
			userGamesWon.value = data.total_wins;
			userGamesLost.value = data.total_lost;
			if (data.friends){
				let noFriendsState = document.getElementById('emptyState');
				if (noFriendsState)
					noFriendsState.setAttribute('hidden', '');
				data.friends.forEach(element => {
					let newPlayer = document.createElement('player-component');
					let separator = document.createElement('hr');
					separator.setAttribute('class', 'm-0')
					newPlayer.setAttribute('remove-button', '');
					newPlayer.setAttribute('name', element[0]);
					// FIX WITH NEW JSON
					// newPlayer.setAttribute('name', element.nickname);
					// newPlayer.setAttribute('avatar', element.avatar);
					userFriendsList.appendChild(newPlayer);
					userFriendsList.appendChild(separator);
				});
			}
		}

	})
	.catch(error => {
			console.error('Error:', error);
	});
});

ProfileObserver.observe(document, { childList: true, subtree: true });

const ProfileEditObserver = new MutationObserver(() => {
	const userEditAvatar = document.getElementById('profileEditAvatar');
	let	 userEditNickname = document.getElementById('profileEditNickname');
	const userPassword = document.getElementById('userEditPassword');
	const userPasswordConfirm = document.getElementById('userEditPasswordConfirm');
	const userAccountDelete = document.getElementById('userEditProfileButton');

	fetch('/api/user_mgt/profile/2/')

// PREPARED FOR USER_MGMT
	// fetch('/api/user_mgt/user_mgt/me')
	// .then(response => {
	// 	// Check if the response is ok and content type is JSON
	// 	if (response.ok && response.headers.get('Content-Type').includes('application/json')) {
	// 	return response.json();
	// 	}
	// 	throw new Error('Non-JSON response received');
	// })

	.then(response => {
		// Check if the response is ok and content type is JSON
		if (response.ok && response.headers.get('Content-Type').includes('application/json')) {
		return response.json();
		}
		throw new Error('Non-JSON response received');
// PREPARED FOR USER_MGMT
		// fetch(`/api/user_mgt/profile/${response.user_id}`);
	})
	.then(data => {
		ProfileEditObserver.disconnect();
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
});

ProfileEditObserver.observe(document, { childList: true, subtree: true });