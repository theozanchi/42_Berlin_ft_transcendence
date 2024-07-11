///// START DUMMY CONTENT TO TEST UI /////
const data = {
	"type": "broadcast",
	"content": {
		"game_id": "gjd3KnR5",
		"mode": "remote",
		"winner": null,
		"rounds": [
			{
				"round_number": 1,
				"player1": "player1",
				"player2": "player2",
				"winner": null,
				"player1_score": 0,
				"player2_score": 0,
				"player1_channel_name": "specific.4465620cc3b24e4c93ffc8140ba86f30!459330cb3a334ab09ea7c97444b86a54",
				"player2_channel_name": "specific.4465620cc3b24e4c93ffc8140ba86f30!459330cb3a334ab09ea7c97444b86a54"
			},
			{
				"round_number": 2,
				"player1": "player1",
				"player2": "player3",
				"winner": null,
				"player1_score": 0,
				"player2_score": 0,
				"player1_channel_name": "specific.4465620cc3b24e4c93ffc8140ba86f30!459330cb3a334ab09ea7c97444b86a54",
				"player2_channel_name": "specific.4465620cc3b24e4c93ffc8140ba86f30!459330cb3a334ab09ea7c97444b86a54"
			},
			{
				"round_number": 3,
				"player1": "player2",
				"player2": "player3",
				"winner": null,
				"player1_score": 0,
				"player2_score": 0,
				"player1_channel_name": "specific.4465620cc3b24e4c93ffc8140ba86f30!459330cb3a334ab09ea7c97444b86a54",
				"player2_channel_name": "specific.4465620cc3b24e4c93ffc8140ba86f30!459330cb3a334ab09ea7c97444b86a54"
			},
		],
		"players": ["Player1", "Player1", "Player3"],
		"host": "specific.5797d5f99c3b413482689681dc516691!0b8c81c8576e4329b1257001beb3460d"
	}
};
		
const gameDataStringified = JSON.stringify(data);
///// END DUMMY CONTENT /////

// Define the setGameData function
function setGameData(data) {
    // Find the game-table-component element
    const gameTable = document.querySelector('game-table-component');

    // Set the data attribute
    if (gameTable) {
        gameTable.setAttribute('data', data);
    }
}

// Make the function globally accessible
window.setGameData = setGameData;

// Call the function with the dummy data
setGameData(gameDataStringified);

class GameTable extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({mode: 'open'});
    }

    static get observedAttributes() {
        return ['data'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'data') {
            this._data = JSON.parse(newValue);
            this.render();
        }
    }

    render() {
        if (!this._data) {
            // _data is not defined, so there's nothing to render
            return;
        }

        let nextGames = '<div>';

        this._data.content.rounds.forEach(round => {
            if (!this._data.content.winner) {
                nextGames += '<match-component></match-component>';
            }
        });

        nextGames += '</div>';

        this.shadow.innerHTML = `
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
            <link rel="stylesheet" href="./css/styles.css">

            <h3>Now Playing</h3>
            <p>TBD</p>
            <hr>

            <div id="upcoming-games">
            ${nextGames}
            </div>
        `;
    }
}

customElements.define('game-table-component', GameTable);