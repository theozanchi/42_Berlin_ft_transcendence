/* function loadPongGame() {
    const canvas = document.getElementById('pongCanvas');
    const ctx = canvas.getContext('2d');

    // Ball object
    const ball = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 10,
        speed: 5,
        dx: 5,
        dy: 5
    };

    // Paddle dimensions
    const paddleWidth = 10;
    const paddleHeight = 100;

    // Player 1 object
    const player1 = {
        x: 0,
        y: canvas.height / 2 - paddleHeight / 2,
        width: paddleWidth,
        height: paddleHeight,
        dy: 0
    };

    // Player 2 object
    const player2 = {
        x: canvas.width - paddleWidth,
        y: canvas.height / 2 - paddleHeight / 2,
        width: paddleWidth,
        height: paddleHeight,
        dy: 0
    };

    // Draw ball
    function drawBall() {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.closePath();
    }

    // Draw paddles
    function drawPaddle(x, y, width, height) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(x, y, width, height);
    }

    // Draw everything
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBall();
        drawPaddle(player1.x, player1.y, player1.width, player1.height);
        drawPaddle(player2.x, player2.y, player2.width, player2.height);
    }

    // Update game state
    function update() {
        // Move ball
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Wall collision (top/bottom)
        if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
            ball.dy *= -1;
        }

        // Paddle collision
        if (ball.x - ball.radius < player1.x + player1.width && ball.y > player1.y && ball.y < player1.y + player1.height) {
            ball.dx *= -1;
        }

        if (ball.x + ball.radius > player2.x && ball.y > player2.y && ball.y < player2.y + player2.height) {
            ball.dx *= -1;
        }

        // Move paddles
        player1.y += player1.dy;
        player2.y += player2.dy;

        // Prevent paddles from going out of bounds
        if (player1.y < 0) {
            player1.y = 0;
        } else if (player1.y + player1.height > canvas.height) {
            player1.y = canvas.height - player1.height;
        }

        if (player2.y < 0) {
            player2.y = 0;
        } else if (player2.y + player2.height > canvas.height) {
            player2.y = canvas.height - player2.height;
        }
    }

    // Keyboard events
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);

    function keyDownHandler(e) {
        switch(e.key) {
            case 'ArrowUp':
                player2.dy = -6;
                break;
            case 'ArrowDown':
                player2.dy = 6;
                break;
            case 'w':
            case 'W':
                player1.dy = -6;
                break;
            case 's':
            case 'S':
                player1.dy = 6;
                break;
        }
    }

    function keyUpHandler(e) {
        switch(e.key) {
            case 'ArrowUp':
            case 'ArrowDown':
                player2.dy = 0;
                break;
            case 'w':
            case 'W':
            case 's':
            case 'S':
                player1.dy = 0;
                break;
        }
    }

    // Game loop
    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    gameLoop();
}

// Initialize the game when the script is loaded
loadPongGame();
 */

import './css/style.css'
// frontend/assets/pong.js
import * as THREE from 'three';

let scene, camera, renderer, ball, playerRacket, opponentRacket;
let ballSpeed = new THREE.Vector3(0.05, 0.05, 0.05);

function init() {
    // Create the scene
    scene = new THREE.Scene();

    // Set up the camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Set up the renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Create the ball
    let ballGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    let ballMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    ball = new THREE.Mesh(ballGeometry, ballMaterial);
    scene.add(ball);

    // Create the player racket
    let racketGeometry = new THREE.BoxGeometry(0.5, 0.05, 0.5);
    let playerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    playerRacket = new THREE.Mesh(racketGeometry, playerMaterial);
    playerRacket.position.y = -1.5;
    scene.add(playerRacket);

    // Create the opponent racket
    let opponentMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    opponentRacket = new THREE.Mesh(racketGeometry, opponentMaterial);
    opponentRacket.position.y = 1.5;
    scene.add(opponentRacket);

    // Add a hemisphere to represent the boundaries
    let sphereGeometry = new THREE.SphereGeometry(3, 32, 32, 0, Math.PI);
    let wireframe = new THREE.WireframeGeometry(sphereGeometry);
    let line = new THREE.LineSegments(wireframe);
    line.material.depthTest = false;
    line.material.opacity = 0.25;
    line.material.transparent = true;
    scene.add(line);

    // Add player controls
    document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
            playerRacket.position.x -= 0.1;
        }
        if (event.key === 'ArrowRight') {
            playerRacket.position.x += 0.1;
        }
    });
    
    animate();
}

function animate() {
    requestAnimationFrame(animate);

    // Ball movement
    ball.position.add(ballSpeed);

    // Ball collision with sphere boundary
    let ballDistance = ball.position.length();
    if (ballDistance > 3) {
        ballSpeed.negate();
    }

    // Ball collision with rackets
    if (ball.position.y < -1.45 && ball.position.distanceTo(playerRacket.position) < 0.5) {
        ballSpeed.y = -ballSpeed.y;
    }
    if (ball.position.y > 1.45 && ball.position.distanceTo(opponentRacket.position) < 0.5) {
        ballSpeed.y = -ballSpeed.y;
    }

    // Check scoring
    if (ball.position.y < -3) {
        console.log('Opponent scores!');
        resetBall();
    } else if (ball.position.y > 3) {
        console.log('Player scores!');
        resetBall();
    }

    renderer.render(scene, camera);
}

function resetBall() {
    ball.position.set(0, 0, 0);
    ballSpeed.set(0.05, 0.05, 0.05);
}

window.onload = init;
