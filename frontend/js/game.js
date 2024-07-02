

import * as THREE from 'https://cdn.skypack.dev/three@0.134.0';
import TWEEN from 'https://cdn.skypack.dev/@tweenjs/tween.js@18.6.4';

//////////////--------INDEX--------///////////////

//---WEBSOCKET---//
let index1;

//---INIT_DATA---//
let index2;

//---EVENT_LISTENERS---//
let index3;

//---SWITCH_FACES_LOGIC_PLAYER_1---//
let index4;

//---SWITCH_FACES_LOGIC_PLAYER_2---//
let index5;

//---COLLISION_MARKER_AIMING_LINE_SCORE---//
let index6;

//---BLINKING---//
let index7;

//---MOVE_PLAYER_LOGIC---//
let index8;

//---MAIN_LOOP---//
let index9;



const canvas = document.getElementById('bg');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


let ballUpdateEnabled = true;
const faceMaterials = {};
let scene, camera, camera2, renderer, cube, player, player2, aiPlayer, ball, collisionMarker, aimingLine;
let ballSpeed = new THREE.Vector3();

let keyMoveSpeed = 0.05;
const ballRadius = 0.05; // Radius of the ball
const playerSize = { x: 0.35, y: 0.35, z: 0.05 }; // Size of the player
const cubeSize = 2; // Size of the cube
let playerTurn = true; // Player starts
let playerScore = 0;
let aiScore = 0;
let currentFace = 0; // 0 - front, 1 - back, 2 - left, 3 - right, 4 - top, 5 - bottom
let currentFace2 = 1;
let pivot;
let pivot2;
let isTransitioning = false;
let isTransitioning2 = false;
let ballIsHeld = true;
let aimingAngle = 0;
let remote = false; // Set to false for two-player game
const initialReconnectInterval = 1000; // Initial reconnect interval in ms
let reconnectInterval = initialReconnectInterval;
let currentPlayer;
let reconnectAttempts = 0;
let maxReconnectAttempts = 10;
let resetBall_ = false;


            //////////////--------WEBSOCKET---------///////////////

export function initializeWebSocket(url){
    
    index1;
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
                } else if (data.type === 'game-update') {
                    updateGameState(data);
                }
                console.log(data);
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
            if (data.type === 'game-update') {
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
                    type: 'game-state',
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


    //////////////--------INIT_DATA---------///////////////  
    
index2;

async function init() {

    // TESTING //
    // FIRST WAIT FOR THE WEBSOCKET CONNECTION TO BE ESTABLISHED
    const url = `wss://${window.location.host}/ws/`;
    console.log('Connecting to WebSocket server...');
    initializeWebSocket(url)
    await new Promise((resolve, reject) => {
        if (!socket) {
            reject('WebSocket is not initialized.');
        } else {
            const checkInterval = setInterval(() => {
                if (socket.readyState === WebSocket.OPEN) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 1000);
        }
    });

    // Create the scene
    scene = new THREE.Scene();
    
    // Set up the camera
    camera = new THREE.PerspectiveCamera(75, (window.innerWidth / 2) / window.innerHeight, 0.1, 1000);
    camera2 = new THREE.PerspectiveCamera(75, (window.innerWidth / 2) / window.innerHeight, 0.1, 1000);
    
    // Set up the renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    // Create the background plane
    const bgTexture = new THREE.TextureLoader().load('../assets/background.gif');
    const bgMaterial = new THREE.MeshBasicMaterial({ map: bgTexture });
    const bgGeometry = new THREE.PlaneGeometry(2, 2, 0);
    const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);

    // Position the background mesh
    bgMesh.material.depthTest = false;
    bgMesh.material.depthWrite = false;
    const bgScene = new THREE.Scene();
    const bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    bgScene.add(bgMesh);

    // Create the cube
    let geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    let material = new THREE.MeshBasicMaterial({ visible: false });
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    const colors = {
        front: '#ff0000',   // Red
        back: '#ffa500',    // Orange
        left: '#ffff00',    // Yellow
        right: '#ffc0cb',   // Pink
        top: '#800080',     // Purple
        bottom: '#a52a2a'   // Brown
    };

    const faceSize = 1.7;
    const transparentMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide });

    const frontFace = createFace(transparentMaterial, faceSize, colors.front, { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: 0 });
    const backFace = createFace(transparentMaterial, faceSize, colors.back, { x: 0, y: 0, z: -1 }, { x: 0, y: Math.PI, z: 0 });
    const leftFace = createFace(transparentMaterial, faceSize, colors.left, { x: -1, y: 0, z: 0 }, { x: 0, y: Math.PI / 2, z: 0 });
    const rightFace = createFace(transparentMaterial, faceSize, colors.right, { x: 1, y: 0, z: 0 }, { x: 0, y: -Math.PI / 2, z: 0 });
    const topFace = createFace(transparentMaterial, faceSize, colors.top, { x: 0, y: 1, z: 0 }, { x: -Math.PI / 2, y: 0, z: 0 });
    const bottomFace = createFace(transparentMaterial, faceSize, colors.bottom, { x: 0, y: -1, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 });
    
    faceMaterials.front = frontFace.face;
    faceMaterials.back = backFace.face;
    faceMaterials.left = leftFace.face;
    faceMaterials.right = rightFace.face;
    faceMaterials.top = topFace.face;
    faceMaterials.bottom = bottomFace.face;
    // Create a pivot point at the cube's center
    pivot = new THREE.Object3D();
    cube.add(pivot);
    pivot.add(camera);
    camera.position.set(0, 0, cubeSize * 1.5);
    
    // Create a pivot point at the cube's center
    pivot2 = new THREE.Object3D();
    cube.add(pivot2);
    pivot2.add(camera2);
    camera2.position.set(0, 0, cubeSize * 1.5);
    camera2.position.copy(camera.position.clone().multiplyScalar(-1));
    camera2.lookAt(0, 0, 0);

    // Create player
    let playerGeometry = new THREE.BoxGeometry(playerSize.x, playerSize.y, playerSize.z);
    let playerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.material.transparent = true;
    setPlayerTransparency(0.25);
    player.position.set(0, 0, cubeSize / 2 + playerSize.z / 6); // Initial position on the front face
    player.rotation.set(0, 0, 0);
    scene.add(player); // Add player to the scene, not the cube
    
    // Create palyer2
    let player2Geometry = new THREE.BoxGeometry(playerSize.x, playerSize.y, playerSize.z);
    let player2Material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    player2 = new THREE.Mesh(player2Geometry, player2Material);
    player2.material.transparent = true;
    player2.material.opacity = 0.25;
    player2.position.set(0, 0, -(cubeSize / 2 + playerSize.z / 6));
    player2.rotation.set(0, Math.PI, 0); // Initial position on the front face
    scene.add(player2); // Add player to the scene, not the cube
    
    // Create ball
    let ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
    let ballMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    ball = new THREE.Mesh(ballGeometry, ballMaterial);
    cube.add(ball);
    
    // Create aiming line
    const aimingLineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 ,transparent: true, opacity: 0});
    const aimingLineGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    aimingLine = new THREE.Line(aimingLineGeometry, aimingLineMaterial);
    scene.add(aimingLine);
    
    // Create collision marker
    const collisionMarkerGeometry = new THREE.SphereGeometry(0.05, 16, 16); // Smaller marker
    const collisionMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });
    collisionMarker = new THREE.Mesh(collisionMarkerGeometry, collisionMarkerMaterial);
    scene.add(collisionMarker);

    // Add score display
    let scoreDisplay = document.createElement('div');
    scoreDisplay.id = 'scoreDisplay';
    scoreDisplay.style.position = 'absolute';
    scoreDisplay.style.top = '10px';
    scoreDisplay.style.left = '10px';
    scoreDisplay.style.color = 'white';
    scoreDisplay.style.fontSize = '20px';
    document.body.appendChild(scoreDisplay);
    

            //--------EVENT_LISTENERS---------//


    // Add event listeners for movement and face change
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    // Request pointer lock when the canvas is clicked
    renderer.domElement.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement === renderer.domElement) {
            // Pointer is locked, add event listener for mouse movement
            document.addEventListener('mousemove', onMouseMove);
        } else {
            // Pointer is unlocked, remove event listener for mouse movement
            document.removeEventListener('mousemove', onMouseMove);
        }
    });
    
    
    updateScore();
    
    animate();
    }
    
    //////////////////////--------EVENT_LISTENERS---------//////////////////////

index3;

function moveLoop() {
    let deltaX = 0;
    let deltaY = 0;
    if(remote){
        if(currentPlayer === player){
            if (keysPressed.ArrowUp) {
            deltaY += keyMoveSpeed;
            }
            if (keysPressed.ArrowDown) {
            deltaY -= keyMoveSpeed;
            }
            if (keysPressed.ArrowLeft) {
            deltaX -= keyMoveSpeed;
            }
            if (keysPressed.ArrowRight) {
            deltaX += keyMoveSpeed;
            }
        
            movePlayer(player, deltaX, deltaY);
            sendGameState();
        }
        else{
            if (keysPressed.ArrowUp) {
            deltaY += keyMoveSpeed;
            }
            if (keysPressed.ArrowDown) {
            deltaY -= keyMoveSpeed;
            }
            if (keysPressed.ArrowLeft) {
            deltaX -= keyMoveSpeed;
            }
            if (keysPressed.ArrowRight) {
            deltaX += keyMoveSpeed;
            }
        
            movePlayer2(player2, deltaX, deltaY);
            sendGameState();
        }
    } else {
        if (keysPressed.i) {
        deltaY += keyMoveSpeed;
        }
        if (keysPressed.k) {
        deltaY -= keyMoveSpeed;
        }
        if (keysPressed.j) {
        deltaX -= keyMoveSpeed;
        }
        if (keysPressed.l) {
        deltaX += keyMoveSpeed;
        }
    
        movePlayer(player, deltaX, deltaY);
        sendGameState();

        
        deltaX = 0;
        deltaY = 0;
    
        if (keysPressed['8']) {
        deltaY += keyMoveSpeed;
        }
        if (keysPressed['5']) {
        deltaY -= keyMoveSpeed;
        }
        if (keysPressed['4']) {
        deltaX -= keyMoveSpeed;
        }
        if (keysPressed['6']) {
        deltaX += keyMoveSpeed;
        }
    
        movePlayer2(player2, deltaX, deltaY);
        sendGameState();

}
}

function onMouseMove(event) {
    // Normalize mouse coordinates to range [-1, 1]
    if (document.pointerLockElement === renderer.domElement) {
        // Use movementX and movementY to get mouse movement since the last event
        const movementX = event.movementX || event.mozMovementX || 0;
        const movementY = event.movementY || event.mozMovementY || 0;
        
        // Adjust the sensitivity of movement
        const sensitivity = 0.01;
        
        // Update player position based on mouse movement
        let deltaX = movementX * sensitivity;
        let deltaY = -movementY * sensitivity; // Invert Y-axis as needed
    
        if (currentPlayer == player){
            movePlayer(player, deltaX, deltaY);
        }
        else {
            movePlayer2(player2, deltaX, deltaY);
        }
        sendGameState();
    }
}

function onKeyDown(event) {

    keysPressed[event.key] = true;
    //console.log(keysPressed[event.key]);
    if (remote){
        if (currentPlayer == player){
            switch (event.key) {
                case 'w':
                    switchFace('up');
                    break;
                case 's':
                    switchFace('down');
                    break;
                case 'a':
                    switchFace('left');
                    break;
                case 'd':
                    switchFace('right');
                    break;
                case ' ': // Space key
                    if (ballIsHeld) {
                        ballIsHeld = false; // Release the ball
                        resetBall_ = true; // Reset the ball to a random position
                        sendGameState();
                    }
                break;
            }
        }
        else {
            switch (event.key) {
                case 's':
                    switchFace2('up');
                    break;
                case 'w':
                    switchFace2('down');
                    break;
                case 'a':
                    switchFace2('left');
                    break;
                case 'd':
                    switchFace2('right');
                    break;
                case ' ': // Space key
                    if (ballIsHeld) {
                        ballIsHeld = false; // Release the ball
                        resetBall_ = true; // Reset the ball to a random position
                        sendGameState();
                    }
                break;
            }

        }
    }else {
        switch (event.key) {
            case 'w':
                switchFace('up');
                break;
            case 's':
                switchFace('down');
                break;
            case 'a':
                switchFace('left');
                break;
            case 'd':
                switchFace('right');
                break;
        // Player 2 face switching
        
            case 'ArrowDown':
                switchFace2('up');
                break;
            case 'ArrowUp':
                switchFace2('down');
                break;
            case 'ArrowLeft':
                switchFace2('left');
                break;
            case 'ArrowRight':
                switchFace2('right');
                break;
            case ' ': // Space key
                if (ballIsHeld) {
                    
                    ballIsHeld = false; // Release the ball
                    resetBall_ = true; // Reset the ball to a random position
                    sendGameState();
                }
            break;
        }
    }
}
function onKeyUp(event) {

keysPressed[event.key] = false;

}
let keysPressed = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    s: false,
    a: false,
    d: false,
    i: false,
    k: false,
    j: false,
    l: false,
    '8': false,
    '5': false,
    '4': false,
    '6': false
  };

    //////////////////////--------SWITCH_FACES_LOGIC_PLAYER_1--------//////////////////////

index4;

function switchFace(direction) {
    if (isTransitioning) return; // Check if a transition is in progress
    isTransitioning = true; 

    const angle = Math.PI / 2; // 90 degrees

    let axis = new THREE.Vector3();
    switch (direction) {
        case 'up':
            axis.set(-1, 0, 0);
            break;
        case 'down':
            axis.set(1, 0, 0);
            break;
        case 'left':
            axis.set(0, -1, 0);
            break;
        case 'right':
            axis.set(0, 1, 0);
            break;
    }


    const quaternion = new THREE.Quaternion().setFromAxisAngle(axis, angle);
    const initialRotation = pivot.quaternion.clone();
    const targetRotation = initialRotation.clone().multiply(quaternion);

    updateCurrentFaceWithTargetRotation(targetRotation);


    new TWEEN.Tween(pivot.quaternion)
        .to({ x: targetRotation.x, y: targetRotation.y, z: targetRotation.z, w: targetRotation.w }, 300)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onStart(() => {
            
            updatePlayerPositionForFace(currentFace);
            ballUpdateEnabled = true; // Disable ball updates during the transition
        })
        .onComplete(() => {
            isTransitioning = false;
            ballUpdateEnabled = true; // Re-enable ball updates after the transition
        })
        .start();
    sendGameState();
}


function updateCurrentFaceWithTargetRotation(targetRotation) {
    // Define the reference vector representing the front direction
    const referenceVector = new THREE.Vector3(0, 0, 1);

    // Apply the target rotation to the reference vector
    const rotatedVector = referenceVector.clone().applyQuaternion(targetRotation);

    // Define face vectors for comparison
    const faceVectors = [
        new THREE.Vector3(0, 0, 1), // Front face
        new THREE.Vector3(0, 0, -1), // Back face
        new THREE.Vector3(-1, 0, 0), // Left face
        new THREE.Vector3(1, 0, 0), // Right face
        new THREE.Vector3(0, 1, 0), // Top face
        new THREE.Vector3(0, -1, 0) // Bottom face
    ];

    // Determine the face that the rotated vector is closest to
    let maxDot = -Infinity;
    let newCurrentFace = 0;

    faceVectors.forEach((faceVector, index) => {
        const dot = rotatedVector.dot(faceVector);
        if (dot > maxDot) {
            maxDot = dot;
            newCurrentFace = index;
        }
    });

    currentFace = newCurrentFace;
    sendGameState();
}


function updatePlayerPositionForFace(face) {
    switch (face) {
        case 0: // Front
            player.position.set(0, 0, cubeSize / 2 + playerSize.z / 6);
            player.rotation.set(0, 0, 0);
            break;
        case 1: // Back
            player.position.set(0, 0, -(cubeSize / 2 + playerSize.z / 6));
            player.rotation.set(0, Math.PI, 0);
            break;
        case 2: // Left
            player.position.set(-(cubeSize / 2 + playerSize.z / 6), 0, 0);
            player.rotation.set(0, -Math.PI / 2, 0);
            break;
        case 3: // Right
            player.position.set(cubeSize / 2 + playerSize.z / 6, 0, 0);
            player.rotation.set(0, Math.PI / 2, 0);
            break;
        case 4: // Top
            player.position.set(0, cubeSize / 2 + playerSize.z / 6, 0);
            player.rotation.set(-Math.PI / 2, 0, 0);
            break;
        case 5: // Bottom
            player.position.set(0, -(cubeSize / 2 + playerSize.z / 6), 0);
            player.rotation.set(Math.PI / 2, 0, 0);
            break;
    }
    sendGameState();

}

function createFace(material, size, outlineColor, position, rotation) {
    const group = new THREE.Group();
    
    // Create the face
    const faceGeometry = new THREE.PlaneGeometry(size, size);
    const face = new THREE.Mesh(faceGeometry, material);
    face.position.set(position.x, position.y, position.z);
    face.rotation.set(rotation.x, rotation.y, rotation.z);
    group.add(face);
    
    // Create the circular outline (torus)
    const torusRadius = size / 8; // Adjust the torus radius as necessary
    const torusThickness = 0.01; // Thickness of the torus ring
    const torusGeometry = new THREE.TorusGeometry(torusRadius, torusThickness, 16, 100);
    const torusMaterial = new THREE.MeshBasicMaterial({ color: outlineColor, side: THREE.FrontSide });
    const torus = new THREE.Mesh(torusGeometry, torusMaterial);
    torus.position.set(position.x, position.y, position.z);
    torus.rotation.set(rotation.x, rotation.y, rotation.z);
    group.add(torus);
    
    // Add the group to the scene
    scene.add(group);
    
    return { group, face };
}    
    
    
    

// Adjust player's transparency
function setPlayerTransparency(value) {
    player.material.opacity = value;
}    



    //////////////////////--------SWITCH_FACES_LOGIC_PLAYER_2--------//////////////////////

index5;

function switchFace2(direction) {
    if (isTransitioning2) return; // Check if a transition is in progress
    isTransitioning2 = true; 

    const angle = Math.PI / 2; // 90 degrees

    let axis = new THREE.Vector3();
    switch (direction) {
        case 'up':
            axis.set(-1, 0, 0);
            break;
        case 'down':
            axis.set(1, 0, 0);
            break;
        case 'left':
            axis.set(0, -1, 0);
            break;
        case 'right':
            axis.set(0, 1, 0);
            break;
    }


    const quaternion = new THREE.Quaternion().setFromAxisAngle(axis, angle);
    const initialRotation = pivot2.quaternion.clone();
    const targetRotation = initialRotation.clone().multiply(quaternion);

    updateCurrentFaceWithTargetRotation2(targetRotation);

    new TWEEN.Tween(pivot2.quaternion)
        .to({ x: targetRotation.x, y: targetRotation.y, z: targetRotation.z, w: targetRotation.w }, 300)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onStart(() => {
            
            updatePlayerPositionForFace2(currentFace2)
            ballUpdateEnabled = true; // Disable ball updates during the transition
        })
        .onComplete(() => {
            isTransitioning2 = false;
            ballUpdateEnabled = true; // Re-enable ball updates after the transition
        })
        .start();
    sendGameState();
}

function updateCurrentFaceWithTargetRotation2(targetRotation) {
    // Define the reference vector representing the front direction
    const referenceVector = new THREE.Vector3(0, 0, -1);

    // Apply the target rotation to the reference vector
    const rotatedVector = referenceVector.clone().applyQuaternion(targetRotation);

    // Define face vectors for comparison
    const faceVectors = [
        new THREE.Vector3(0, 0, 1), // Front face
        new THREE.Vector3(0, 0, -1), // Back face
        new THREE.Vector3(-1, 0, 0), // Left face
        new THREE.Vector3(1, 0, 0), // Right face
        new THREE.Vector3(0, 1, 0), // Top face
        new THREE.Vector3(0, -1, 0) // Bottom face
    ];

    // Determine the face that the rotated vector is closest to
    let maxDot = -Infinity;
    let newCurrentFace = 0;

    faceVectors.forEach((faceVector, index) => {
        const dot = rotatedVector.dot(faceVector);
        if (dot > maxDot) {
            maxDot = dot;
            newCurrentFace = index;
        }
    });

    currentFace2 = newCurrentFace;
    //console.log(`Updated current face: ${currentFace2}`);
}


function updatePlayerPositionForFace2(face) {
    //console.log(`Updating player position for face: ${face}`);
    switch (face) {
        case 0: // Front
            player2.position.set(0, 0, cubeSize / 2 + playerSize.z / 6);
            player2.rotation.set(0, 0, 0);
            break;
        case 1: // Back
            player2.position.set(0, 0, -(cubeSize / 2 + playerSize.z / 6));
            player2.rotation.set(0, Math.PI, 0);
            break;
        case 2: // Left
            player2.position.set(-(cubeSize / 2 + playerSize.z / 6), 0, 0);
            player2.rotation.set(0, -Math.PI / 2, 0);
            break;
        case 3: // Right
            player2.position.set(cubeSize / 2 + playerSize.z / 6, 0, 0);
            player2.rotation.set(0, Math.PI / 2, 0);
            break;
        case 4: // Top
            player2.position.set(0, cubeSize / 2 + playerSize.z / 6, 0);
            player2.rotation.set(-Math.PI / 2, 0, 0);
            break;
        case 5: // Bottom
            player2.position.set(0, -(cubeSize / 2 + playerSize.z / 6), 0);
            player2.rotation.set(Math.PI / 2, 0, 0);
            break;
    }
    sendGameState();

}

    //////////////////////--------COLLISION_MARKER_AIMING_LINE_SCORE--------//////////////////////

index6;

function updateCollisionMarker() {
    const halfCubeSize = cubeSize / 2;
    const ballPosition = ball.position.clone();
    const ballVelocity = ballSpeed.clone();

    let minT = Infinity;
    let intersectionPoint = null;
    let collidedFace = null;

    const checkFace = (axis, limit, faceName) => {
        if (ballVelocity[axis] !== 0) {
            const t = (limit - ballPosition[axis]) / ballVelocity[axis];
            if (t > 0 && t < minT) {
                const point = ballPosition.clone().add(ballVelocity.clone().multiplyScalar(t));
                if (
                    point.x >= -halfCubeSize && point.x <= halfCubeSize &&
                    point.y >= -halfCubeSize && point.y <= halfCubeSize &&
                    point.z >= -halfCubeSize && point.z <= halfCubeSize
                ) {
                    minT = t;
                    intersectionPoint = point;
                    collidedFace = faceName;
                }
            }
        }
    };

    // Check all 6 faces
    checkFace('x', halfCubeSize, 'right'); // Right face
    checkFace('x', -halfCubeSize, 'left'); // Left face
    checkFace('y', halfCubeSize, 'top'); // Top face
    checkFace('y', -halfCubeSize, 'bottom'); // Bottom face
    checkFace('z', halfCubeSize, 'front'); // Front face
    checkFace('z', -halfCubeSize, 'back'); // Back face

    if (intersectionPoint) {
        collisionMarker.position.copy(intersectionPoint);
        if (!ballIsHeld){
            currentBlinkingFace = collidedFace;
            startBlinking(collidedFace);
        }
    }
}

let aimingSpeed = 0.03;

const minAimingAngle = -Math.PI / 4; // -45 degrees
const maxAimingAngle = Math.PI / 4;  // 45 degrees

function updateAimingLine() {
    if (ballIsHeld) {
        // Update aiming angle
        aimingLine.material.opacity = 1;
        aimingAngle += aimingSpeed;
    
        if (aimingAngle > maxAimingAngle || aimingAngle < minAimingAngle) {
            aimingSpeed = -aimingSpeed; // Reverse direction
            aimingAngle += aimingSpeed; // Correct overshoot
        }

        let aimingDirection = new THREE.Vector3();
        switch (playerTurn ? currentFace : currentFace2) {
            case 0: // Front
                aimingDirection.set(Math.sin(aimingAngle), 0, -Math.cos(aimingAngle)); // Point inside
                break;
            case 1: // Back
                aimingDirection.set(Math.sin(aimingAngle), 0, Math.cos(aimingAngle)); // Point inside
                break;
            case 2: // Left
                aimingDirection.set(Math.cos(aimingAngle), 0, Math.sin(aimingAngle)); // Point inside
                break;
            case 3: // Right
                aimingDirection.set(-Math.cos(aimingAngle), 0, Math.sin(aimingAngle)); // Point inside
                break;
            case 4: // Top
                aimingDirection.set(Math.sin(aimingAngle), -Math.cos(aimingAngle), 0); // Point inside
                break;
            case 5: // Bottom
                aimingDirection.set(Math.sin(aimingAngle), Math.cos(aimingAngle), 0); // Point inside
                break;
        }

        aimingDirection.normalize();

        // Calculate the position of the aiming line's endpoint
        const endPoint = ball.position.clone().add(aimingDirection.clone().multiplyScalar(0.5));

        // Set the endpoint of the aiming line
        aimingLine.geometry.setFromPoints([ball.position, endPoint]);
    }
    else
        aimingLine.material.opacity = 0;
    sendGameState();
}

function updateScore() {
    let scoreDisplay = document.getElementById('scoreDisplay');
    scoreDisplay.innerHTML = `Player: ${playerScore} | Player_2: ${aiScore}`;
}

    //////////////////////--------BLINKING-------//////////////////////

index7;

let currentBlinkingFace = null;
let isBlinking = false;
let blinkInterval = 500; 
let lastBlinkTime = 0;


function startBlinking(faceName) {
    if (currentBlinkingFace)
    {
        const face = faceMaterials[faceName];
        //console.log(`Current material:`, face.material);
        //console.log("Blinking face:", faceName, face);
            if (!face) {
            console.error(`Face material for ${faceName} is not defined`);
            return;
        }

        const currentTime = Date.now();

            face.material.opacity = isBlinking ? 1.0 : 0.5;
            //console.log("Blinking :", face.material.opacity);
            face.material.needsUpdate = true;
            isBlinking = !isBlinking;
            lastBlinkTime = currentTime;
        

    }
}

function stopBlinking(faceName) {
    const face = faceMaterials[faceName];
    face.material.opacity = 0.5; // Reset to original opacity
    currentBlinkingFace = null;
}





function checkPlayerPosition() {
    const playerPosition = playerTurn ? player.position : player2.position;
    const halfCubeSize = cubeSize / 2;

    let currentFace = null;

    if (playerPosition.z >= halfCubeSize) {
        currentFace = 'front';
    } else if (playerPosition.z <= -halfCubeSize) {
        currentFace = 'back';
    } else if (playerPosition.x >= halfCubeSize) {
        currentFace = 'right';
    } else if (playerPosition.x <= -halfCubeSize) {
        currentFace = 'left';
    } else if (playerPosition.y >= halfCubeSize) {
        currentFace = 'top';
    } else if (playerPosition.y <= -halfCubeSize) {
        currentFace = 'bottom';
    }

    if (currentFace = currentBlinkingFace) {
        stopBlinking(currentFace);
    }
}

    //////////////////////--------MOVE_PLAYER_LOGIC--------//////////////////////

index8;

function movePlayer(player, deltaX, deltaY) {
    const halfSize = cubeSize / 2 - playerSize.z / 2;

    // Create a movement vector based on the mouse or key input
    let movement = new THREE.Vector3(deltaX, deltaY, 0);

    // Get the camera's rotation in world space
    let cameraRotation = new THREE.Quaternion();
    camera.getWorldQuaternion(cameraRotation);

    // Create a local to world matrix based on the camera's rotation
    let localToWorld = new THREE.Matrix4().makeRotationFromQuaternion(cameraRotation);

    // Transform the movement vector from local space to world space
    movement.applyMatrix4(localToWorld);

    // Constrain the movement to the plane of the current face
    switch (currentFace) {
        case 0: // Front
        case 1: // Back
            movement.z = 0;
            break;
        case 2: // Left
        case 3: // Right
            movement.x = 0;
            break;
        case 4: // Top
        case 5: // Bottom
            movement.y = 0;
            break;
    }

    // Apply the movement vector to the player's position
    player.position.add(movement);

    // Constrain player within the current face
    switch (currentFace) {
        case 0: // Front
        case 1: // Back
            player.position.x = Math.max(-halfSize, Math.min(halfSize, player.position.x));
            player.position.y = Math.max(-halfSize, Math.min(halfSize, player.position.y));
            break;
        case 2: // Left
        case 3: // Right
            player.position.z = Math.max(-halfSize, Math.min(halfSize, player.position.z));
            player.position.y = Math.max(-halfSize, Math.min(halfSize, player.position.y));
            break;
        case 4: // Top
        case 5: // Bottom
            player.position.x = Math.max(-halfSize, Math.min(halfSize, player.position.x));
            player.position.z = Math.max(-halfSize, Math.min(halfSize, player.position.z));
            break;
    }
}

function movePlayer2(player2, deltaX, deltaY) {
    const halfSize = cubeSize / 2 - playerSize.z / 2;

    // Create a movement vector based on the mouse or key input
    let movement = new THREE.Vector3(deltaX, deltaY, 0);

    // Get the camera's rotation in world space
    let cameraRotation = new THREE.Quaternion();
    camera2.getWorldQuaternion(cameraRotation);

    // Create a local to world matrix based on the camera's rotation
    let localToWorld = new THREE.Matrix4().makeRotationFromQuaternion(cameraRotation);

    // Transform the movement vector from local space to world space
    movement.applyMatrix4(localToWorld);

    // Constrain the movement to the plane of the current face
    switch (currentFace2) {
        case 0: // Front
        case 1: // Back
            movement.z = 0;
            break;
        case 2: // Left
        case 3: // Right
            movement.x = 0;
            break;
        case 4: // Top
        case 5: // Bottom
            movement.y = 0;
            break;
    }

    // Apply the movement vector to the player's position
    player2.position.add(movement);

    // Constrain player within the current face
    switch (currentFace2) {
        case 0: // Front
        case 1: // Back
            player2.position.x = Math.max(-halfSize, Math.min(halfSize, player2.position.x));
            player2.position.y = Math.max(-halfSize, Math.min(halfSize, player2.position.y));
            break;
        case 2: // Left
        case 3: // Right
            player2.position.z = Math.max(-halfSize, Math.min(halfSize, player2.position.z));
            player2.position.y = Math.max(-halfSize, Math.min(halfSize, player2.position.y));
            break;
        case 4: // Top
        case 5: // Bottom
            player2.position.x = Math.max(-halfSize, Math.min(halfSize, player2.position.x));
            player2.position.z = Math.max(-halfSize, Math.min(halfSize, player2.position.z));
            break;
    }
}

    //////////////////////--------MAIN_LOOP--------//////////////////////

index9;

function animate() {

    requestAnimationFrame(animate);
    TWEEN.update();
    moveLoop();
    updateAimingLine();
    updateCollisionMarker();
    checkPlayerPosition();
    updateScore();
    sendGameState();
    if (currentBlinkingFace) {
        startBlinking(currentBlinkingFace);
    }
    renderer.autoClear = false;
    renderer.clear();
    
    if (remote) {
        const x = (window.innerWidth) / 4;
        // Render the scene from the first camera
        renderer.setViewport(x, 0, window.innerWidth / 2, window.innerHeight);
        renderer.setScissor(x, 0, window.innerWidth, window.innerHeight);
        renderer.setScissorTest(false);
        if (currentPlayer === player) {
            renderer.render(scene, camera);
        } else {
            renderer.render(scene, camera2);
        }
    } else {
        // Render the scene from the first camera
        renderer.setViewport(0, 0, window.innerWidth / 2, window.innerHeight);
        renderer.setScissor(0, 0, window.innerWidth / 2, window.innerHeight);
        renderer.setScissorTest(true);
        renderer.render(scene, camera);
        
        // Render the scene from the second camera
        renderer.setViewport(window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
        renderer.setScissor(window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
        renderer.setScissorTest(true);
        renderer.render(scene, camera2);
    }
    
    // Disable the scissor test after rendering
    renderer.setScissorTest(false);
}

init();