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
		template: "/setup-remote.html",
		title: "Lobby",
		description: "",
	},
	"/host-remote": {
		template: "/setup-lobby.html",
		title: "Setup",
		description: "",
	},
	"/join-remote": {
		template: "/setup-lobby.html",
		title: "Setup",
		description: "",
	},

	"/game": {
		template: "/game.html",
		title: "Signup",
		description: "",
	},
	"/game-table": {
		template: "/game-table.html",
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
	"/edit-profile": {
		template: "/profile-edit.html",
		title: "Profile",
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
	let urlQuery = '';

    // Fetch user status
	const userStatus = await fetch('/api/user_mgt/me')
		.then(response => response.json())
		.catch(() => ({ status: "error" }));

    if (userStatus.status === "success") {
        // User is logged in
        if (location === "/login" || location === "/signup") {
            location = "/";
        } else if (location === "/profile") {
            // location = `/profile?user=${userStatus.user_id}`;
            location = `/profile`;
			userId = `?user=${userStatus.user_id}`;
        }
    } else {
        // User is not logged in
        if (location === "/profile") {
            location = "/";
        } else if (location === "/setup-remote") {
            location = "/login";
        } else if (location === "/join-remote") {
            location = "/setup-remote";
        }
    }

	let route = urlRoutes[location] || urlRoutes[404]
	// route += urlQuery;
	// console.log(route);

	const html = await fetch(route.template).then((response) => 
		response.text());

	//PARSE ACTUAL PATH AND 
	let parser = new DOMParser();
	let doc = parser.parseFromString(html, "text/html");
	let title = doc.querySelector('title').innerText;

	//WRITE NEW TITLE TO BROWSER TAB
	document.title = title;	

	let fetchedGameColumnContent = doc.getElementById('game-column').innerHTML;
	if (fetchedGameColumnContent)
		document.getElementById("game-column").innerHTML = fetchedGameColumnContent;	

	let fetchedSettingsColumnContent = doc.getElementById('settings-column').innerHTML;
	if (fetchedSettingsColumnContent)
		document.getElementById("settings-column").innerHTML = fetchedSettingsColumnContent;	

	// if (location === "/join-remote" || location === "host-remote")
	// 	console.log("FUCK");
		// setGameID();	
	// For profile pages and logged in user, load the corresponding profile page
	if (location === "/profile" && userStatus.user_id) {
		const url = new URL(window.location.href);
		url.searchParams.set('user', userStatus.user_id);
		window.history.pushState({}, "", url.toString());
	}
};

window.onpopstate = urlLocationHandler;
window.route = urlRoute;

urlLocationHandler();


// document.getElementById('backButton2').addEventListener('click', goBack);

// function goBack() {
// 	window.history.back();
// }