let PongerChars = ['Blossom', 'Bubbles', 'Buttercup', 'Professor Utonium', 'The Mayor of Townsville', 'Ms. Bellum', 'Ms. Keane', 'Narrator', 'Talking Dog', 'Mitch Mitchelson', 'Stanley Whitfield', 'Mojo Jojo', 'Fuzzy Lumpkins', 'HIM', 'Princess Morbucks', 'The Gangreen Gang', 'The Amoeba Boys', 'Sedusa', 'The Rowdyruff Boys'];

document.getElementById('localGameButton').addEventListener('click', function() {
    document.getElementById('view1').style.display = 'none';
    document.getElementById('view2').style.display = 'block';
});

document.getElementById('backButton').addEventListener('click', function() {
    document.getElementById('view1').style.display = 'block';
    document.getElementById('view2').style.display = 'none';
});

document.getElementById('addPlayerButton').addEventListener('click', function() {
    let playerList = document.getElementById('playerList');
    let playerDiv = document.createElement('div');
    playerDiv.className = 'row'; // Bootstrap class for a row

    var inputDiv = document.createElement('div');
    inputDiv.className = 'col'; // Bootstrap class for a column
    let input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control';
    input.label = `${playerList.childElementCount}`;
    input.value = `${PongerChars[playerList.childElementCount]}`;
    inputDiv.appendChild(input);

    const buttonDiv = document.createElement('div');
    buttonDiv.className = 'col-auto'; // Bootstrap class for a column that only takes the space it needs
    const removeButton = document.createElement('button');
    removeButton.textContent = 'X';
    removeButton.className = 'btn btn-outline-danger';
    removeButton.addEventListener('click', function() {
        playerList.removeChild(playerDiv);
    });
    buttonDiv.appendChild(removeButton);

    playerDiv.appendChild(inputDiv);
    playerDiv.appendChild(buttonDiv);
    playerList.appendChild(playerDiv);
});

document.getElementById('generateGameButton').addEventListener('click', function() {
    
	// 1. Selevt player List element
	let playerNames = Array.from(document.querySelectorAll('#playerList input')).map(input => input.value);
	
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