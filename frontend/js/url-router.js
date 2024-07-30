const	baseUrl = document.location.href;
import {getLoggedInState} from './login_signup.js';
import {loadUserList} from './all-users.js';
import {loadProfileData, updateProfileData} from './profile.js'
import { newsocket, getCurrentUser, openSocket, sendJson } from './stepper.js';
import { resetGame, gifBackground, winnerText } from "./game.js"

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
		title: "Setup Local",
		description: "",
	},
	"/setup-remote": {
		template: "/setup-remote.html",
		title: "Setup Remote Game",
		description: "",
	},
	"/host-remote": {
		template: "/setup-lobby.html",
		title: "Lobby",
		description: "",
	},
	"/join-remote": {
		template: "/setup-lobby.html",
		title: "Lobby",
		description: "",
	},

	"/game": {
		template: "/game.html",
		title: "Game",
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
		const storedUrl = localStorage.getItem('redirectAfterLogin');
		if (storedUrl) {
			location = storedUrl;
			localStorage.removeItem('redirectAfterLogin');
			urlRoute(location);
		} else {
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

	}
	else if (userStatus.status !== "success") {
		const fullUrl = window.location.pathname + window.location.search;
		localStorage.setItem('redirectAfterLogin', fullUrl);

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
	let location = window.location.pathname;
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);

	if (gifBackground && winnerText) {
		gifBackground.remove();
		winnerText.remove();
	}
	if (inGame && location !== '/game' && (newsocket && newsocket.readyState === WebSocket.OPEN)) {
		let userConfirmation = confirm('All game data will be lost, when you leave this page. Continue?');
		if (userConfirmation){
			if (newsocket && newsocket.readyState === WebSocket.OPEN)
				resetGame();
				newsocket.close();
			inGame = false;
		} else {
			inGame = false;
			window.history.forward();
		}
	}

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
	if (location === '/join-remote' && !newsocket && urlParams.has('id')) {
		const gameId = urlParams.get('id');
		const userId = await getCurrentUser();
		let data = {type: 'join-game', 'game_id': gameId, 'mode': 'remote', 'user_id': userId};
		openSocket() .then(() => {
			sendJson(JSON.stringify(data));
		})
	}
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
	handleGameExit(event);
	urlLocationHandler();
};

window.route = urlRoute;

urlLocationHandler();
