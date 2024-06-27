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
		template: "/frontend/404.html",
		title: "Not found",
		description: "",
	},
	"/": {
		template: "/frontend/index.html",
		title: "Pongerpuff Girl",
		description: "",
	},
	"/setup-local": {
		template: "/frontend/setup-local.html",
		title: "Setup",
		description: "",
	},
	"/setup-remote": {
		template: "/frontend/setup-remote.html",
		title: "Setup",
		description: "",
	},
	"/lobby": {
		template: "/frontend/lobby.html",
		title: "Lobby",
		description: "",
	},
	"/game": {
		template: "/frontend/setup-local.html",
		title: "game",
		description: "",
	},
	"/profile": {
		template: "/frontend/profile.html",
		title: "Profile",
		description: "",
	},
	"/login": {
		template: "/frontend/login.html",
		title: "Login",
		description: "",
	},
	"/signup": {
		template: "/frontend/signup.html",
		title: "Signup",
		description: "",
	},
}

const urlRoute = (event) => {
	event = event || window.event;
	event.preventDefault();
	window.history.pushState({}, "", event.target.href);
	// console.log(event.target.href);
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

    const html = await fetch(route.template).then((response) => response.text());

    let parser = new DOMParser();
    let doc = parser.parseFromString(html, "text/html");
    let title = doc.querySelector('title').innerText;

    document.title = title;
    document.getElementById("content").innerHTML = html;
};

document.getElementById('backButton').addEventListener('click', goBack);


function goBack() {
    window.history.back();
}