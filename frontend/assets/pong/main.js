import './style.css';
import * as THREE from 'three';

let mouseX = 0;
let mouseY = 0;
let mouseDown = false;
let previousMouseX = 0;
let previousMouseY = 0;

let scene, camera, renderer, sphere, player1, player2, ball, collisionMarker;
let ballSpeed;
const ballRadius = 0.05; // Radius of the ball
const playerSize = { x: 0.1, y: 0.1, z: 0.3 }; // Size of the player
const sphereRadius = 1; // Radius of the sphere
let player1Turn = true; // Player 1 starts

function init() {
    // Create the scene
    scene = new THREE.Scene();

    // Set up the camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 2;

    // Set up the renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create the sphere
    let geometry = new THREE.SphereGeometry(sphereRadius, 32, 32);
    let material = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
    sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Create player 1
    let playerGeometry = new THREE.BoxGeometry(playerSize.x, playerSize.y, playerSize.z);
    let playerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    player1 = new THREE.Mesh(playerGeometry, playerMaterial);
    player1.position.set(0, 0, 0.9); // Fixed position in front of the camera
    scene.add(player1);

    // Create player 2
    player2 = new THREE.Mesh(playerGeometry, playerMaterial);
    player2.position.set(0, 0, -0.9); // Opposite side of the sphere
    scene.add(player2);

    // Create ball
    let ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
    let ballMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    ball = new THREE.Mesh(ballGeometry, ballMaterial);
    sphere.add(ball);

    // Set the ball at a random position on the sphere's surface
    let ballPosition = new THREE.Vector3().setFromSphericalCoords(
        sphereRadius - ballRadius,
        Math.random() * Math.PI,
        Math.random() * 2 * Math.PI
    );
    ball.position.copy(ballPosition);

    // Set the ball's initial speed in a random direction
    ballSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
    );

    // Create collision marker
    let markerGeometry = new THREE.SphereGeometry(0.02, 16, 16);
    let markerMaterial = new THREE.MeshBasicMaterial({ color: 0x800080 });
    collisionMarker = new THREE.Mesh(markerGeometry, markerMaterial);
    sphere.add(collisionMarker);

    // Set initial collision marker position
    setAntipodalPoint(ball.position);

    // Add mouse event listeners
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);

    animate();
}

function onMouseMove(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
}

function onMouseDown(event) {
    if (event.button === 1) { // Middle mouse button
        mouseDown = true;
        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
    }
}

function onMouseUp(event) {
    if (event.button === 1) { // Middle mouse button
        mouseDown = false;
    }
}

function rotateSphere() {
    if (mouseDown) {
        let deltaX = mouseX - previousMouseX;
        let deltaY = mouseY - previousMouseY;

        sphere.rotation.y += deltaX * 0.01;
        sphere.rotation.x += deltaY * 0.01;
        sphere.rotation.z += (deltaX + deltaY) * 0.005;

        previousMouseX = mouseX;
        previousMouseY = mouseY;
    }
}

function setAntipodalPoint(position) {
    const collisionNormal = position.clone().normalize();
    const antipodalPoint = collisionNormal.clone().multiplyScalar(-1).multiplyScalar(sphereRadius);
    collisionMarker.position.copy(antipodalPoint);
    collisionMarker.visible = true;
}

function checkCollisionsWithSphere() {
    // Calculate the ball's world position
    let ballWorldPosition = new THREE.Vector3();
    ball.getWorldPosition(ballWorldPosition);

    // Get the distance from the ball to the center of the sphere
    const distanceToCenter = ballWorldPosition.length();

    // Check if the ball is outside the sphere
    if (distanceToCenter + ballRadius > sphereRadius) {
        // Calculate the normal at the collision point
        const collisionNormal = ballWorldPosition.clone().normalize();

        // Reflect the ball's velocity towards the antipodal point
        ballSpeed.reflect(collisionNormal);

        // Move the ball back inside the sphere
        const penetrationDepth = distanceToCenter + ballRadius - sphereRadius;
        ball.position.add(collisionNormal.multiplyScalar(-penetrationDepth));

        // Set the new antipodal point
        setAntipodalPoint(ballWorldPosition);

        // Switch turns if the ball bounces inside the sphere
        if (!player1Turn) {
            // Player 1 scores a goal
            console.log("Player 1 scores!");
            // Reset the ball's position and velocity
            resetBall();
            // Player 1 gets the turn
            player1Turn = true;
        }
    }
}

function checkCollisionsWithPlayer() {
    const player1Box = new THREE.Box3().setFromObject(player1);
    const player2Box = new THREE.Box3().setFromObject(player2);
    const ballBox = new THREE.Box3().setFromObject(ball);

    if (player1Turn && player1Box.intersectsBox(ballBox)) {
        // Calculate the collision normal based on player's position
        const collisionNormal = new THREE.Vector3().subVectors(ball.position, player1.position).normalize();

        // Reflect the ball's velocity based on the collision normal
        ballSpeed.reflect(collisionNormal);

        // Set the new antipodal point
        setAntipodalPoint(ball.position);

        // Switch turns
        player1Turn = false;
    } else if (!player1Turn && player2Box.intersectsBox(ballBox)) {
        // Calculate the collision normal based on player's position
        const collisionNormal = new THREE.Vector3().subVectors(ball.position, player2.position).normalize();

        // Reflect the ball's velocity based on the collision normal
        ballSpeed.reflect(collisionNormal);

        // Set the new antipodal point
        setAntipodalPoint(ball.position);

        // Switch turns
        player1Turn = true;
    }
}

function resetBall() {
    // Set the ball at a random position on the sphere's surface
    let ballPosition = new THREE.Vector3().setFromSphericalCoords(
        sphereRadius - ballRadius,
        Math.random() * Math.PI,
        Math.random() * 2 * Math.PI
    );
    ball.position.copy(ballPosition);

    // Set the ball's initial speed in a random direction
    ballSpeed.set(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
    );

    // Set initial collision marker position
    setAntipodalPoint(ball.position);
}

function moveBall() {
    // Calculate direction vector to the antipodal point
    const directionToMarker = new THREE.Vector3().subVectors(collisionMarker.position, ball.position).normalize();

    // Move the ball towards the antipodal point
    ball.position.add(directionToMarker.clone().multiplyScalar(ballSpeed.length()));

    // Check for collisions with the rotating sphere
    checkCollisionsWithSphere();

    // Check for collisions with the players
    checkCollisionsWithPlayer();
}

function animate() {
    requestAnimationFrame(animate);

    rotateSphere();
    moveBall();

    renderer.render(scene, camera);
}

window.onload = init;

