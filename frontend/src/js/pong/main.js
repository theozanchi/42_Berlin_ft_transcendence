
import * as THREE from 'https://cdn.skypack.dev/three@0.134.0';
import TWEEN from 'https://cdn.skypack.dev/@tweenjs/tween.js@18.6.4';

const canvas = document.getElementById('bg');
const container = canvas.parentElement;
canvas.width = container.clientWidth;
canvas.height = container.clientHeight;

let mouseX = 0;
let mouseY = 0;
let mouseDown = false;
let previousMouseX = 0;
let previousMouseY = 0;
let ballUpdateEnabled = true;

let scene, camera, camera2, renderer, cube, player, player2, aiPlayer, ball, collisionMarker, aimingLine;
let ballSpeed = new THREE.Vector3();
const ballRadius = 0.05; // Radius of the ball
const playerSize = { x: 0.35, y: 0.35, z: 0.05 }; // Size of the player
const cubeSize = 2; // Size of the cube
let playerTurn = true; // Player starts
let playerScore = 0;
let aiScore = 0;
let wallHits = 0;
let currentFace = 0; // 0 - front, 1 - back, 2 - left, 3 - right, 4 - top, 5 - bottom
let currentFace2 = 1;
let pivot;
let pivot2; 
let isTransitioning = false;
let isTransitioning2 = false;
let ballIsHeld = true;
let aimingAngle = 0;
let player1Turn = true; // Player 1 starts
let singlePlayer = false; // Set to false for two-player game
let gameState;
let maxReconnectInterval = 200;
let reconnectInterval;
let oldGameState;
let socket;
let reconnectAttempts;

export function initializeWebSocket(url){
    
///setup web socket ///
        function connect() {
            
            socket = new WebSocket(url);
            socket.onopen = function(event) {
                console.log('WebSocket connection established.');
                reconnectAttempts = 0; // Reset reconnection attempts on successful connection
            };    
    
            socket.onmessage = function(event) {
                let data = JSON.parse(event.data);
                // Handle game state updates
                if (data.type === 'game_state') {
                    updateGameState(data);
                }    
            };    
    
            socket.onclose = function(event) {
                console.log('WebSocket connection closed.', event);
                if (reconnectAttempts < maxReconnectInterval) {
                    setTimeout(connect, reconnectInterval);
                    reconnectInterval = Math.min(reconnectInterval * 2, maxReconnectInterval); // Exponential backoff
                    reconnectAttempts++;
                } else {
                    console.error('Max reconnect attempts reached. Could not reconnect.');
                }    
            };    
    
            socket.onerror = function(error) {
                console.error('WebSocket error:', error);
                // Optional: Handle errors such as failed connection attempts
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
                player.position.set(data.player1.x, data.player1.y, data.player1.z);
                player2.position.set(data.player2.x, data.player2.y, data.player2.z);

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
            }    
        }    

        function deepEqual(obj1, obj2) {
            return JSON.stringify(obj1) === JSON.stringify(obj2);
        }    

        // Ensure WebSocket is open before sending data
        export function sendGameState() {
            if (socket.readyState === WebSocket.OPEN) {
                const newGameState = {
                    type: 'game_state',
                    player1: { x: player.position.x, y: player.position.y, z: player.position.z },
                    player2: { x: player2.position.x, y: player2.position.y, z: player2.position.z },
                    //ball: { x: ball.position.x, y: ball.position.y, z: ball.position.z },
                    //ballSpeed: { x: ballSpeed.x, y: ballSpeed.y, z: ballSpeed.z },
                    playerTurn: playerTurn,
                    playerScore: playerScore,
                    aiScore: aiScore,
                    ballIsHeld: ballIsHeld,
                    current_face: currentFace,
                    current_face2: currentFace2,
                    aiming_angle: aimingAngle

                };    
        
                if (!deepEqual(oldGameState, newGameState)) {
                    socket.send(JSON.stringify(newGameState));
                    oldGameState = newGameState; // Update the old game state to the new one
                }    
            } else {
                console.error('WebSocket is not open. Ready state:', socket.readyState);
            }    
        }    



    ///////////    
    



function init() {

    const url = `ws://${window.location.host}/ws/socket-server/`;
    initializeWebSocket(url);
    // Create the scene
    scene = new THREE.Scene();

    // Set up the camera
    camera = new THREE.PerspectiveCamera(75, (canvas.width / 2) / canvas.height, 0.1, 1000);
    camera2 = new THREE.PerspectiveCamera(75, (canvas.width / 2) / canvas.height, 0.1, 1000);

    // Set up the renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvas });
    renderer.setSize(canvas.width, canvas.height);
    document.body.appendChild(renderer.domElement);

    // Create the cube
    let geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    let material = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    // Create a pivot point at the cube's center
    pivot = new THREE.Object3D();window.addEventListener('resize', () => {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        renderer.setSize(canvas.width, canvas.height);
        camera.aspect = canvas.width / canvas.height;
        camera.updateProjectionMatrix();
    });
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

    // Create and position colored dots
    const dotRadius = 0.05;
    const dotPositions = [
        { color: 0xff0000, position: new THREE.Vector3(0, 0, cubeSize / 2 + dotRadius) }, // Front face: red
        { color: 0x00ff00, position: new THREE.Vector3(0, 0, -(cubeSize / 2 + dotRadius)) }, // Back face: green
        { color: 0x0000ff, position: new THREE.Vector3(-(cubeSize / 2 + dotRadius), 0, 0) }, // Left face: blue
        { color: 0xffff00, position: new THREE.Vector3(cubeSize / 2 + dotRadius, 0, 0) }, // Right face: yellow
        { color: 0xff00ff, position: new THREE.Vector3(0, cubeSize / 2 + dotRadius, 0) }, // Top face: magenta
        { color: 0x00ffff, position: new THREE.Vector3(0, -(cubeSize / 2 + dotRadius), 0) } // Bottom face: cyan
    ];

    dotPositions.forEach(dot => {
        const dotGeometry = new THREE.SphereGeometry(dotRadius, 16, 16);
        const dotMaterial = new THREE.MeshBasicMaterial({ color: dot.color });
        const dotMesh = new THREE.Mesh(dotGeometry, dotMaterial);
        dotMesh.position.copy(dot.position);
        scene.add(dotMesh);
    });
    // Create player
    let playerGeometry = new THREE.BoxGeometry(playerSize.x, playerSize.y, playerSize.z);
    let playerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.material.transparent = true;
    setPlayerTransparency(0.25);
    player.position.set(0, 0, cubeSize / 2 + playerSize.z / 6); // Initial position on the front face
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

    // Create AI player
    if(singlePlayer){
    let aiPlayerGeometry = new THREE.BoxGeometry(playerSize.x, playerSize.y, playerSize.z);
    let aiPlayerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    aiPlayer = new THREE.Mesh(aiPlayerGeometry, aiPlayerMaterial);
    aiPlayer.position.set(0, 0, -(cubeSize / 2 + playerSize.z / 6)); // Initial position on the back face
    scene.add(aiPlayer); // Add AI player to the scene, not the cube
    aiPlayer.currentFace = 1;}
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
    // Set the ball at a random position on the cube's surface
    resetBall();

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
    window.addEventListener('resize', () => {
        const computedStyle = getComputedStyle(container);
        const width = parseInt(computedStyle.width, 10);
        const height = parseInt(computedStyle.height, 10) - 48; // Adjust for the spacing
    
        canvas.width = width;
        canvas.height = height;
        renderer.setSize(canvas.width, canvas.height);
        camera.aspect = canvas.width / canvas.height;
        camera.updateProjectionMatrix();
    });

    // Add score display
    let scoreDisplay = document.createElement('div');
    scoreDisplay.id = 'scoreDisplay';
    scoreDisplay.style.position = 'absolute';
    scoreDisplay.style.top = '10px';
    scoreDisplay.style.left = '10px';
    scoreDisplay.style.color = 'white';
    scoreDisplay.style.fontSize = '20px';
    document.body.appendChild(scoreDisplay);

    updateScore();

    animate();
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

        movePlayer(player, deltaX, deltaY);
    }
}

// Adjust player's transparency
function setPlayerTransparency(value) {
    player.material.opacity = value;
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


function onKeyDown(event) {

    keysPressed[event.key] = true;
    console.log(keysPressed[event.key]);
    if (singlePlayer){
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
                playerTurn = !playerTurn;
                ballIsHeld = false; // Release the ball
                //resetBall(); // Reset the ball to a random position
            }
            break;
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
                    //resetBall(); // Reset the ball to a random position
                    playerTurn = !playerTurn;
                }
            break;
        }
    }
}
function onKeyUp(event) {

keysPressed[event.key] = false;

}



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
            
            updatePlayerPositionForFace(currentFace)
            ballUpdateEnabled = true; // Disable ball updates during the transition
        })
        .onComplete(() => {
            isTransitioning = false;
            ballUpdateEnabled = true; // Re-enable ball updates after the transition
        })
        .start();
        
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
}

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
    console.log(`Updated current face: ${currentFace2}`);
}


function updatePlayerPositionForFace2(face) {
    console.log(`Updating player position for face: ${face}`);
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
}



function updateCollisionMarker() {
    const halfCubeSize = cubeSize / 2;
    const ballPosition = ball.position.clone();
    const ballVelocity = ballSpeed.clone();

    let minT = Infinity;
    let intersectionPoint = null;

    // Check intersections with each cube face
    const checkFace = (axis, direction, limit) => {
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
                }
            }
        }
    };

    // Check all 6 faces
    checkFace('x', 1, halfCubeSize); // Right face
    checkFace('x', -1, -halfCubeSize); // Left face
    checkFace('y', 1, halfCubeSize); // Top face
    checkFace('y', -1, -halfCubeSize); // Bottom face
    checkFace('z', 1, halfCubeSize); // Front face
    checkFace('z', -1, -halfCubeSize); // Back face

    if (intersectionPoint) {
        collisionMarker.position.copy(intersectionPoint);
    }
}

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
}

function resetBall() {
    if (ballIsHeld) {
        // Place the ball at the player's position
        ball.position.copy(playerTurn ? player.position : player2.position);
        updateAimingLine();
    } else {
        // Calculate the direction based on the current face and aiming angle
        let direction = new THREE.Vector3();
        switch (playerTurn ? currentFace : currentFace2) {
            case 0: // Front
                direction.set(Math.sin(aimingAngle), 0, -Math.cos(aimingAngle));
                break;
            case 1: // Back
                direction.set(Math.sin(aimingAngle), 0, Math.cos(aimingAngle));
                break;
            case 2: // Left
                direction.set(-Math.cos(aimingAngle), 0, Math.sin(aimingAngle));
                break;
            case 3: // Right
                direction.set(Math.cos(aimingAngle), 0, Math.sin(aimingAngle));
                break;
            case 4: // Top
                direction.set(Math.sin(aimingAngle), -Math.cos(aimingAngle), 0);
                break;
            case 5: // Bottom
                direction.set(Math.sin(aimingAngle), Math.cos(aimingAngle), 0);
                break;
        }

        direction.normalize();

        // Define the initial velocity magnitude (you can adjust this as needed)
        const initialVelocityMagnitude = 0.02;

        // Apply the initial velocity to the ball in the direction the player is facing
        ballSpeed = direction.clone().multiplyScalar(initialVelocityMagnitude);

        // Set the ball's position slightly in front of the player to avoid immediate collision
        const offsetDistance = 0.1; // Adjust as needed
        const ballStartPosition = playerTurn ? player.position.clone().add(direction.clone().multiplyScalar(offsetDistance)) : player2.position.clone().add(direction.clone().multiplyScalar(offsetDistance));
        ball.position.copy(ballStartPosition);
    }
}


function updateBall() {
    if (!ballUpdateEnabled) return;
    if (ballIsHeld) {
        // Place the ball at the player's position
        ball.position.copy(playerTurn ? player.position : player2.position);
        return;
    }

    // Calculate the next position of the ball
    const nextPosition = ball.position.clone().add(ballSpeed);

    // Check for collisions with players
    if (checkCollision()) {
    } else {
        ball.position.copy(nextPosition); // Update ball position normally
    }

    const halfCubeSize = cubeSize / 2 - ballRadius;

    if (ball.position.x <= -halfCubeSize || ball.position.x >= halfCubeSize) {
        ballSpeed.x = -ballSpeed.x;
        wallHits++;
        console.log(wallHits);
    }
    if (ball.position.y <= -halfCubeSize || ball.position.y >= halfCubeSize) {
        ballSpeed.y = -ballSpeed.y;
        wallHits++;
        console.log(wallHits);
    }
    if (ball.position.z <= -halfCubeSize || ball.position.z >= halfCubeSize) {
        ballSpeed.z = -ballSpeed.z;
        wallHits++;
        console.log(wallHits);
    }

    // Score handling
    if (wallHits >= 2) {
        if (!playerTurn) {
            playerScore++;
        } else {
            aiScore++;
        }
        playerTurn != playerTurn
        wallHits = 0;
        ballIsHeld = true;
        updateScore();
        resetBall();
    }

    // Update the collision marker position
    updateCollisionMarker();
}

let keyMoveSpeed = 0.05;

function gameLoop() {
    let deltaX = 0;
    let deltaY = 0;
    if(singlePlayer){
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
}

}
  


function updateScore() {
    let scoreDisplay = document.getElementById('scoreDisplay');
    scoreDisplay.innerHTML = `Player: ${playerScore} | AI: ${aiScore}`;
}

function checkCollision() {
    if(ballIsHeld) return;
    if (ballSpeed.length() === 0) {
        return false;
    }


    const ballPosition = ball.getWorldPosition(new THREE.Vector3());
    const nextPosition = ballPosition.clone().add(ballSpeed);
    
    // Create a bounding box that encompasses the ball's start and end points
    const ballBox = new THREE.Box3().setFromCenterAndSize(
        ballPosition.clone().add(nextPosition).multiplyScalar(0.5),
        new THREE.Vector3(ballRadius * 2, ballRadius * 2, ballRadius * 2).add(ballSpeed.clone().set(Math.abs(ballSpeed.x), Math.abs(ballSpeed.y), Math.abs(ballSpeed.z)))
        );
        
        const playerBox = new THREE.Box3().setFromObject(player);
        const aiPlayerBox = new THREE.Box3().setFromObject(singlePlayer ? aiPlayer : player2);
        // Check if the ball is colliding with the player or AI player
        if ((playerTurn && ballBox.intersectsBox(playerBox)) || (!playerTurn && ballBox.intersectsBox(aiPlayerBox))) {
            // Place collision marker at the intersection point for debugging
            collisionMarker.position.copy(ballPosition);
            
            console.log('Collision Detected:', playerTurn ? 'Player' : 'AI Player');
            
            // Get the paddle involved in the collision
            const paddle = playerTurn ? player : singlePlayer ? aiPlayer : player2;
            const paddlePosition = paddle.getWorldPosition(new THREE.Vector3());
            const paddleScale = paddle.scale;
            
            // Calculate the relative collision point on the paddle
            const relativeCollisionPoint = ballPosition.clone().sub(paddlePosition);
            
            // Normalize the relative collision point to [-1, 1]
            relativeCollisionPoint.x /= paddleScale.x / 2;
            relativeCollisionPoint.y /= paddleScale.y / 2;
            relativeCollisionPoint.z /= paddleScale.z / 2;
            
            // Adjust ball direction based on the relative collision point
            const speed = ballSpeed.length();
            let newBallSpeed = new THREE.Vector3();
            
            // Example logic to change direction dynamically
            newBallSpeed.x = ballSpeed.x + relativeCollisionPoint.x * 0.5;
            newBallSpeed.y = ballSpeed.y + relativeCollisionPoint.y * 0.5;
            newBallSpeed.z = -ballSpeed.z + relativeCollisionPoint.z * 0.5; // Reversing Z for a basic bounce back effect
            
            // Normalize to maintain constant speed
            newBallSpeed.setLength(speed);
            
            const speedIncrement = 0.02; // Adjust this value to control the speed increase rate
            newBallSpeed.multiplyScalar(1 + speedIncrement);
            
            ballSpeed.copy(newBallSpeed);
            
            // Move the ball slightly away from the collision point to prevent immediate re-collision
            ball.position.add(ballSpeed.clone().multiplyScalar(0.1));
            
            // Change player turn
            playerTurn = !playerTurn;
            
            // Reset wall hits
            wallHits = 0;
            
            return true;
        }
        
        return false;
    }
    
    
    const cubeGraph = {
        0: [2, 3, 4, 5], // Front face is connected to Left, Right, Top, Bottom
        1: [2, 3, 4, 5], // Back face
        2: [0, 1, 4, 5], // Left face
    3: [0, 1, 4, 5], // Right face
    4: [0, 1, 2, 3], // Top face
    5: [0, 1, 2, 3]  // Bottom face
};


function updateAI() {
    if (playerTurn || !singlePlayer) return;
    
    // Move AI player towards the collision marker
    const targetPosition = collisionMarker.position.clone();
    aiPlayer.position.lerp(targetPosition, 0.05);
    
    // Constrain AI player within the current face
    const halfSize = cubeSize / 2 - playerSize.z / 2;
    
    switch (currentFace) {
        case 0: // Front
        case 1: // Back
        aiPlayer.position.x = Math.max(-halfSize, Math.min(halfSize, aiPlayer.position.x));
        aiPlayer.position.y = Math.max(-halfSize, Math.min(halfSize, aiPlayer.position.y));
        break;
        case 2: // Left
        case 3: // Right
        aiPlayer.position.z = Math.max(-halfSize, Math.min(halfSize, aiPlayer.position.z));
        aiPlayer.position.y = Math.max(-halfSize, Math.min(halfSize, aiPlayer.position.y));
        break;
        case 4: // Top
        case 5: // Bottom
        aiPlayer.position.x = Math.max(-halfSize, Math.min(halfSize, aiPlayer.position.x));
        aiPlayer.position.z = Math.max(-halfSize, Math.min(halfSize, aiPlayer.position.z));
        break;
    }
}


function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    gameLoop();
    updateAimingLine();
    updateCollisionMarker();
    sendGameState();
    renderer.clear();

    // Render the scene from the first camera
    renderer.setViewport(0, 0, canvas.width / 2, canvas.height);
    renderer.setScissor(0, 0, canvas.width / 2, canvas.height);
    renderer.setScissorTest(true);
    renderer.render(scene, camera);

    // Render the scene from the second camera
    renderer.setViewport(canvas.width / 2, 0, canvas.width / 2, canvas.height);
    renderer.setScissor(canvas.width / 2, 0, canvas.width / 2, canvas.height);
    renderer.setScissorTest(true);
    renderer.render(scene, camera2);

    // Disable the scissor test after rendering both views
    renderer.setScissorTest(false);

    // Send a request to the server to update the game state
    socket.send(JSON.stringify({ 'type': 'update_state' }));

}

let frameCount = 0;

init();
