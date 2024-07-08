window.onload = function() {
	let params = new URLSearchParams(window.location.search);
	const gameID = params.get('id');
	console.log(`gameID: ${gameID}`);



	let input = document.getElementById("lobbyGameID");
	console.log(input);
	if (input)
		input.value = gameID;
}