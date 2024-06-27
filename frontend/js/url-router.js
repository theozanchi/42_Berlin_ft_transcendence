const	baseUrl = document.location.href;

document.addEventListener("click", (e) => {
	const {target} = e;
	// console.log(e);
	if(!target.matches("nav a")) {
		return;
	}

	e.preventDefault();
	urlRoute();
})

const urlRoutes = {
	404: {
		template: "/frontned/login.html",
		title: "Not found",
		description: "",
	},
	"/": {
		template: "/frontend/router.html",
		title: "Pongerpuff Girl",
		description: "",
	},
	"/login": {
		template: "/frontend/login.html",
		title: "Login",
		description: "",
	}
}

const urlRoute = (event) => {
	event = event || window.event;
	event.preventDefault();
	window.history.pushState({}, "", event.target.href);
	// console.log(event.target.href);
	urlLocationHandler();
}

const urlLocationHandler = async () => {
	const location = window.location.pathname;
	if (location.lenth == 0) {
		location = "/"
	}
	console.log(`MY LOCATION: ${location}`);
	console.log(`BASE LOCATION: ${baseUrl}`)

	const route = urlRoutes[location] || urlRoutes[404]

	console.log(`MY ROUTE: ${route.template}`);
	let		imageUrl = new URL(route.template, baseUrl);
	console.log(`MY NEW ROUTE: ${imageUrl}`)

	console.log(imageUrl);

	const html = await fetch(route.template).then((response) =>
	response.text());

	
	document.getElementById("content").innerHTML = html;
	
};