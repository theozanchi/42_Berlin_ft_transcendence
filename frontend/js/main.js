document.getElementById('localGameButton').addEventListener('click', function() {
    document.getElementById('view1').style.display = 'none';
    document.getElementById('view2').style.display = 'block';
});

document.getElementById('backButton').addEventListener('click', function() {
    document.getElementById('view1').style.display = 'block';
    document.getElementById('view2').style.display = 'none';
});

document.getElementById('addPlayerButton').addEventListener('click', function() {
    var playerList = document.getElementById('playerList');
    var playerDiv = document.createElement('div');
    var input = document.createElement('input');
    var removeButton = document.createElement('button');

    input.type = 'text';
    input.placeholder = 'Player name';
    removeButton.textContent = 'X';
    removeButton.addEventListener('click', function() {
        playerList.removeChild(playerDiv);
    });

    playerDiv.appendChild(input);
    playerDiv.appendChild(removeButton);
    playerList.appendChild(playerDiv);
});

document.getElementById('generateGameButton').addEventListener('click', function() {
    console.log('Game generated');
});