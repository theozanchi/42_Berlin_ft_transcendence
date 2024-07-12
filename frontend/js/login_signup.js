

/// LOGIN LISTENER ///
// document.addEventListener('DOMContentLoaded', function() {
//     const emailInput = document.getElementById('loginUser');
//     const passwordInput = document.getElementById('loginPassword');
//     const loginButton = document.getElementById('loginButton');

//     function enableOrDisableLoginButton() {
//         if (emailInput.value && passwordInput.value) {
//             loginButton.disabled = false;
//         } else {
//             loginButton.disabled = true;
//         }
//     }

//     emailInput.addEventListener('input', enableOrDisableLoginButton);
//     passwordInput.addEventListener('input', enableOrDisableLoginButton);

//     // Initially disable the button
//     loginButton.disabled = true;
// });

const observer = new MutationObserver(() => {
	const signupUser = document.getElementById('signupUser');
	const loginPassword = document.getElementById('signupPassword');
	const loginPasswordConfirm = document.getElementById('signupPasswordConfirm');
	const loginButton = document.getElementById('signupButton');

	if (signupUser && loginPassword && loginPasswordConfirm && loginButton) {
		// If all elements exist, stop observing
		observer.disconnect();

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
observer.observe(document, { childList: true, subtree: true });