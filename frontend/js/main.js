let PongerChars = ['Blossom', 'Bubbles', 'Buttercup', 'Professor Utonium', 'The Mayor of Townsville', 'Ms. Bellum', 'Ms. Keane', 'Narrator', 'Talking Dog', 'Mitch Mitchelson', 'Stanley Whitfield', 'Mojo Jojo', 'Fuzzy Lumpkins', 'HIM', 'Princess Morbucks', 'The Gangreen Gang', 'The Amoeba Boys', 'Sedusa', 'The Rowdyruff Boys'];

// document.getElementById('localGameButton').addEventListener('click', function() {
//     document.getElementById('view1').style.display = 'none';
//     document.getElementById('view2').style.display = 'block';
// });

document.getElementById('backButton').addEventListener('click', function() {
    document.getElementById('view1').style.display = 'block';
    document.getElementById('view2').style.display = 'none';
});

// document.getElementById('addPlayerButton').addEventListener('click', function() {
//     let playerList = document.getElementById('playerList');

//     let newPlayer = document.createElement('player-component');
//     newPlayer.setAttribute('name', `${PongerChars[playerList.childElementCount]}`);
//     newPlayer.setAttribute('input', true);
//     newPlayer.setAttribute('remove-button', true);

//     playerList.appendChild(newPlayer);
// });

document.getElementById('generateGameButton').addEventListener('click', function() {
    
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
});