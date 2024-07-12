const data ={
	"user_id": 2, 
	"nickname": "mgraf", 
	"full_name": "Marcel", 
	"joined": "2024-07-04T13:18:01Z", 
	"total_wins": 1, 
	"total_lost": 1, 
	"total_score": 10, 
	"tournaments": 2, 
	"requesting_user_friends_ids": [2, 1],
	"games": [{	
			"game_id": 2, 
			"start_date": "2024-07-04T13:57:00.615Z", 
			"end_date": "2024-07-04T13:56:58Z", 
			"own_rank": 2, 
			"own_score": 5, 
			"winner": null, 
			"participants": [["mgraf", 2], 
			["Techcrunch", 62]]
		}, 
		{	
			"game_id": 1, 
			"start_date": "2024-07-04T13:19:41.077Z", 
			"end_date": "2024-07-04T13:19:20Z", 
			"own_rank": 1, 
			"own_score": 5, 
			"winner": "mgraf", 
			"participants": [["mgraf", 2], ["admin", 1]]
		}
	], 
	"last_login": "2024-07-10T15:35:21.037Z", 
	"rank": [1, 2], 
	"total_users": 7, 
	"friends": [["mgraf", 2], ["admin", 1]]
};
		
const profileDataStringified = JSON.stringify(data);

console.log('p[rogfile.js');

function setProfileImage {
	const baseUrl = document.location.href;
	let imageUrl = new URL('assets/avatar_blossom.png', baseUrl);

	let image = document.getElementById('profileAvatar');
	image.setAttribute('src', imageURL);
}