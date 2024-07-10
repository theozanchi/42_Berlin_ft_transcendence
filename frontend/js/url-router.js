const	baseUrl = document.location.href;

document.addEventListener("click", (e) => {
	const {target} = e;
	// console.log(e);
	if(!target.matches("nav a", "nav button")) {
		return;
	}
	
	e.preventDefault();
	urlRoute();
})

const urlRoutes = {
	404: {
		template: "/404.html",
		title: "Not found",
		description: "",
	},
	"/": {
		template: "/home.html",
		title: "Pongerpuff Girl",
		description: "",
	},
	"/setup-local": {
		template: "/setup-local.html",
		title: "Setup",
		description: "",
	},
	"/setup-remote": {
		template: "/remote.html",
		title: "Lobby",
		description: "",
	},
	"/host-remote": {
		template: "/lobby.html",
		title: "Setup",
		description: "",
	},
	"/join-remote": {
		template: "/lobby.html",
		title: "Setup",
		description: "",
	},

	"/game": {
		template: "/game.html",
		title: "Signup",
		description: "",
	},
	"/game-table": {
		template: "/game_table.html",
		title: "Game Table",
		description: "",
	},

	"/login": {
		template: "/login.html",
		title: "Login",
		description: "",
	},
	"/signup": {
		template: "/signup.html",
		title: "Signup",
		description: "",
	},
	"/profile": {
		template: "/profile.html",
		title: "Profile",
		description: "",
	},

	"/layout": {
		template: "/layout.html",
		title: "Layout Tes",
		description: "",
	},
}

const urlRoute = (eventOrUrl) => {
    let url;
	// console.log(eventOrUrl);
	// console.log(typeof eventOrUrl);
    if (typeof eventOrUrl === 'string') {
        url = eventOrUrl;
    } else {
        eventOrUrl = window.event || eventOrUrl;
        eventOrUrl.preventDefault();
        url = eventOrUrl.target.href;
    }
	// console.log(url);
    window.history.pushState({}, "", url);
    urlLocationHandler();
}

const urlLocationHandler = async () => {
    let location = window.location.pathname;
    if (location.length == 0) {
        location = "/"
    }
	// console.log(`MY LOCATION: ${location}`);

    // console.log(`MY LOCATION`);

    const route = urlRoutes[location] || urlRoutes[404]

    // console.log(`MY ROUTE: ${route.template}`);

    let imageUrl = new URL(route, baseUrl);
    // console.log(imageUrl);

    const html = await fetch(route.template).then((response) => 
		response.text());

	//PARSE ACTUAL PATH AND 
    let parser = new DOMParser();
    let doc = parser.parseFromString(html, "text/html");
    let title = doc.querySelector('title').innerText;

	let fetchedSettingsColumnContent 
	
	if (location === '/game') {
		// console.log("TRYING TO LAUNCH A GAME");
		fetchedSettingsColumnContent = doc.getElementById('game-column').innerHTML;
		//OVERWRITE COLUMN
		document.getElementById("game-column").innerHTML = fetchedSettingsColumnContent;	
	}
	else {
		fetchedSettingsColumnContent = doc.getElementById('settings-column').innerHTML;
		//OVERWRITE COLUMN
		document.getElementById("settings-column").innerHTML = fetchedSettingsColumnContent;	

	}

	
	//WRITE NEW TITLE TO BROWSER TAB
    document.title = title;



	//OVERWRITE CONTENT
    // document.getElementById("content").innerHTML = html;

	
};

window.onpopstate = urlLocationHandler;
window.route = urlRoute;

urlLocationHandler();


// document.getElementById('backButton2').addEventListener('click', goBack);

// function goBack() {
// 	window.history.back();
// }