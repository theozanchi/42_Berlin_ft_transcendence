document.addEventListener("DOMContentLoaded", () => {
    // Function to navigate and load content
    function navigate() {
        const hash = window.location.hash.substring(1);
        const app = document.getElementById("app");

        switch(hash) {
            case 'about':
                app.innerHTML = '<h2>About</h2><p>This is the about page.</p>';
                break;
            case 'pong':
                app.innerHTML = `
                    <h2>Pong Game</h2>
                    <canvas id="pongCanvas" width="800" height="400"></canvas>
                `;
                loadScript('pong.js');
                break;
            case 'home':
            default:
                app.innerHTML = '<h2>Home</h2><p>Welcome to the Home page.</p>';
                break;
        }
    }

    // Function to load external script
    function loadScript(src) {
        const script = document.createElement('script');
        script.src = src;
        document.head.appendChild(script);
    }

    // Event listener for navigation
    window.addEventListener("hashchange", navigate);

    // Initial navigation
    navigate();
});
