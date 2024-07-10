document.addEventListener('DOMContentLoaded', function() {
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const loginButton = document.getElementById('loginButton');

    function enableOrDisableLoginButton() {
        if (emailInput.value && passwordInput.value) {
            loginButton.disabled = false;
        } else {
            loginButton.disabled = true;
        }
    }

    emailInput.addEventListener('input', enableOrDisableLoginButton);
    passwordInput.addEventListener('input', enableOrDisableLoginButton);
 
    // Initially disable the button
    loginButton.disabled = true;
});