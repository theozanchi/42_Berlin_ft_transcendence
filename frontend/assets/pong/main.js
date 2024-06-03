import './style.css';
import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

let mouseX = 0;
let mouseY = 0;
let mouseDown = false;
let previousMouseX = 0;
let previousMouseY = 0;
let ballUpdateEnabled = true;

let scene, camera, renderer, cube, player, aiPlayer, ball, collisionMarker, aimingLine;
let ballSpeed = new THREE.Vector3();
const ballRadius = 0.05; // Radius of the ball
const playerSize = { x: 0.35, y: 0.35, z: 0.05 }; // Size of the player
const cubeSize = 2; // Size of the cube
let playerTurn = true; // Player starts
let playerScore = 0;
let aiScore = 0;
let wallHits = 0;
let currentFace = 0; // 0 - front, 1 - back, 2 - left, 3 - right, 4 - top, 5 - bottom
let rotationX = 0;
let rotationY = 0;
let pivot; 
let isTransitioning = false;
let ballIsHeld = true;
let aimingAngle = 0;

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
    // Create a pivot point at the cube's center
    pivot = new THREE.Object3D();
    cube.add(pivot);
    pivot.add(camera);
    camera.position.set(0, 0, cubeSize * 1.5);

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

    // Create AI player
    let aiPlayerGeometry = new THREE.BoxGeometry(playerSize.x, playerSize.y, playerSize.z);
    let aiPlayerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    aiPlayer = new THREE.Mesh(aiPlayerGeometry, aiPlayerMaterial);
    aiPlayer.position.set(0, 0, -(cubeSize / 2 + playerSize.z / 6)); // Initial position on the back face
    scene.add(aiPlayer); // Add AI player to the scene, not the cube
    aiPlayer.currentFace = 1;
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
        case ' ': // Space key
        if (ballIsHeld) {
            playerTurn = false;
            ballIsHeld = false; // Release the ball
            resetBall(); // Reset the ball to a random position
        }
        break;
    }
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

/* function getCameraPositionForFace(face) {
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
 */
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
        switch (currentFace) {
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
        ball.position.copy(player.position);
        updateAimingLine();
    } else {
        // Calculate the direction based on the current face and aiming angle
        let direction = new THREE.Vector3();
        switch (currentFace) {
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
        const ballStartPosition = player.position.clone().add(direction.clone().multiplyScalar(offsetDistance));
        ball.position.copy(ballStartPosition);
    }
}


function updateBall() {
    if (!ballUpdateEnabled) return;
    if (ballIsHeld) {
        // Place the ball at the player's position
        ball.position.copy(player.position);
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
        wallHits = 0;
        ballIsHeld = true;
        updateScore();
        resetBall();
    }

    // Update the collision marker position
    updateCollisionMarker();
}

function animate() {
    requestAnimationFrame(animate);

    TWEEN.update();
    updateAimingLine();
    updateBall();
    updateAI();

    renderer.render(scene, camera);
}

function updateScore() {
    let scoreDisplay = document.getElementById('scoreDisplay');
    scoreDisplay.innerHTML = `Player: ${playerScore} | AI: ${aiScore}`;
}

function checkCollision() {
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
    const aiPlayerBox = new THREE.Box3().setFromObject(aiPlayer);

    // Check if the ball is colliding with the player or AI player
    if ((playerTurn && ballBox.intersectsBox(playerBox)) || (!playerTurn && ballBox.intersectsBox(aiPlayerBox))) {
        // Place collision marker at the intersection point for debugging
        collisionMarker.position.copy(ballPosition);

        console.log('Collision Detected:', playerTurn ? 'Player' : 'AI Player');

        // Get the paddle involved in the collision
        const paddle = playerTurn ? player : aiPlayer;
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

function bfsShortestPath(graph, start, target) {
    let queue = [[start]];
    let visited = new Set();
    visited.add(start);

    while (queue.length > 0) {
        let path = queue.shift();
        let node = path[path.length - 1];

        if (node === target) {
            return path;
        }

        for (let neighbor of graph[node]) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                let newPath = path.slice();
                newPath.push(neighbor);
                queue.push(newPath);
            }
        }
    }

    return null;
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

