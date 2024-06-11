game = {
	id,
	players: [],
	state,

	addPlayer	: function(player) {
		this.players.push(player);
	}
}

function createLocalGame (id, players) {
	this.id = id;
	this.players = players;
}
