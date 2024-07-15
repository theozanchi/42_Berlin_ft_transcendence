// const data ={
// 	"user_id": 2, 
// 	"nickname": "mgraf", 
// 	"full_name": "Marcel", 
// 	"joined": "2024-07-04T13:18:01Z", 
// 	"total_wins": 1, 
// 	"total_lost": 1, 
// 	"total_score": 10, 
// 	"tournaments": 2, 
// 	"requesting_user_friends_ids": [2, 1],
// 	"games": [{	
// 			"game_id": 2, 
// 			"start_date": "2024-07-04T13:57:00.615Z", 
// 			"end_date": "2024-07-04T13:56:58Z", 
// 			"own_rank": 2, 
// 			"own_score": 5, 
// 			"winner": null, 
// 			"participants": [["mgraf", 2], 
// 			["Techcrunch", 62]]
// 		}, 
// 		{	
// 			"game_id": 1, 
// 			"start_date": "2024-07-04T13:19:41.077Z", 
// 			"end_date": "2024-07-04T13:19:20Z", 
// 			"own_rank": 1, 
// 			"own_score": 5, 
// 			"winner": "mgraf", 
// 			"participants": [["mgraf", 2], ["admin", 1]]
// 		}
// 	], 
// 	"last_login": "2024-07-10T15:35:21.037Z", 
// 	"rank": [1, 2], 
// 	"total_users": 7, 
// 	"friends": [["mgraf", 2], ["admin", 1]]
// };
		
// const profileDataStringified = JSON.stringify(data);



console.log('profile.js');

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


	fetch('/api/user_mgt/profile/2/')
	.then(response => {
		// Check if the response is ok and content type is JSON
		if (response.ok && response.headers.get('Content-Type').includes('application/json')) {
		return response.json();
		}
		throw new Error('Non-JSON response received');
	})
	.then(data => {
		// Use the data here
		console.log("USER DATA");
		console.log(data);
		userAvatar.src = data.avatar;
		userNickname.textContent = data.nickname;
        userRank.textContent = data.rank.rank;
        userScore.textContent = data.total_score;
        userGamesPlayed.value = data.games.length;
        userGamesWon.value = data.total_wins;
        userGamesLost.value = data.total_lost;
		if (data.friends){
			let noFriendsState = document.getElementById('emptyState');
			noFriendsState.setAttribute('hidden', '');
			data.friends.forEach(element => {
				userFriendsList.appendChild(element);
			});
		}

	})
	.catch(error => {
		console.error('Error:', error);
	});
});

ProfileObserver.observe(document, { childList: true, subtree: true });