const route = (event) => {
	event = event || window.event;
	event.preventDefault();
	window.history.pushState({}, "", event.target.href())
}

const routes = {
	"/": "/index.html",
	"/about": "/index.html",
	"/lorem": "/index.html"
}

const handleLocation = async () => {
	const path = window.location.pathname;

}

window.route = route;