class PongGame extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({mode: 'open'});
    }

    connectedCallback() {
        this.render();
        this.startGame();
    }

    render() {
        this.shadow.innerHTML = `
            <style>
                canvas {
                    border: 1px solid black;
                    width: 100%;
                    height: 80%;
                }
            </style>
            <canvas id="gameCanvas"></canvas>
        `;
    }

    startGame() {
        const canvas = this.shadow.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        let ball = {x: canvas.width / 2, y: canvas.height / 2, dx: 2, dy: 2, radius: 12};
        let paddleHeight = 24;
        let paddleWidth = canvas.width / 8;
        let paddleX1 = canvas.width / 2 - paddleWidth / 2;
        let paddleX2 = paddleX1;
        let paddleSpeed = 4;

        function drawBall() {
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
            ctx.fillStyle = "#0095DD";
            ctx.fill();
            ctx.closePath();
        }

        function drawPaddle(x, y) {
            ctx.beginPath();
            ctx.rect(x, y, paddleWidth, paddleHeight);
            ctx.fillStyle = "#0095DD";
            ctx.fill();
            ctx.closePath();
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawBall();
            drawPaddle(paddleX1, 12);
            drawPaddle(paddleX2, canvas.height - paddleHeight -12);

            if(ball.x + ball.dx > canvas.width-ball.radius || ball.x + ball.dx < ball.radius) {
                ball.dx = -ball.dx;
            }

            if(ball.y + ball.dy > canvas.height-ball.radius) {
                if(ball.x > paddleX2 && ball.x < paddleX2 + paddleWidth) {
                    ball.dy = -ball.dy;
                } else {
                    ball.x = canvas.width / 2;
                    ball.y = canvas.height / 2;
                }
            } else if(ball.y + ball.dy < ball.radius) {
                if(ball.x > paddleX1 && ball.x < paddleX1 + paddleWidth) {
                    ball.dy = -ball.dy;
                } else {
                    ball.x = canvas.width / 2;
                    ball.y = canvas.height / 2;
                }
            }

            ball.x += ball.dx;
            ball.y += ball.dy;

            if(paddleX1 < ball.x) {
                paddleX1 += paddleSpeed;
            } else {
                paddleX1 -= paddleSpeed;
            }

            if(paddleX2 < ball.x) {
                paddleX2 += paddleSpeed;
            } else {
                paddleX2 -= paddleSpeed;
            }

            requestAnimationFrame(draw);
        }

        draw();
    }
}

customElements.define('pong-game', PongGame);