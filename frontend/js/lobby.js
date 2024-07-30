export function setGameID(gameID) {
	if (!gameID) {
		let params = new URLSearchParams(window.location.search);
		gameID = params.get('id');
	}

	let input = document.getElementById("lobbyGameID");
	if (input) {
		input.value = gameID;
	}
}
