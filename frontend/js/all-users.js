import { setProfileImage } from './profile.js';


export async function loadUserList() {
	const usersList = document.getElementById('userList');
	const emptyState = document.getElementById('emptyState');
	if (!usersList)
		console.error('Element usersList not Found')

	try {
		const response = await fetch(`/api/user_mgt/ranking`);
		if (response.ok && response.headers.get('Content-Type').includes('application/json')) {
			let data = await response.json();
			if (data.status === 'info' && data.rankings) {
				
				usersList.removeAttribute('hidden');
				emptyState.setAttribute('hidden', '');

				for (const element of data.rankings) {
					console.log('creating player');
					let newPlayer = document.createElement('player-component');
					let separator = document.createElement('hr');
					
					separator.setAttribute('class', 'm-0');
					
					newPlayer.setAttribute('name', element.username);
					newPlayer.setAttribute('user_id', element.user_id);
					newPlayer.setAttribute('link_profile', '');
					newPlayer.setAttribute('avatar', await setProfileImage(element.id));
					
					usersList.appendChild(newPlayer);
					usersList.appendChild(separator);
				}
			}
			else if (!data.rankings) {
				console.log('there are no users');
			}
		} else {
			throw new Error('Non-JSON response received');
		}
	} catch (error) {
		console.error(`Error fetching users`, error);
	}
};