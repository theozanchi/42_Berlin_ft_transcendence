
	document.getElementById('loginForm').addEventListener('submit', function(e) {
		e.preventDefault();


		const formData = new FormData();
		formData.append('username', document.getElementById('username').value);
		formData.append('password', document.getElementById('password').value);

		if (!username || !password) {
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

		})
		.catch((error) => {
			console.error('Error:', error);

		});
	});
