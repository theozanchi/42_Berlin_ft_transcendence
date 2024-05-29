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
    player.position.set(0, 0, cubeSize / 2 + playerSize.z); // Initial position on the front face
    scene.add(player); // Add player to the scene, not the cube

    // Create AI player
    let aiPlayerGeometry = new THREE.BoxGeometry(playerSize.x, playerSize.y, playerSize.z);
    let aiPlayerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    aiPlayer = new THREE.Mesh(aiPlayerGeometry, aiPlayerMaterial);
    aiPlayer.position.set(0, 0, -(cubeSize / 2 + playerSize.z / 6)); // Initial position on the back face
    scene.add(aiPlayer); // Add AI player to the scene, not the cube

    // Create ball
    let ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
    let ballMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
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

    const targetPosition = getCameraPositionForFace(newFace);
    const targetRotationX = Math.atan2(targetPosition.y - camera.position.y, targetPosition.z - camera.position.z);
    const targetRotationY = Math.atan2(targetPosition.x - camera.position.x, targetPosition.z - camera.position.z);

    new TWEEN.Tween(camera.position)
        .to(targetPosition, 500) // duration of transition in ms
        .easing(TWEEN.Easing.Quadratic.Out)
        .onStart(() => {
            ballUpdateEnabled = true; // Disable ball updates during the transition
        })
        .onUpdate(() => {
            camera.lookAt(cube.position);
            updatePlayerPositionForFace(newFace);
        })
        .onComplete(() => {
            ballUpdateEnabled = true; // Re-enable ball updates after the transition
            updatePlayerPositionForFace(newFace);
        })
        .start();

    new TWEEN.Tween({ rotationX: rotationX, rotationY: rotationY })
        .to({ rotationX: targetRotationX, rotationY: targetRotationY }, 500)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate((obj) => {
            rotationX = obj.rotationX;
            rotationY = obj.rotationY;
        })
        .onComplete(() => {
            updatePlayerPositionForFace(currentFace);
        })
        .start();
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
        (Math.random() - 0.5) * 0.03,
        (Math.random() - 0.5) * 0.03,
        (Math.random() - 0.5) * 0.03
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
        wallHits++;
    }
    if (ball.position.y <= -halfCubeSize || ball.position.y >= halfCubeSize) {
        ballSpeed.y = -ballSpeed.y;
        wallHits++;
    }
    if (ball.position.z <= -halfCubeSize || ball.position.z >= halfCubeSize) {
        ballSpeed.z = -ballSpeed.z;
        wallHits++;
    }

    // Score handling
    if (wallHits >= 2) {
        if (playerTurn) {
            playerScore++;
        } else {
            aiScore++;
        }
        wallHits = 0;
        updateScore();
        resetBall();
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

    // Define front collision bounds for players
    const playerFront = playerBox.min.z;
    const aiFront = aiBox.max.z;

    if (playerBox.intersectsBox(ballBox) && ball.position.z >= playerFront) {
        ballSpeed.z = Math.abs(ballSpeed.z); // Ensure ball moves away from the player
        playerTurn = false;
        wallHits = 0;
        console.log("hit PL");
    }
    if (aiBox.intersectsBox(ballBox) && ball.position.z <= aiFront) {
        ballSpeed.z = -Math.abs(ballSpeed.z); // Ensure ball moves away from the AI player
        playerTurn = true;
        wallHits = 0;
        console.log("hit AI");
    }
}


function updateAI() {
    if (playerTurn) return;

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

