

import * as THREE from 'https://cdn.skypack.dev/three@0.134.0';
import TWEEN from 'https://cdn.skypack.dev/@tweenjs/tween.js@18.6.4';

import { sendJson, remote, gameStarted, round_number, player_id, setGameStarted } from './stepper.js';

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

let canvas;
let canvasParent;

document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('bg');
    if (canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        canvasParent = canvas.parentNode;
    } else {
        console.error('Canvas element with id "bg" not found.');
    }
});

let direction;
const faceMaterials = {};
let scene, camera, camera2, camera3, renderer, cube, ball, collisionMarker, aimingLine;
export let player, player2;

let ballUpdateEnabled = true;
let ballSpeed = new THREE.Vector3();
let oldBlinkingFace = null;
const ballRadius = 0.05; // Radius of the ball
const playerSize = { x: 0.35, y: 0.35, z: 0.05 }; // Size of the player
const cubeSize = 1.8; // Size of the cube
let playerTurn = true; // Player starts
let keyMoveSpeed = 0.05;
let player1Score = 0;
let player2Score = 0;
let currentPlayer;

let currentFace = 0; // 0 - front, 1 - back, 2 - left, 3 - right, 4 - top, 5 - bottom
let currentFace2 = 1;
let pivot;
let pivot2;
let isTransitioning = false;
let isTransitioning2 = false;
let ballIsHeld = true;
let wallHits = 0;
let aimingAngle = 0;
const initialReconnectInterval = 1000; // Initial reconnect interval in ms
let reconnectInterval = initialReconnectInterval;
let reconnectAttempts = 0;
let maxReconnectAttempts = 10;
let resetBall_ = false;
let lastGameState = null;
let timingStarted = false;
let isGameStateUpdating = false; 
const sendInterval = 1000 / 60;

const statusText = document.createElement('div');
export const gifBackground = document.createElement('div');
export const winnerText = document.createElement('div');

export function updateGameState(data) {
    if (data.content.last_update_time <= lastGameState) return;
    lastGameState = data.content.last_update_time;
    player1Score = data.content.player1Score;
    player2Score = data.content.player2Score;

    if (data.content.gameOver == true)
        return updateScore();

    if (currentPlayer === player2) {
        // Update player1 position
        player.position.set(data.content.player1.x, data.content.player1.y, data.content.player1.z);
        player.rotation.set(data.content.player1.rotation.x, data.content.player1.rotation.y, data.content.player1.rotation.z);
    }
    if (currentPlayer === player) {
        // Update player2 position
        player2.position.set(data.content.player2.x, data.content.player2.y, data.content.player2.z);
        player2.rotation.set(data.content.player2.rotation.x, data.content.player2.rotation.y, data.content.player2.rotation.z);
    }
    // Update ball position and speed
    ball.position.set(data.content.ball.x, data.content.ball.y, data.content.ball.z);
    ballSpeed.set(data.content.ballSpeed.x, data.content.ballSpeed.y, data.content.ballSpeed.z);
    // Update game data.content variables
    playerTurn = data.content.playerTurn;
    ballIsHeld = data.content.ballIsHeld;
    if (remote){
        if (currentPlayer === player) {
            currentFace2 = data.content.current_face2;
        } else if (currentPlayer === player2) {
            currentFace = data.content.current_face;
        }
    }
    aimingAngle = data.content.aiming_angle;
    resetBall_ = data.content.reset_ball;
    wallHits = data.content.wall_hits;
    direction = data.direction;
    //console.log("reset ball", resetBall_);
    //console.log("ballisheld", ballIsHeld);


    updateScore();
    isGameStateUpdating = false;
        
}    

// Ensure WebSocket is open before sending data
export function sendGameState() {
    const now = Date.now();
    //if (now - lastSentTime < sendInterval) return; // Acquire the lock

        const newGameState = {
            type: 'game-state',
            round_number: round_number,
            current_player: player_id,
            playerTurn: playerTurn,
            player1Score: player1Score,
            player2Score: player2Score,
            ball: {
                x: ball.position.x,
                y: ball.position.y,
                z: ball.position.z
            },
            ballSpeed: {
                x: ballSpeed.x,
                y: ballSpeed.y,
                z: ballSpeed.z
            },
            ballIsHeld: ballIsHeld,
            aiming_angle: aimingAngle,
            reset_ball: resetBall_,
            wall_hits: wallHits,
            direction: direction,
        };
        if (remote){
            if (currentPlayer === player) {
                newGameState.current_face = currentFace;
            }
            else if (currentPlayer === player2) {
                newGameState.current_face2 = currentFace2;
            }
        }
        if (remote){
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
            } else if (currentPlayer === player2) {
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
        }
        else {
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

        //if (!ballIsHeld) console.log("Sending new game state with ballIsHeld:", newGameState.ballIsHeld);

        sendJson(JSON.stringify(newGameState));
}  


    //////////////--------INIT_DATA---------///////////////  
    
index2;

export async function init() {

    canvas = document.getElementById('bg');
    if (canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        canvasParent = canvas.parentNode;
    } else {
        console.error('Canvas element with id "bg" not found.');
        return;
    }
    
    // Set the text content based on player_i
    // Create the text element
    statusText.style.position = 'absolute';
    statusText.style.bottom = '48px';
    statusText.style.left = '50%';
    statusText.style.transform = 'translateX(-50%)';
    statusText.style.padding = '10px 20px';
    statusText.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    statusText.style.borderRadius = '10px';
    statusText.style.fontFamily = 'Arial, sans-serif';
    statusText.style.fontSize = '18px';
    statusText.style.fontWeight = 'bold';
    statusText.style.color = 'black';
    statusText.style.zIndex = '1000'; // Ensure it is on top of the canvas
    
    canvasParent.appendChild(statusText);

    // Create the scene
    scene = new THREE.Scene();
    
    // Set up the camera
    camera = new THREE.PerspectiveCamera(75, (canvas.width / 2) / canvas.height, 0.01, 1000);
    camera2 = new THREE.PerspectiveCamera(75, (canvas.width / 2) / canvas.height, 0.01, 1000);
    camera3 = new THREE.PerspectiveCamera(75, (canvas.width / 2) / canvas.height, 0.01, 1000);
    
    // Set up the renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });

    renderer.setSize(canvas.width, canvas.height);
    
	canvasParent.replaceChild(renderer.domElement, canvas);
	
	// document.body.appendChild(renderer.domElement);
    
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

    const frontFace = createFace(faceSize, colors.front, { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: 0 });
    const backFace = createFace(faceSize, colors.back, { x: 0, y: 0, z: -1 }, { x: 0, y: Math.PI, z: 0 });
    const leftFace = createFace(faceSize, colors.left, { x: -1, y: 0, z: 0 }, { x: 0, y: Math.PI / 2, z: 0 });
    const rightFace = createFace(faceSize, colors.right, { x: 1, y: 0, z: 0 }, { x: 0, y: -Math.PI / 2, z: 0 });
    const topFace = createFace(faceSize, colors.top, { x: 0, y: 1, z: 0 }, { x: -Math.PI / 2, y: 0, z: 0 });
    const bottomFace = createFace(faceSize, colors.bottom, { x: 0, y: -1, z: 0 }, { x: Math.PI / 2, y: 0, z: 0 });
    
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

    camera3.position.set(1, 2, cubeSize * 1.5);
    camera3.lookAt(0, 0, 0);

    // Create player
    let playerGeometry = new THREE.BoxGeometry(playerSize.x, playerSize.y, playerSize.z);
    let playerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.material.transparent = true;
    setPlayerTransparency(0.25);
    player.position.set(0, 0, cubeSize / 2 + playerSize.z / 6); // Initial position on the front face
    player.rotation.set(0, 0, 0);
    console.log ('player position:', player.position);
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

    if (player_id === 'player1')
        currentPlayer = player;
    else if (player_id === 'player2')
        currentPlayer = player2;
    else
        currentPlayer = 'spectator';

    console.log('Current player:', currentPlayer);
            //--------EVENT_LISTENERS---------//


    // Add event listeners for movement and face change
    //document.addEventListener('keydown', onKeyDownPlayer1);
    //document.addEventListener('keydown', onKeyDownPlayer2);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    // Request pointer lock when the canvas is clicked
    renderer.domElement.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
    });
/*     document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement === renderer.domElement) {
            // Pointer is locked, add event listener for mouse movement
            document.addEventListener('mousemove', onMouseMove);
        } else {
            // Pointer is unlocked, remove event listener for mouse movement
            document.removeEventListener('mousemove', onMouseMove);
        }
    }); */
    
    animate();

}
    
    //////////////////////--------EVENT_LISTENERS---------//////////////////////
function calculateDirection() {
    let direction = { x: 0, y: 0, z: 0 };
    let face = playerTurn ? currentFace : currentFace2;

    switch (face) {
        case 0:  // Front
            direction.x = Math.sin(aimingAngle);
            direction.z = -Math.cos(aimingAngle);
            break;
        case 1:  // Back
            direction.x = Math.sin(aimingAngle);
            direction.z = Math.cos(aimingAngle);
            break;
        case 2:  // Left
            direction.x = Math.cos(aimingAngle);
            direction.z = Math.sin(aimingAngle);
            break;
        case 3:  // Right
            direction.x = -Math.cos(aimingAngle);
            direction.z = Math.sin(aimingAngle);
            break;
        case 4:  // Top
            direction.x = Math.sin(aimingAngle);
            direction.y = -Math.cos(aimingAngle);
            break;
        case 5:  // Bottom
            direction.x = Math.sin(aimingAngle);
            direction.y = Math.cos(aimingAngle);
            break;
        default:
            break;
    }

    return direction;
}
index3;

function moveLoop() {
    let deltaX = 0;
    let deltaY = 0;
    if(remote){
        if(currentPlayer === player){
            if (isTransitioning) return;
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

        }
        else{
            if (isTransitioning2) return;
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

        }
    } else {
        if (!isTransitioning) 
        {
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
        }

        deltaX = 0;
        deltaY = 0;
        if (!isTransitioning2){
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
        else if (currentPlayer == player2){
            movePlayer2(player2, deltaX, deltaY);
        }
    }
}


function onKeyDownPlayer1() {
    if (remote) {
        if (currentPlayer === player) {
            if (keysPressed['w']) {
                switchFace('up');
            }
            if (keysPressed['s']) {
                switchFace('down');
            }
            if (keysPressed['a']) {
                switchFace('left');
            }
            if (keysPressed['d']) {
                switchFace('right');
            }
            if (keysPressed[' '] && playerTurn) { // Space key
                if (ballIsHeld && !resetBall_) {
                    ballIsHeld = false; // Release the ball
                    resetBall_ = true; // Reset the ball to a random position
                    direction = calculateDirection();
                    ballIsHeld = false;
                }
            }
        }
    } else {
        if (keysPressed['w']) {
            switchFace('up');
        }
        if (keysPressed['s']) {
            switchFace('down');
        }
        if (keysPressed['a']) {
            switchFace('left');
        }
        if (keysPressed['d']) {
            switchFace('right');
        }
        if (keysPressed[' '] && playerTurn) { // Space key
            if (ballIsHeld && !resetBall_) {
                ballIsHeld = false; // Release the ball
                resetBall_ = true; // Reset the ball to a random position
                ballIsHeld = false;
            }
        }
    }
}

function onKeyDownPlayer2() {
    if (remote) {
        if (currentPlayer === player2) {
            if (keysPressed['s']) {
                switchFace2('up');
            }
            if (keysPressed['w']) {
                switchFace2('down');
            }
            if (keysPressed['a']) {
                switchFace2('left');
            }
            if (keysPressed['d']) {
                switchFace2('right');
            }
            if (keysPressed[' '] && !playerTurn) { // Space key
                if (ballIsHeld && !resetBall_) {
                    ballIsHeld = false; // Release the ball
                    resetBall_ = true; // Reset the ball to a random position
                    ballIsHeld = false;
                }
            }
        }
    } else {
        if (keysPressed['ArrowDown']) {
            switchFace2('up');
        }
        if (keysPressed['ArrowUp']) {
            switchFace2('down');
        }
        if (keysPressed['ArrowLeft']) {
            switchFace2('left');
        }
        if (keysPressed['ArrowRight']) {
            switchFace2('right');
        }
        if (keysPressed[' '] && !playerTurn) { // Space key
            if (ballIsHeld && !resetBall_) {
                ballIsHeld = false; // Release the ball
                resetBall_ = true; // Reset the ball to a random position
                ballIsHeld = false;
            }
        }
    }
}
function onKeyDown(event) {
    keysPressed[event.key] = true;
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
    '6': false,
    ' ': false
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
            updatePlayerPositionForFace(currentFace);
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

function createFace(size, outlineColor, position, rotation) {
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
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
            
            updatePlayerPositionForFace2(currentFace2);
            ballUpdateEnabled = true; // Disable ball updates during the transition
        })
        .onComplete(() => {
            updatePlayerPositionForFace2(currentFace2);
            isTransitioning2 = false;
            ballUpdateEnabled = true; // Re-enable ball updates after the transition
        })
        .start();
}

function updateCurrentFaceWithTargetRotation2(targetRotation) {
    // Define the reference vector representing the back direction
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

}

    //////////////////////--------COLLISION_MARKER_AIMING_LINE_SCORE--------//////////////////////

index6;

function updateCollisionMarker() {
    oldBlinkingFace = currentBlinkingFace;
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
    checkFace('x', halfCubeSize, '3'); // Right face
    checkFace('x', -halfCubeSize, '2'); // Left face
    checkFace('y', halfCubeSize, '4'); // Top face
    checkFace('y', -halfCubeSize, '5'); // Bottom face
    checkFace('z', halfCubeSize, '0'); // Front face
    checkFace('z', -halfCubeSize, '1'); // Back face

    if (intersectionPoint) {
        collisionMarker.position.copy(intersectionPoint);
        if (!ballIsHeld){
            currentBlinkingFace = collidedFace;
            //console.log("collided face:", collidedFace);
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
        direction = calculateDirection();
    }
    else
        aimingLine.material.opacity = 0;
}

function updateScore() {
    // let scoreDisplay = document.getElementById('scoreDisplay');
    // scoreDisplay.innerHTML = `Player: ${player1Score} | Player_2: ${player2Score}`;

	let liveScoreDisplay = document.getElementById('gameLiveScore');
	liveScoreDisplay.innerHTML = `${player1Score}:${player2Score}`;
}

    //////////////////////--------BLINKING-------//////////////////////

index7;

let currentBlinkingFace = null;

function getFaceName(name) {
    let faceName = '';
    switch (name) {
        case '0':
            faceName = 'front';
            break;
        case '1':
            faceName = 'back';
            break;
        case '2':
            faceName = 'left';
            break;
        case '3':
            faceName = 'right';
            break;
        case '4':
            faceName = 'top';
            break;
        case '5':
            faceName = 'bottom';
            break;
    }
    return faceName;
}

function startBlinking(faceNumber) {
    if (currentBlinkingFace !== oldBlinkingFace)
        stopBlinking();
    if (currentBlinkingFace)
    {
        let faceName = getFaceName(faceNumber);
        const face = faceMaterials[faceName];
        //console.log(`Current material:`, face.material);
        //console.log("Blinking face:", faceName, face);
            if (!face) {
            console.error(`Face material for ${faceName} is not defined`);
            return;
        }

        face.material.opacity = 1.0;
        //console.log("Blinking :", face.material.opacity);
        face.material.needsUpdate = true;
        

    }
}

function stopBlinking() {
    for (const faceName in faceMaterials) {
        if (faceMaterials.hasOwnProperty(faceName)) {
            const face = faceMaterials[faceName];
            face.material.opacity = 0.5; // Reset to original opacity
            face.material.needsUpdate = true;
        }
    }
    //currentBlinkingFace = null;
}





function checkPlayerPosition() {
    if (currentFace == currentBlinkingFace || currentFace2 == currentBlinkingFace || ballIsHeld) {
        stopBlinking();
        currentBlinkingFace = null;
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

export function animate() {
    if (gameStarted == false) {
        console.log('GAME STARTED IS FALSE');
        resetGame();
        return;
    }
    if (remote == true) {
        if (player_id === 'spectator')
            statusText.textContent = 'You are watching';
        else
            statusText.textContent = 'You are playing!';
    } else {
        if (playerTurn) {
            statusText.textContent = 'Player 1\'s turn';
        }
        else {
            statusText.textContent = 'Player 2\'s turn';
        }
    }
    
    requestAnimationFrame(animate);
    TWEEN.update();
    moveLoop();
    onKeyDownPlayer1();
    onKeyDownPlayer2();
    //onKeyUp();
    updateAimingLine();
    updateCollisionMarker();
    checkPlayerPosition();

    sendGameState();
    if (currentBlinkingFace && !ballIsHeld) {
        startBlinking(currentBlinkingFace);
    }
    renderer.autoClear = false;
    renderer.clear();
    
    if (remote) {
        const x = (canvas.width) / 4;
        // Render the scene from the first camera
        renderer.setViewport(x, 0, canvas.width / 2, canvas.height);
        renderer.setScissor(x, 0, canvas.width, canvas.height);
        renderer.setScissorTest(false);
        if (currentPlayer === player) {
            renderer.render(scene, camera);
        } else if (currentPlayer === player2) {
            renderer.render(scene, camera2);
        }
        else {
            renderer.render(scene, camera3);
        }
    } else {
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
    }
    
    // Disable the scissor test after rendering
    renderer.setScissorTest(false);
}

export function displayWinner(winner) {
    // Remove the status text element
    statusText.remove();

    // Fetch a GIF and set it as the background for the canvas
    var gifUrl = 'assets/background.gif'; // Example GIF URL
    var canvasParent = canvas.parentNode;

    // Create and style the background div
    gifBackground.style.position = 'absolute';
    gifBackground.style.top = canvas.offsetTop + 'px';
    gifBackground.style.left = canvas.offsetLeft + 'px';
    gifBackground.style.width = canvas.offsetWidth + 'px';
    gifBackground.style.height = canvas.offsetHeight + 'px';
    gifBackground.style.backgroundImage = `url(${gifUrl})`;
    gifBackground.style.backgroundSize = 'cover';
    gifBackground.style.backgroundPosition = 'center';
    gifBackground.style.zIndex = '500'; // Ensure it is behind the winner text
    canvasParent.appendChild(gifBackground);

    // Create and style the winner text element
    winnerText.style.position = 'absolute';
    winnerText.style.top = (canvas.offsetTop + canvas.offsetHeight / 2 - 35) + 'px'; // Centered vertically in the canvas
    winnerText.style.left = (canvas.offsetLeft + canvas.offsetWidth / 2) + 'px'; // Centered horizontally in the canvas
    winnerText.style.transform = 'translate(-50%, -50%)'; // Adjust to center
    winnerText.style.padding = '10px 20px';
    winnerText.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    winnerText.style.borderRadius = '10px';
    winnerText.style.fontFamily = 'Arial, sans-serif';
    winnerText.style.fontSize = '50px';
    winnerText.style.fontWeight = 'bold';
    winnerText.style.color = 'black';
    winnerText.style.zIndex = '1000'; // Ensure it is on top of the canvas
    winnerText.textContent = "Winner is " + winner.name;
    canvasParent.appendChild(winnerText);

    console.log(winner);
}

function clearScene(object) {
	if (!object)
		return;

    while(object.children.length > 0){ 
        clearScene(object.children[0]);
    }
    if (object.geometry) {
        object.geometry.dispose();
    }
    if (object.material) {
        if (Array.isArray(object.material)) {
            for (let i = 0; i < object.material.length; i++) {
                object.material[i].dispose();
            }
        } else {
            object.material.dispose();
        }
    }
    if (object.texture) {
        object.texture.dispose();
    }
    if (object.parent) { // this line is added to avoid error when the object is the scene itself
        object.parent.remove(object);
    }
}

export function resetGame() {
    console.log('RESETTING GAME...');

	if (statusText && statusText.parentNode)
		statusText.parentNode.removeChild(statusText);

    clearScene(scene);
	setGameStarted(false);

    scene = null;

	if (renderer) {
		renderer.clear();
    	renderer.dispose();
	}
	const context = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('2d');
    //context.clearRect(0, 0, canvas.width, canvas.height);
    
   // Reset all variables to their initial state
    scene = null;
    camera = null;
    camera2 = null;
    camera3 = null;
    renderer = null;
    cube = null;
    pivot = null;
    pivot2 = null;
    player = null;
    player2 = null;
    ball = null;
    aimingLine = null;
    aimingAngle = 0;
    resetBall_ = false;

    isTransitioning = false;
    isTransitioning2 = false;
    wallHits = 0;
    collisionMarker = null;

    if (player1Score > player2Score)
        playerTurn = true; // Player starts
    player1Score = 0;
    player2Score = 0;
    ballIsHeld = true;

    ballUpdateEnabled = true;
    ballSpeed = new THREE.Vector3();
    resetBall_ = false;

    keyMoveSpeed = 0.05;
    player1Score = 0;
    player2Score = 0;

    currentFace = 0; // 0 - front, 1 - back, 2 - left, 3 - right, 4 - top, 5 - bottom
    currentFace2 = 1;
    pivot;
    pivot2;
    isTransitioning = false;
    isTransitioning2 = false;
    ballIsHeld = true;
    wallHits = 0;
    aimingAngle = 0;

    gifBackground.remove();
    winnerText.remove();

    // Remove event listeners
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('mousemove', onMouseMove);
    //renderer.domElement.removeEventListener('click', requestPointerLock);

    //displayScore(player1Score > player2Score ? 'PLAYER 1' : 'PLAYER 2', player1Score, player2Score);

}
