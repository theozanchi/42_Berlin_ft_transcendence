import { setProfileImage } from './profile.js';
import { getCSRFToken } from './login_signup.js';


export async function loadUserList() {
	const usersList = document.getElementById('userList');
	const emptyState = document.getElementById('emptyState');
	if (!usersList)
		console.error('Element usersList not Found')

	try {
		console.log('getting user list');
		const response = await fetch(`/api/user_mgt/user_list`,
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
			if (data.status === 'info' && data.user_list) {

				usersList.removeAttribute('hidden');
				emptyState.setAttribute('hidden', '');

				for (const element of data.user_list) {
					console.log('creating player');
					let newPlayer = document.createElement('player-component');
					let separator = document.createElement('hr');

					separator.setAttribute('class', 'm-0');

					newPlayer.setAttribute('name', element.alias);
					newPlayer.setAttribute('user_id', element.user_id);
					newPlayer.setAttribute('link_profile', '');
					newPlayer.setAttribute('avatar', await setProfileImage(element.user_id));

					usersList.appendChild(newPlayer);
					usersList.appendChild(separator);
				}
			}
			else if (!data.user_list) {
				console.log('there are no users');
			}
		} else {
			throw new Error('Non-JSON response received');
		}
	} catch (error) {
		console.error(`Error fetching users`, error);
	}
};