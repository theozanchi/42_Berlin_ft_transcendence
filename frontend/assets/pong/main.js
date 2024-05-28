import './style.css';
import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

let mouseX = 0;
let mouseY = 0;
let mouseDown = false;
let previousMouseX = 0;
let previousMouseY = 0;
let ballUpdateEnabled = true;

let scene, camera, renderer, cube, player, aiPlayer, ball, collisionMarker;
let ballSpeed;
const ballRadius = 0.05; // Radius of the ball
const playerSize = { x: 0.39, y: 0.25, z: 0.05 }; // Size of the player
const cubeSize = 2; // Size of the cube
let playerTurn = false; // Player starts
let playerScore = 0;
let aiScore = 0;
let wallHits = 0;
let currentFace = 0; // 0 - front, 1 - back, 2 - left, 3 - right, 4 - top, 5 - bottom
let rotationX = 0;
let rotationY = 0;

function init() {
    // Create the scene
    scene = new THREE.Scene();

    // Set up the camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 3;

    // Set up the renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create the cube
    let geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    let material = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Create player
    let playerGeometry = new THREE.BoxGeometry(playerSize.x, playerSize.y, playerSize.z);
    let playerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.material.transparent = true;
    setPlayerTransparency(0.25);
    player.position.set(0, 0, cubeSize / 2 + playerSize.z / 2); // Initial position on the front face
    scene.add(player); // Add player to the scene, not the cube

    // Create AI player
    let aiPlayerGeometry = new THREE.BoxGeometry(playerSize.x, playerSize.y, playerSize.z);
    let aiPlayerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    aiPlayer = new THREE.Mesh(aiPlayerGeometry, aiPlayerMaterial);
    aiPlayer.position.set(0, 0, -(cubeSize / 2 + playerSize.z / 2)); // Initial position on the back face
    scene.add(aiPlayer); // Add AI player to the scene, not the cube

    // Create ball
    let ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
    let ballMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    ball = new THREE.Mesh(ballGeometry, ballMaterial);
    cube.add(ball);

    // Create collision marker
    const collisionMarkerGeometry = new THREE.SphereGeometry(0.05, 16, 16); // Smaller marker
    const collisionMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });
    collisionMarker = new THREE.Mesh(collisionMarkerGeometry, collisionMarkerMaterial);
    scene.add(collisionMarker);
    // Set the ball at a random position on the cube's surface
    resetBall();

    // Add event listeners for movement and face change
    document.addEventListener('keydown', onKeyDown);

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

function onKeyDown(event) {
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
        case 'ArrowUp':
            movePlayer(player, 0, 0.1);
            break;
        case 'ArrowDown':
            movePlayer(player, 0, -0.1);
            break;
        case 'ArrowLeft':
            movePlayer(player, -0.1, 0);
            break;
        case 'ArrowRight':
            movePlayer(player, 0.1, 0);
            break;
    }
}

function switchFace(direction) {
    const faceRotations = {
        0: { left: 2, right: 3, up: 4, down: 5 },
        1: { left: 3, right: 2, up: 4, down: 5 },
        2: { left: 1, right: 0, up: 4, down: 5 },
        3: { left: 0, right: 1, up: 4, down: 5 },
        4: { left: 2, right: 3, up: 1, down: 0 },
        5: { left: 2, right: 3, up: 0, down: 1 }
    };

    const newFace = faceRotations[currentFace][direction];
    currentFace = newFace;

    let targetRotationX = rotationX;
    let targetRotationY = rotationY;

    switch (direction) {
        case 'up':
            targetRotationX -= Math.PI / 2;
            break;
        case 'down':
            targetRotationX += Math.PI / 2;
            break;
        case 'left':
            targetRotationY -= Math.PI / 2;
            break;
        case 'right':
            targetRotationY += Math.PI / 2;
            break;
    }

    new TWEEN.Tween(camera.position)
        .to(getCameraPositionForFace(newFace), 500) // duration of transition in ms
        .easing(TWEEN.Easing.Quadratic.Out)
        .onStart(() => {
            ballUpdateEnabled = true; // Enable ball updates
        })
        .onUpdate(() => {
            camera.lookAt(cube.position);
        })
        .onComplete(() => {
            ballUpdateEnabled = true; // Re-enable ball updates
            updatePlayerPositionForFace(newFace);
        })
        .start();

    new TWEEN.Tween({ rotationX: rotationX, rotationY: rotationY })
        .to({ rotationX: targetRotationX, rotationY: targetRotationY }, 500)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate((obj) => {
            rotationX = obj.rotationX;
            rotationY = obj.rotationY;

            // Update player position based on the new face's rotation
            updatePlayerPositionForFace(currentFace);
        })
        .start();
}

function updatePlayerPositionForFace(face) {
    switch (face) {
        case 0: // Front
            player.position.set(0, 0, cubeSize / 2 + playerSize.z / 2);
            player.rotation.set(0, 0, 0);
            break;
        case 1: // Back
            player.position.set(0, 0, -(cubeSize / 2 + playerSize.z / 2));
            player.rotation.set(0, Math.PI, 0);
            break;
        case 2: // Left
            player.position.set(-(cubeSize / 2 + playerSize.z / 2), 0, 0);
            player.rotation.set(0, -Math.PI / 2, 0);
            break;
        case 3: // Right
            player.position.set(cubeSize / 2 + playerSize.z / 2, 0, 0);
            player.rotation.set(0, Math.PI / 2, 0);
            break;
        case 4: // Top
            player.position.set(0, cubeSize / 2 + playerSize.z / 2, 0);
            player.rotation.set(-Math.PI / 2, 0, 0);
            break;
        case 5: // Bottom
            player.position.set(0, -(cubeSize / 2 + playerSize.z / 2), 0);
            player.rotation.set(Math.PI / 2, 0, 0);
            break;
    }
}

function getCameraPositionForFace(face) {
    const distance = cubeSize * 1.5;
    switch (face) {
        case 0: return new THREE.Vector3(0, 0, distance);
        case 1: return new THREE.Vector3(0, 0, -distance);
        case 2: return new THREE.Vector3(-distance, 0, 0);
        case 3: return new THREE.Vector3(distance, 0, 0);
        case 4: return new THREE.Vector3(0, distance, 0);
        case 5: return new THREE.Vector3(0, -distance, 0);
    }
}

function updateCollisionMarker() {
    const halfCubeSize = cubeSize / 2;
    let intersectionPoint;

    if (ballSpeed.x !== 0) {
        let t = (ballSpeed.x > 0 ? halfCubeSize - ball.position.x : -halfCubeSize - ball.position.x) / ballSpeed.x;
        intersectionPoint = ball.position.clone().add(ballSpeed.clone().multiplyScalar(t));
    } else if (ballSpeed.y !== 0) {
        let t = (ballSpeed.y > 0 ? halfCubeSize - ball.position.y : -halfCubeSize - ball.position.y) / ballSpeed.y;
        intersectionPoint = ball.position.clone().add(ballSpeed.clone().multiplyScalar(t));
    } else if (ballSpeed.z !== 0) {
        let t = (ballSpeed.z > 0 ? halfCubeSize - ball.position.z : -halfCubeSize - ball.position.z) / ballSpeed.z;
        intersectionPoint = ball.position.clone().add(ballSpeed.clone().multiplyScalar(t));
    }

    collisionMarker.position.copy(intersectionPoint);
}

function movePlayer(player, deltaX, deltaY) {
    // Get the camera's right and up vectors
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);

    // Scale the movement vectors based on delta values
    right.multiplyScalar(deltaX);
    up.multiplyScalar(deltaY);

    // Combine the vectors to get the movement vector in the camera's local space
    const movement = right.clone().add(up);

    // Constrain player within the current face
    const halfSize = cubeSize / 2 - playerSize.z / 2;

    switch (currentFace) {
        case 0: // Front
        case 1: // Back
            player.position.x += movement.x;
            player.position.y += movement.y;
            player.position.x = Math.max(-halfSize, Math.min(halfSize, player.position.x));
            player.position.y = Math.max(-halfSize, Math.min(halfSize, player.position.y));
            break;
        case 2: // Left
        case 3: // Right
            player.position.y += movement.y;
            player.position.z += movement.z; // Apply movement along the z-axis
            player.position.y = Math.max(-halfSize, Math.min(halfSize, player.position.y));
            player.position.z = Math.max(-halfSize, Math.min(halfSize, player.position.z));
            break;
        case 4: // Top
        case 5: // Bottom
            player.position.z += movement.z;
            player.position.x += movement.x;
            player.position.z = Math.max(-halfSize, Math.min(halfSize, player.position.z));
            player.position.x = Math.max(-halfSize, Math.min(halfSize, player.position.x));
            break;
    }
}




function resetBall() {
    ballSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
    );

    ball.position.set(
        (Math.random() - 0.5) * cubeSize,
        (Math.random() - 0.5) * cubeSize,
        (Math.random() - 0.5) * cubeSize
    );
}

function updateBall() {
    if (!ballUpdateEnabled) return;

    ball.position.add(ballSpeed);

    const halfCubeSize = cubeSize / 2 - ballRadius;

    if (ball.position.x <= -halfCubeSize || ball.position.x >= halfCubeSize) {
        ballSpeed.x = -ballSpeed.x;
    }
    if (ball.position.y <= -halfCubeSize || ball.position.y >= halfCubeSize) {
        ballSpeed.y = -ballSpeed.y;
    }
    if (ball.position.z <= -halfCubeSize || ball.position.z >= halfCubeSize) {
        ballSpeed.z = -ballSpeed.z;
    }
    // Update the collision marker position
    updateCollisionMarker();

    // Check for collisions
    checkCollision();
}

function animate() {
    requestAnimationFrame(animate);

    TWEEN.update();

    updateBall();
    updateAI();

    renderer.render(scene, camera);
}

function updateScore() {
    let scoreDisplay = document.getElementById('scoreDisplay');
    scoreDisplay.innerHTML = `Player: ${playerScore} | AI: ${aiScore}`;
}

function checkCollision() {
    const playerBox = new THREE.Box3().setFromObject(player);
    const aiBox = new THREE.Box3().setFromObject(aiPlayer);
    const ballBox = new THREE.Box3().setFromObject(ball);

    if (playerBox.intersectsBox(ballBox)) {
        ballSpeed.z = -Math.abs(ballSpeed.z);
    }
    if (aiBox.intersectsBox(ballBox)) {
        ballSpeed.z = Math.abs(ballSpeed.z);
    }
}

function updateAI() {
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

init();

