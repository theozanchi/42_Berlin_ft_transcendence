document.addEventListener("click", (e) => {
	const {target} = e;
	console.log(e);
	if(!target.matches("nav a")) {
		return;
	}

	e.preventDefault();
	urlRoute()
})

const urlRoutes = {
	404: {
		template: "./login.html",
		title: "Not found",
		description: ""
	},
	"/": {
		template: "./index.html",
		title: "Pongerpuff Girl",
		description: ""
	},
	"/login": {
		template: "./login.html",
		title: "Login",
		description: ""
	}
}

const urlRoute = (event) => {
	event = event || window.event;
	event.preventDefault();
	window.history.pushState({}, "", event.target.href); //tell browser which state
	urlLocationHandler();
}

const urlLocationHandler = async () => {
	const location = window.location.pathname;
	if (location.lenth == 0) {
		location = "/"
	}

	const route = urlRoutes[location] | urlRoutes[404]
	const html = await fetch(route.template).then((response) =>
	response.text());

	console.log(html);
	document.getElementById("content").innerHTML = html;
	
};