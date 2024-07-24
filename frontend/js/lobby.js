window.onload = function() {
	// let params = new URLSearchParams(window.location.search);
	// const gameID = params.get('id');


	// let input = document.getElementById("lobbyGameID");
	// if (input)
	// 	input.value = gameID;
	// setTimeout(setGameID(), 3000);
}

// document.addEventListener("DOMContentLoaded", (event) => {
// 	setGameID('test');
// });

export function startGameButton() {
	console.log('startGameButton called');
	// document.addEventListener('DOMContentLoaded', (event) => {
    const startGameButton = document.getElementById('startGameButton');
	if (startGameButton)
		console.log('startGameButton found in the DOM');
	else
		console.log('startGameButton not found in the DOM');
    startGameButton.addEventListener('click', function() {
		console.log('startGameButton event listener called');
        sendJson(JSON.stringify({ type: 'start-game' }));
        console.log('Start Game button clicked');
    });
	// });
}

function setGameID(gameID) {
	if (!gameID) {
		let params = new URLSearchParams(window.location.search);
		gameID = params.get('id');
	}

	let input = document.getElementById("lobbyGameID");
	if (input)
		input.value = gameID;
}