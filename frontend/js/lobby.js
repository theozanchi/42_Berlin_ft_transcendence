window.onload = function() {
	// let params = new URLSearchParams(window.location.search);
	// const gameID = params.get('id');


	// let input = document.getElementById("lobbyGameID");
	// if (input)
	// 	input.value = gameID;
	// setTimeout(setGameID(), 3000);
}

document.addEventListener("DOMContentLoaded", (event) => {
	setGameID('test');
});



function setGameID(gameID) {
	if (!gameID) {
		let params = new URLSearchParams(window.location.search);
		gameID = params.get('id');
	}

	let input = document.getElementById("lobbyGameID");
	if (input)
		input.value = gameID;
}