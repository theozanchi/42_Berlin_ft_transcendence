export function generateLocalGame() {

	// 1. Selevt player List element
	let playerNames = Array.from(document.querySelectorAll('player-component')).map(player => player.getAttribute('name'));
		
	// 2. Create data obejct
	let data = { players: playerNames };

	// 3. Convert to JSON
	var json = JSON.stringify(data);

	// 4. Send POST request
	fetch ('https://test-api.com', {
		method:		'POST',
		body:		json,
		headers:	{ 'Content-Type': 'application/json' }
	})

	// 5. Handle response
	.then(response => response.json())
	.then(data => {
		console.log('Success:', data);
	})

	// 6. Handle errors
	.catch((error) => {
		console.error('Error:', error);
	});
	console.log(json);

alert(`Generating Game with ${playerList.childElementCount} Players: ${json}`);
}