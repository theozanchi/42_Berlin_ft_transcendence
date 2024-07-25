import { urlRoute } from './url-router.js';
import * as csrfModule from './csrf.js';
import { getCookie } from './csrf.js';

function fetchCSRFToken() {
	fetch('/api/user_mgt/get-csrf-token')
		.then(response => response.json())
		.then(data => {
			console.log(data.csrfToken);
			localStorage.setItem('csrftoken', data.csrfToken);
		})
		.catch(error => console.error(error));
}


function getCSRFToken() {
	return localStorage.getItem('csrftoken');
}

export { fetchCSRFToken, getCSRFToken };

//FUNCTION THAT RETURNS THE LOGGED IN STATE OF CLIENT
export async function getLoggedInState() {
	fetchCSRFToken();
	const loggedIn = await fetch('/api/user_mgt/me', {
		method: 'GET',
		credentials: 'include',
		headers: {
			'X-CSRFToken': getCSRFToken(),
		},
	})
		.then(response => response.json())
		.catch(() => ({ status: "error" }));


	return loggedIn;
}


const LogInObserver = new MutationObserver(() => {
	const loginUser = document.getElementById('loginUser');
	const loginPassword = document.getElementById('loginPassword');
	const loginButton = document.getElementById('loginUserButton');
	const loginForm = document.getElementById('loginForm');
	const formData = new FormData();

	if (loginUser && loginPassword && loginButton) {
		function validateForm() {
			if (loginUser.value && loginPassword.value) {
				loginButton.disabled = false;
			} else {
				loginButton.disabled = true;
			}
		}
		loginUser.addEventListener('input', validateForm);
		loginPassword.addEventListener('input', validateForm);
	}

	if (loginForm) {
		loginForm.addEventListener('submit', function (e) {
			e.preventDefault();

			formData.append('username', loginUser.value);
			formData.append('password', loginPassword.value);

			if (!loginUser || !loginPassword) {
				alert('Username and password cannot be empty.');
				return;
			}

			fetch('/api/user_mgt/login/', {
				method: 'POST',
				body: formData,
				headers: {
					'X-CSRFToken': getCSRFToken(),
				}
			})
				.then(response => {
					// Check if the response is ok and content type is JSON
					if (response.ok && response.headers.get('Content-Type').includes('application/json')) {
						return response.json();
					}
					throw new Error('Non-JSON response received');
				})
				.then(data => {
					console.log('Response:', data);
					if (data.status === 'success')
						urlRoute('/');
					else
						throw new Error(data.message);
				})
				.catch((error) => {
					console.error('Error:', error);
					alert(error)
				});
		});
	};
});

// Start observing the document with the configured parameters
LogInObserver.observe(document, { childList: true, subtree: true });

const signupObserver = new MutationObserver(() => {
	const signupImage = document.getElementById('signupAvatar');
	const signupUser = document.getElementById('signupUser');
	const signupPassword = document.getElementById('signupPassword');
	const signupPasswordConfirm = document.getElementById('signupPasswordConfirm');
	const signupButton = document.getElementById('signupButton');
	const registrationForm = document.getElementById('registrationForm');

	if (signupUser && signupPassword && signupPasswordConfirm && signupButton) {
		// If all elements exist, stop observing
		// signupObserver.disconnect();

		function validateForm() {
			if (signupUser.value && signupPassword.value && signupPasswordConfirm.value && signupPassword.value === signupPasswordConfirm.value) {
				signupButton.disabled = false;
			} else {
				signupButton.disabled = true;
			}
		}

		signupUser.addEventListener('input', validateForm);
		signupPassword.addEventListener('input', validateForm);
		signupPasswordConfirm.addEventListener('input', validateForm);
	}

	if (registrationForm) {
		registrationForm.addEventListener('submit', function (e) {
			e.preventDefault();
			const password1 = signupPassword.value;
			const password2 = signupPasswordConfirm.value;
			const username = signupUser.value;

			if (password1 != password2) {
				alert('Passwords do not match.');
				return;
			}

			const formData = new FormData();
			formData.append('username', username);
			formData.append('password', password1);

			const imageInput = signupImage;
			if (imageInput.files.length > 0) {
				const imageFile = imageInput.files[0];
				formData.append('image', imageFile);
			}

			fetch('/api/user_mgt/register/', {
				method: 'POST',
				body: formData,
				headers: {
					'X-CSRFToken': getCSRFToken(),
				}
			})
				.then(response => {
					// Check if the response is ok and content type is JSON
					if (response.ok && response.headers.get('Content-Type').includes('application/json')) {
						return response.json();
					}
					throw new Error('Non-JSON response received');
				})
				.then(data => {
					if (data.status === 'success') {
						console.log('Success:', data);
						urlRoute('/');
					}
					throw new Error(data.message);
				})
				.catch((error) => {
					console.error('Error:', error);
					alert(error)
				});
		});
	}
});

// Start observing the document with the configured parameters
signupObserver.observe(document, { childList: true, subtree: true });

const LogOutObserver = new MutationObserver(() => {
	const logoutUser = document.getElementById('logoutUserButton');
	const logoutData = new FormData();

	// console.log('HELLO');

	if (logoutUser && !logoutUser.hasEventListener) {
		logoutUser.addEventListener('click', function (e) {
			// Use an IIFE to handle the async operation
			(async () => {
				const userData = await getLoggedInState();
				console.log('HELLO AGAIN');

				if (userData && userData.user_id) { // Ensure userData and user_id are valid
					logoutData.append('user_id', userData.user_id);


					fetch('/api/user_mgt/logout/', {
						method: 'POST',
						body: logoutData,
						headers: {
							'X-CSRFToken': getCSRFToken()
						}
					})
						.then(response => response.json())
						.then(data => {
							if (data.status === 'success')
								urlRoute('/');
							else
								throw new Error(data.message);
						});
				} else {
					console.error('Failed to get user data');
					alert(`Error while logging you out`)
				}
			})();
		});
		logoutUser.hasEventListener = true;
	}
});

// Start observing the document with the configured parameters
LogOutObserver.observe(document, { childList: true, subtree: true });