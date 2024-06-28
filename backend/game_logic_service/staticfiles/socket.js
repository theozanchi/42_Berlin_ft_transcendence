
let socket;
let reconnectAttempts = 0;
let maxReconnectAttempts = 10;
let resetBall_ = false;
const initialReconnectInterval = 1000; // Initial reconnect interval in ms
let reconnectInterval = initialReconnectInterval;

export function initializeWebSocket(url){
    
	///setup web socket ///
			function connect() {
				
				socket = new WebSocket(url);
				socket.onopen = function(event) {
					console.log('WebSocket connection established.');
					reconnectAttempts = 0;
					reconnectInterval = initialReconnectInterval; // Reset reconnection attempts on successful connection
				};    
		
				socket.onmessage = function(event) {
					let data = JSON.parse(event.data);
					// Handle game state updates
					if (data.type === 'player_identity') {
						let playerId = data.player_id;
						currentPlayer = (playerId === 'player1') ? player : player2;
					} else if (data.type === 'game_state') {
						updateGameState(data);
					}
				};    
		
				socket.onclose = function(event) {
					console.log('WebSocket connection closed.', event);
					if (reconnectAttempts < maxReconnectAttempts) {
						setTimeout(connect, reconnectInterval);
						reconnectInterval = Math.min(reconnectInterval * 2, 16000); // Exponential backoff with a cap
						reconnectAttempts++;
					} else {
						console.error('Max reconnect attempts reached. Could not reconnect.');
					}
				};    
		
				socket.onerror = function(error) {
					console.error('WebSocket error:', error);
					if (socket.readyState !== WebSocket.OPEN && reconnectAttempts < maxReconnectAttempts) {
						setTimeout(connect, reconnectInterval);
						reconnectAttempts++;
						}
					};
				 
			}    
		
			connect();
		
			// Keep-Alive Mechanism
			function sendKeepAlive() {
				if (socket.readyState === WebSocket.OPEN) {
					socket.send(JSON.stringify({ type: 'keep_alive' }));
				}    
			}    
		
			setInterval(sendKeepAlive, 30000); // Send a keep-alive message every 30 seconds
		
			return socket;
			}
	
			export function updateGameState(data) {
				if (data.type === 'game_state') {
					// Update player positions
					//console.log("received data", data.player1.x, data.player1.y, data.player1.z)
					if (data.player1) {
						// Update player1 position
						player.position.set(data.player1.x, data.player1.y, data.player1.z);
						player.rotation.set(data.player1.rotation.x, data.player1.rotation.y, data.player1.rotation.z);
					}
					if (data.player2) {
						// Update player2 position
						player2.position.set(data.player2.x, data.player2.y, data.player2.z);
						player2.rotation.set(data.player2.rotation.x, data.player2.rotation.y, data.player2.rotation.z);
					}
					// Update ball position and speed
					ball.position.set(data.ball.x, data.ball.y, data.ball.z);
					ballSpeed.set(data.ballSpeed.x, data.ballSpeed.y, data.ballSpeed.z);
					// Update game state variables
					playerTurn = data.playerTurn;
					playerScore = data.playerScore;
					aiScore = data.aiScore;
					ballIsHeld = data.ballIsHeld;
					currentFace = data.current_face;
					currentFace2 = data.current_face2;
					aimingAngle = data.aiming_angle;
					resetBall_ = data.reset_ball;
					console.log("reset ball", resetBall_);
	
	
					updateScore();
				}    
			}    
	
			// Ensure WebSocket is open before sending data
			export function sendGameState() {
				if (socket.readyState === WebSocket.OPEN) {
					const newGameState = {
						type: 'game_state',
						playerTurn: playerTurn,
						playerScore: playerScore,
						aiScore: aiScore,
						ballIsHeld: ballIsHeld,
						current_face: currentFace,
						current_face2: currentFace2,
						aiming_angle: aimingAngle,
						reset_ball: resetBall_
					};
			
					if (currentPlayer === player) {
						newGameState.player1 = {
							x: player.position.x,
							y: player.position.y,
							z: player.position.z,
							rotation: {
								x: player.rotation.x,
								y: player.rotation.y,
								z: player.rotation.z
							}
						};
					} else {
						newGameState.player2 = {
							x: player2.position.x,
							y: player2.position.y,
							z: player2.position.z,
							rotation: {
								x: player2.rotation.x,
								y: player2.rotation.y,
								z: player2.rotation.z
							}
						};
					}
			
					socket.send(JSON.stringify(newGameState));
	
				} else {
					console.error('WebSocket is not open. Ready state:', socket.readyState);
				}    
			}  
	
		///////////    
		
	