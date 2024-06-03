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
    input.placeholder = `Player #${playerList.childElementCount}`;
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
    alert(`Generating Game with ${playerList.childElementCount} Players`);
});