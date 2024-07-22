const	baseUrl = document.location.href;
import {getLoggedInState} from './login_signup.js';
import {loadProfileData} from './profile.js'
import {updateProfileData} from './profile.js'

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

export const urlRoute = (eventOrUrl) => {
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

async function redirectOnLogin(locationOld){
	let location = locationOld;
	let urlQuery = new URLSearchParams(window.location.search);
	let userId;
// Route based on login state
	const userStatus = await getLoggedInState();
	if (userStatus.status === "success") {
		// User is logged in
		if (location === "/login" || location === "/signup") {
			location = "/";
		} else if (location === "/profile" && !urlQuery.has('user')) {
			// Redirect logged-in user to their own profile
			userId = userStatus.user_id;
			const newUrl = `/profile?user=${userId}`;
			window.history.replaceState({}, "", newUrl);
			location = '/profile'; // Update location to reflect the new URL
		}
	} else {
		// User is not logged in
		if (location === "/profile" && !urlQuery.has('user')) {
			// Redirect guest trying to access /profile to homepage
			window.history.pushState({}, "", "/");
			location = "/";
		} else if (location === "/setup-remote" || location === "/join-remote" || location === "/edit-profile") {
			// Additional logic for other routes if needed
			window.history.pushState({}, "", "/login");
			location = "/login";
		}
	}
	return (location);
}

const urlLocationHandler = async () => {
	let location = window.location.pathname;

	if (location.length === 0) 
		location = "/";
	else
		location = await redirectOnLogin(location);

	// Fetch and display the content based on the updated location
	let route = urlRoutes[location] || urlRoutes[404];
	const html = await fetch(route.template).then(response => response.text());

	// Parse and update the page content as before
	let parser = new DOMParser();
	let doc = parser.parseFromString(html, "text/html");

	document.title = doc.querySelector('title').innerText; // Update title

	// Update game and settings column content as before
	let fetchedGameColumnContent = doc.getElementById('game-column').innerHTML;
	if (fetchedGameColumnContent)
		document.getElementById("game-column").innerHTML = fetchedGameColumnContent;

	let fetchedSettingsColumnContent = doc.getElementById('settings-column').innerHTML;
	if (fetchedSettingsColumnContent)
		document.getElementById("settings-column").innerHTML = fetchedSettingsColumnContent;

	if (location === '/profile')
		loadProfileData();
	if (location === '/edit-profile')
		updateProfileData();
};

window.onpopstate = urlLocationHandler;
window.route = urlRoute;

urlLocationHandler();


// document.getElementById('backButton2').addEventListener('click', goBack);

// function goBack() {
// 	window.history.back();
// }