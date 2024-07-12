
	document.getElementById('registrationForm').addEventListener('submit', function(e) {
		e.preventDefault();
		const password1 = document.getElementById('password1').value;
		const password2 = document.getElementById('password2').value;

		if (password1 != password2) {
			alert('Passwords do not match.');
			return;
		}

		const formData = new FormData();
		formData.append('username', document.getElementById('username').value);
		formData.append('password', document.getElementById('password1').value);

		const imageInput = document.getElementById('image');
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

		})
		.catch((error) => {
			console.error('Error:', error);

		});
	});
