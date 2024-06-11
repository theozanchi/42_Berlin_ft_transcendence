// GAME SETUP STEPPER TO GENERATE OR JOIN GAMES
// CONSIST OF:
	// STEPPER TITLEBAR
	// VIEW TO EDIT SETTINGS
	// PROCCEED/START BUTTON

	class StepperWrapper extends HTMLElement {
		constructor() {
			super();
			this.shadow = this.attachShadow({mode: 'open'});
		}
	
		connectedCallback() {
			console.log("rendering");

			document.getElementById('localGameButton').addEventListener('click', () => {
				document.getElementById('00-welcome').style.display = 'none';
    			document.getElementById('10-local').style.display = 'block';
			});

			document.getElementById('remoteGameButton').addEventListener('click', () => {
				document.getElementById('00-welcome').style.display = 'none';
    			document.getElementById('20-remote-switch').style.display = 'block';
				
			});

			document.getElementById('generateLocalGameButton').addEventListener('click', () => {
				document.getElementById('00-welcome').style.display = 'block';
				document.getElementById('10-local').style.display = 'none';
				alert(`Generating LocalGame with Players`)				
			});

			document.getElementById('joinRemoteGameButton').addEventListener('click', () => {
    			document.getElementById('21-remote-join').style.display = 'block';
				document.getElementById('20-remote-switch').style.display = 'none';
			});

			document.getElementById('hostRemoteGameButton').addEventListener('click', () => {
				document.getElementById('20-remote-switch').style.display = 'none';
				document.getElementById('22-remote-host').style.display = 'block';
			});
			
			document.getElementById('startRemoteGameButton').addEventListener('click', () => {
				document.getElementById('00-welcome').style.display = 'block';
				document.getElementById('22-remote-host').style.display = 'none';
				alert(`Get Ready to Play Your Remote Game`)	
			});


			// this.render();
		}
	
		/* render() {
			this.shadow.innerHTML = `
				<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"></link>
				<style>
					.stepper-container {
						display: flex;
						flex-direction: column;
						height: 100%;
					}
					.generate-game-button {
						margin-top: auto;
					}
				</style>
				<stepper-titlebar></stepper-titlebar>
				<button class="btn btn-primary btn-lg d-grid generate-game-button">Generate Game</button>
				`
		} */
	}
	
	
	customElements.define('stepper-component', StepperWrapper);