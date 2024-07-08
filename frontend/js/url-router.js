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

	"/fill": {
		template: "/fill.html",
		title: "Layout Tes",
		description: "",
	},
}

const urlRoute = (event) => {
	event = window.event || event;
	console.log("HELLO");
	event.preventDefault();
	window.history.pushState({}, "", event.target.href);
	console.log(event.target.href);
	urlLocationHandler();
}

const urlLocationHandler = async () => {
    let location = window.location.pathname;
    if (location.length == 0) {
        location = "/"
    }
    console.log(`MY LOCATION: ${location}`);

    const route = urlRoutes[location] || urlRoutes[404]

    console.log(`MY ROUTE: ${route.template}`);

    let imageUrl = new URL(route, baseUrl);
    console.log(imageUrl);

    const html = await fetch(route.template).then((response) => 
		response.text());


	//PARSE ACTUAL PATH AND 
    let parser = new DOMParser();
    let doc = parser.parseFromString(html, "text/html");
    let title = doc.querySelector('title').innerText;

	//WRITE NEW TITLE TO BROWSER TAB
    document.title = title;
    document.getElementById("content").innerHTML = html;
};

window.onpopstate = urlLocationHandler;
window.route = urlRoute;

urlLocationHandler();


// document.getElementById('backButton2').addEventListener('click', goBack);

// function goBack() {
// 	window.history.back();
// }