const	baseUrl = document.location.href;
import {getLoggedInState} from './login_signup.js';
import {loadUserList} from './all-users.js';
import {loadProfileData, updateProfileData} from './profile.js'
import { newsocket } from './stepper.js';
import { resetGame } from "./game.js"

document.addEventListener("click", (e) => {
	const {target} = e;
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
	"/users": {
		template: "/all-users.html",
		title: "Users",
		description: "",
	},
	"/game-history": {
		template: "/profile-history.html",
		title: "Users",
		description: "",
	},
	"/oresult": {
		template: "/oresult.html",
		title: "Result",
		description: "",
	}
}

export const urlRoute = (eventOrUrl) => {
	let url;
	let location = window.location.pathname;
	if (typeof eventOrUrl === 'string') {
		url = eventOrUrl;
	} else {
		eventOrUrl = window.event || eventOrUrl;
		eventOrUrl.preventDefault();
		url = eventOrUrl.target.href;
	}
	console.log(`pushing this: ${url}`)
	window.history.pushState({}, "", url);
	urlLocationHandler();
}

async function redirectOnLogin(locationOld){
	let location = locationOld;
	let urlQuery = new URLSearchParams(window.location.search);

// Route based on login state
	const userStatus = await getLoggedInState();
	const userId = userStatus.user_id;

	if (userStatus.status === "success"){
		if (location === "/login" || location === "/signup" || (location === "/profile" && !urlQuery.has('user'))) {
			const newUrl = `/profile?user=${userId}`;
			window.history.replaceState({}, "", newUrl);
			location = '/profile'; 
		} else if (location === '/game' && !newsocket) {
			location = '/';
			inGame = false;
			window.history.replaceState({}, "", location);
		}

	}
	else if (userStatus.status !== "success") {
		if (location === "/profile" && !urlQuery.has('user')) {
			location = "/login";
			window.history.replaceState({}, "", location);
		} else if (location === "/setup-remote" || location === "/join-remote" || location === "/edit-profile" || location === "/game-history") {
			location = "/login";
			window.history.replaceState({}, "", location);
		}
		else if (location === '/game' && !newsocket) {
			location = "/";
			inGame = false;
			window.history.replaceState({}, "", location);
		}

	}

	return (location);
}

var inGame = false;

const urlLocationHandler = async () => {

	if (inGame) {
		let userConfirmation = confirm('All game data will be lost, when you leave this page. Continue?');
		if (userConfirmation){
			// if (newsocket && newsocket.readyState === WebSocket.OPEN)
			// 	newsocket.close();
			resetGame();
			inGame = false;
		} else {
			inGame = false;
			window.history.forward();
		}
	}

	let location = window.location.pathname;
	console.log(`I AM HERE ${location}`)
	// CLOSING SOCKET WHEN ROUTING

	if (["/game", "/host-remote", "/join-remote"].includes(location))
		inGame = true;

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
	// let fetchedGameColumnContent = doc.getElementById('game-column').innerHTML;
	// if (fetchedGameColumnContent)
	// 	document.getElementById("game-column").innerHTML = fetchedGameColumnContent;

	let fetchedSettingsColumnContent = doc.getElementById('settings-column').innerHTML;
	if (fetchedSettingsColumnContent)
		document.getElementById("settings-column").innerHTML = fetchedSettingsColumnContent;

	if (location === '/profile')
		loadProfileData();
	if (location === '/edit-profile')
		updateProfileData();
	if (location === '/users')
		loadUserList();
};

export function handleGameExit(event) {
	let location = window.location.pathname;
	if (["/game", "/host-remote", "/join-remote"].includes(location)) {
		if (newsocket && newsocket.readyState === WebSocket.OPEN) {
			const confirmationMessage = 'All game data will be lost if you reload this page. Continue?';
			event.returnValue = confirmationMessage;
		}
	}
}

window.onbeforeunload = function(event) {
	return handleGameExit(event)
};

window.onpopstate = function(event) {
	// handleGameExit(event);
	urlLocationHandler();
};

window.route = urlRoute;

urlLocationHandler();
