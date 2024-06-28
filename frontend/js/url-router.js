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
		template: "/index.html",
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
		title: "Setup",
		description: "",
	},
	"/lobby": {
		template: "/lobby.html",
		title: "Lobby",
		description: "",
	},
	"/game": {
		template: "/setup-local.html",
		title: "game",
		description: "",
	},
	"/profile": {
		template: "/profile.html",
		title: "Profile",
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
}

const urlRoute = (event) => {
	event = event || window.event;
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

document.getElementById('backButton').addEventListener('click', goBack);


function goBack() {
    window.history.back();
}