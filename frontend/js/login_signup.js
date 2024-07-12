const LogInObserver = new MutationObserver(() => {
	const loginUser = document.getElementById('loginUser');
	const loginPassword = document.getElementById('loginPassword');
	const loginButton = document.getElementById('loginUserButton');

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
});

// Start observing the document with the configured parameters
LogInObserver.observe(document, { childList: true, subtree: true });

const signupObserver = new MutationObserver(() => {
    const signupUser = document.getElementById('signupUser');
    const loginPassword = document.getElementById('signupPassword');
    const loginPasswordConfirm = document.getElementById('signupPasswordConfirm');
    const loginButton = document.getElementById('signupButton');

    if (signupUser && loginPassword && loginPasswordConfirm && loginButton) {
        // If all elements exist, stop observing
        signupObserver.disconnect();

        function validateForm() {
            if (signupUser.value && loginPassword.value && loginPasswordConfirm.value && loginPassword.value === loginPasswordConfirm.value) {
                loginButton.disabled = false;
            } else {
                loginButton.disabled = true;
            }
        }

        signupUser.addEventListener('input', validateForm);
        loginPassword.addEventListener('input', validateForm);
        loginPasswordConfirm.addEventListener('input', validateForm);
    }
});

// Start observing the document with the configured parameters
signupObserver.observe(document, { childList: true, subtree: true });