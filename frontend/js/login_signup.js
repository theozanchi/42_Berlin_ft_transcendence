let logged_in = false;
let user_id = -1;

const LogInObserver = new MutationObserver(() => {
	const loginUser = document.getElementById('loginUser');
	const loginPassword = document.getElementById('loginPassword');
	const loginButton = document.getElementById('loginUserButton');
	const loginForm = document.getElementById('loginForm');
	const logoutUser = document.getElementById('logoutUserButton');

	if (loginUser && loginPassword && loginButton) {
		// If all elements exist, stop observing
		LogInObserver.disconnect();

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
		loginForm.addEventListener('submit', function(e) {
			e.preventDefault();


			const formData = new FormData();
			formData.append('username', loginUser.value);
			formData.append('password', loginPassword.value);

			if (!loginUser || !loginPassword) {
				alert('Username and password cannot be empty.');
				return;
			}

			fetch('/api/user_mgt/login/', {
				method: 'POST',
				body: formData,
			})
			.then(response => {
				// Check if the response is ok and content type is JSON
				if (response.ok && response.headers.get('Content-Type').includes('application/json')) {
					return response.json();
				}
				throw new Error('Non-JSON response received');
			})
			.then(data => {
				console.log('Success:', data);
				urlRoute('/');

			})
			.catch((error) => {
				console.error('Error:', error);
			});
		});
	};

	if (logoutUser) {
		console.log('logging out');
		fetch('/api/user_mgt/logout/', {
			method: 'POST',
			body: formData,
		})
	}
});

// Start observing the document with the configured parameters
LogInObserver.observe(document, { childList: true, subtree: true });

const signupObserver = new MutationObserver(() => {
	const signupImage =document.getElementById('signupAvatar'); 
	const signupUser = document.getElementById('signupUser');
	const signupPassword = document.getElementById('signupPassword');
	const signupPasswordConfirm = document.getElementById('signupPasswordConfirm');
	const signupButton = document.getElementById('signupButton');
	const registrationForm = document.getElementById('registrationForm');

	if (signupUser && signupPassword && signupPasswordConfirm && signupButton) {
		// If all elements exist, stop observing
		signupObserver.disconnect();

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
		registrationForm.addEventListener('submit', function(e) {
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
			})
			.then(response => {
				// Check if the response is ok and content type is JSON
				if (response.ok && response.headers.get('Content-Type').includes('application/json')) {
					return response.json();
				}
				throw new Error('Non-JSON response received');
			})
			.then(data => {
				console.log('Success:', data);
				urlRoute('/');

			})
			.catch((error) => {
				console.error('Error:', error);

			});
		});
	}
});

// Start observing the document with the configured parameters
signupObserver.observe(document, { childList: true, subtree: true });