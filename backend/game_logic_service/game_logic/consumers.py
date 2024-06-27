import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
import logging
import math
import time

logging.basicConfig(level=logging.INFO)

class PongConsumer(WebsocketConsumer):
    clients = {}
    player_id = 0
    spectator_id = 0

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.aiming_angle = 0  # Initialize aiming_angle
        self.aimingSpeed = 0.05  # Example speed value, adjust as needed
        self.maxaiming_angle = 1.57  # Example max angle value (90 degrees in radians)
        self.minaiming_angle = -1.57 
        self.cube_size = 2
        self.ball_radius = 0.05
        self.resetting_ball = False
        self.last_update_time = time.time()
        self.update_interval = 1 / 60
        self.client = None
        

    game_state = {
        'player1': {'x': 0, 'y': 0, 'z': 1, 'rotation': {'x': 0, 'y': 0, 'z': 0}},
        'player2': {'x': 0, 'y': 0, 'z': -1, 'rotation': {'x': 0, 'y': 0, 'z': 0}},
        'ball': {'x': 0, 'y': 0, 'z': 0},
        'ballSpeed': {'x': 0, 'y': 0, 'z': 0},
        'playerTurn': True,  # Initial value, assuming player 1 starts
        'playerScore': 0,
        'aiScore': 0,
        'ballIsHeld': True,  # Initial value, assuming ball is held initially
        'current_face': 0,  # Adding initial value for current face
        'current_face2': 1,
        'wall_hits' : 0,
        'aiming_angle' : 0,
        'reset_ball': False
    }

    def connect(self):
        print("connected game logic")
        self.accept()
        if 'player1' not in PongConsumer.clients:
            client_id = 'player1'
        elif 'player2' not in PongConsumer.clients:
            client_id = 'player2'
        else:
            # Assign as a spectator
            client_id = f'spectator{PongConsumer.spectator_id + 1}'
            PongConsumer.spectator_id += 1

        PongConsumer.clients[client_id] = self
        #PongConsumer.player_id = (PongConsumer.player_id + 1) % 2  # Alternate between 0 and 1
        self.scope['client_id'] = client_id
        self.client = client_id

        # Send the client its player identity
        self.send(text_data=json.dumps({
            'type': 'player_identity',
            'player_id': client_id
        }))
        logging.info(f"New client connected. Client ID: {client_id}")
        self.send_game_state()

    def disconnect(self, close_code):
        client_id = self.scope.get('client_id')
        if client_id and client_id in PongConsumer.clients:
            PongConsumer.clients.pop(client_id, None)
            logging.info(f"Client disconnected. Client ID: {client_id}")

    def receive(self, text_data):
        data = json.loads(text_data)
        if data['type'] == 'game_state':
            self.update_game_state(data)


    def update_game_state(self, data):
        current_time = time.time()
            # Handle ball movement and collision detection server-side
        self.game_update(data)
        self.update_aiming_line()
        if current_time - self.last_update_time >= self.update_interval:
            self.last_update_time = current_time
            if self.game_state['reset_ball'] and not self.game_state['ballIsHeld']:
                self.reset_ball()
            self.update_ball()
        self.update_ai()
        self.send_game_state()


    def update_ball(self):
        
        #print(f'ballishe    ld: {self.game_state["ballIsHeld"]}')
        if self.game_state['ballIsHeld']:
            if self.game_state['playerTurn']:
                self.game_state['ball'] = self.game_state['player1'].copy()
            else:
                self.game_state['ball'] = self.game_state['player2'].copy()
            return

        # Calculate the next position of the ball
        next_position = {
            'x': self.game_state['ball']['x'] + self.game_state['ballSpeed']['x'],
            'y': self.game_state['ball']['y'] + self.game_state['ballSpeed']['y'],
            'z': self.game_state['ball']['z'] + self.game_state['ballSpeed']['z']
        }

        # Check for collisions with players
        if self.check_collision():
            print("collision")
            pass
        else:
            self.game_state['ball'] = next_position  # Update ball position normally

        half_cube_size = self.cube_size / 2 - self.ball_radius

        if self.game_state['ball']['x'] <= -half_cube_size or self.game_state['ball']['x'] >= half_cube_size:
            self.game_state['ballSpeed']['x'] = -self.game_state['ballSpeed']['x']
            self.game_state['wall_hits'] += 1
            logging.info(self.game_state['wall_hits'])

        if self.game_state['ball']['y'] <= -half_cube_size or self.game_state['ball']['y'] >= half_cube_size:
            self.game_state['ballSpeed']['y'] = -self.game_state['ballSpeed']['y']
            self.game_state['wall_hits'] += 1
            logging.info(self.game_state['wall_hits'])

        if self.game_state['ball']['z'] <= -half_cube_size or self.game_state['ball']['z'] >= half_cube_size:
            self.game_state['ballSpeed']['z'] = -self.game_state['ballSpeed']['z']
            self.game_state['wall_hits'] += 1
            logging.info(self.game_state['wall_hits'])

        # Score handling
        if self.game_state['wall_hits'] >= 2:
            if not self.game_state['playerTurn']:
                self.game_state['playerScore'] += 1
            else:
                self.game_state['aiScore'] += 1
            self.game_state['wall_hits'] = 0
            self.game_state['playerTurn'] = not self.game_state['playerTurn']
            self.game_state['ballIsHeld'] = True
            self.update_score()
            self.update_ball()
            self.reset_ball()

        # Update the collision marker position
        self.update_collision_marker()



    def check_collision(self):
        if self.game_state['ballIsHeld']:
            return False
        
        if (self.game_state['ballSpeed']['x'] == 0 and 
            self.game_state['ballSpeed']['y'] == 0 and 
            self.game_state['ballSpeed']['z'] == 0):
            return False

        ball_position = self.game_state['ball']
        next_position = {
            'x': ball_position['x'] + self.game_state['ballSpeed']['x'],
            'y': ball_position['y'] + self.game_state['ballSpeed']['y'],
            'z': ball_position['z'] + self.game_state['ballSpeed']['z']
        }

        # Create a bounding box that encompasses the ball's start and end points
        ball_box = self.create_bounding_box(ball_position, next_position)

        player_box = self.create_bounding_box(self.game_state['player1'], self.game_state['player1'])
        ai_player_box = self.create_bounding_box(self.game_state['player2'], self.game_state['player2'])

        # Check if the ball is colliding with the player or AI player
        if ((self.game_state['playerTurn'] and self.intersects_box(ball_box, player_box)) or
            (not self.game_state['playerTurn'] and self.intersects_box(ball_box, ai_player_box))):
            
            # Place collision marker at the intersection point for debugging
            self.collision_marker_position = ball_position.copy()
            logging.info(f'Collision Detected: {"Player" if self.game_state["playerTurn"] else "AI Player"}')

            # Get the paddle involved in the collision
            paddle = self.game_state['player1'] if self.game_state['playerTurn'] else self.game_state['player2']
            paddle_position = paddle
            paddle_scale = {'x': 1, 'y': 1, 'z': 1}  # Assuming scale is 1 for simplicity

            # Calculate the relative collision point on the paddle
            relative_collision_point = {
                'x': ball_position['x'] - paddle_position['x'],
                'y': ball_position['y'] - paddle_position['y'],
                'z': ball_position['z'] - paddle_position['z']
            }

            # Normalize the relative collision point to [-1, 1]
            relative_collision_point['x'] /= paddle_scale['x'] / 2
            relative_collision_point['y'] /= paddle_scale['y'] / 2
            relative_collision_point['z'] /= paddle_scale['z'] / 2

            # Adjust ball direction based on the relative collision point
            speed = self.vector_length(self.game_state['ballSpeed'])
            new_ball_speed = {
                'x': self.game_state['ballSpeed']['x'] + relative_collision_point['x'] * 0.5,
                'y': self.game_state['ballSpeed']['y'] + relative_collision_point['y'] * 0.5,
                'z': -self.game_state['ballSpeed']['z'] + relative_collision_point['z'] * 0.5  # Reversing Z for a basic bounce back effect
            }

            # Normalize to maintain constant speed
            self.set_vector_length(new_ball_speed, speed)

            speed_increment = 0.02  # Adjust this value to control the speed increase rate
            new_ball_speed = {k: v * (1 + speed_increment) for k, v in new_ball_speed.items()}

            self.game_state['ballSpeed'] = new_ball_speed

            # Move the ball slightly away from the collision point to prdata immediate re-collision
            self.game_state['ball'] = {
                'x': self.game_state['ball']['x'] + self.game_state['ballSpeed']['x'] * 0.1,
                'y': self.game_state['ball']['y'] + self.game_state['ballSpeed']['y'] * 0.1,
                'z': self.game_state['ball']['z'] + self.game_state['ballSpeed']['z'] * 0.1
            }

            # Change player turn
            self.game_state['playerTurn'] = not self.game_state['playerTurn']

            # Reset wall hits
            self.game_state['wall_hits'] = 0

            return True

        return False

    def create_bounding_box(self, start, end):

        margin = 0.009

        center = {
            'x': (start['x'] + end['x']) / 2,
            'y': (start['y'] + end['y']) / 2,
            'z': (start['z'] + end['z']) / 2
        }
        size = {
            'x': abs(end['x'] - start['x']) + self.ball_radius * 2 + margin * 2,
            'y': abs(end['y'] - start['y']) + self.ball_radius * 2 + margin * 2,
            'z': abs(end['z'] - start['z']) + self.ball_radius * 2 + margin * 2
        }
        return (center, size)

    def intersects_box(self, box1, box2):
        # Simplified bounding box intersection logic
        center1, size1 = box1
        center2, size2 = box2
        for axis in ['x', 'y', 'z']:
            if abs(center1[axis] - center2[axis]) > (size1[axis] / 2 + size2[axis] / 2):
                return False
        return True

    def vector_length(self, vector):
        return (vector['x']**2 + vector['y']**2 + vector['z']**2) ** 0.5

    def set_vector_length(self, vector, length):
        current_length = self.vector_length(vector)
        for axis in ['x', 'y', 'z']:
            vector[axis] = vector[axis] / current_length * length
    
    def  update_score(self):
    # Assuming the presence of a score display element in the client that gets updated via WebSocket message
        self.send(text_data=json.dumps({
            'type': 'update_score',
            'playerScore': self.game_state['playerScore'],
            'aiScore': self.game_state['aiScore']
        }))

    def clone_and_add(self, position, direction, offset_distance):
        return {k: position[k] + direction[k] * offset_distance for k in position.keys()}

    def vector_length(self, vector):
        return math.sqrt(sum(v ** 2 for v in vector.values()))
    
    def reset_ball(self):

        self.game_state['playerTurn'] = not self.game_state['playerTurn']
        self.game_state['reset_ball'] = False

        # Calcular la dirección en base a la cara actual y el ángulo de puntería
        direction = self.calculate_direction(self.game_state['playerTurn'], self.game_state['current_face'], self.game_state['current_face2'], self.game_state['aiming_angle'])

        # Normalizar la dirección para asegurarse de que sea un vector unitario
        direction_length = self.vector_length(direction)
        if direction_length > 0:
            direction = {k: v / direction_length for k, v in direction.items()}

        # Definir la magnitud de la velocidad inicial
        initial_velocity_magnitude = 0.02
        self.game_state['ballSpeed'] = {k: v * initial_velocity_magnitude for k, v in direction.items()}

        # Establecer la posición inicial de la pelota, asegurándose de que no colisione inmediatamente con el jugador
        offset_distance = 0.3  # Ajustar según sea necesario
        if not self.game_state['playerTurn']:
            ball_start_position = {k: self.game_state['player1'][k] + direction[k] * offset_distance for k in direction}
        else:
            ball_start_position = {k: self.game_state['player2'][k] + direction[k] * offset_distance for k in direction}

        # Verificar que la posición inicial esté dentro de los límites permitidos del cubo
        half_cube_size = self.cube_size / 2 - self.ball_radius
        for axis in ['x', 'y', 'z']:
            if ball_start_position[axis] < -half_cube_size:
                ball_start_position[axis] = -half_cube_size
            if ball_start_position[axis] > half_cube_size:
                ball_start_position[axis] = half_cube_size

        self.game_state['ball'] = ball_start_position.copy()
        

    def update_collision_marker(self):
        half_cube_size = self.cube_size / 2
        ball_position = self.game_state['ball']
        ball_velocity = self.game_state['ballSpeed']

        min_t = float('inf')
        intersection_point = None

        def check_face(axis, direction, limit):
            nonlocal min_t, intersection_point
            if ball_velocity[axis] != 0:
                t = (limit - ball_position[axis]) / ball_velocity[axis]
                if 0 < t < min_t:
                    point = {
                        k: ball_position[k] + ball_velocity[k] * t for k in ball_velocity.keys()
                    }
                    if (-half_cube_size <= point['x'] <= half_cube_size and
                            -half_cube_size <= point['y'] <= half_cube_size and
                            -half_cube_size <= point['z'] <= half_cube_size):
                        min_t = t
                        intersection_point = point

        # Check all 6 faces
        check_face('x', 1, half_cube_size)  # Right face
        check_face('x', -1, -half_cube_size)  # Left face
        check_face('y', 1, half_cube_size)  # Top face
        check_face('y', -1, -half_cube_size)  # Bottom face
        check_face('z', 1, half_cube_size)  # Front face
        check_face('z', -1, -half_cube_size)  # Back face

        if intersection_point:
            self.collision_marker_position = intersection_point

    def calculate_direction(self, player_turn, current_face, current_face2, aiming_angle):
        direction = {'x': 0, 'y': 0, 'z': 0}
        face = current_face2 if player_turn else current_face
        if face == 0:  # Front
            direction['x'] = math.sin(aiming_angle)
            direction['z'] = -math.cos(aiming_angle)
        elif face == 1:  # Back
            direction['x'] = math.sin(aiming_angle)
            direction['z'] = math.cos(aiming_angle)
        elif face == 2:  # Left
            direction['x'] = math.cos(aiming_angle)
            direction['z'] = math.sin(aiming_angle)
        elif face == 3:  # Right
            direction['x'] = -math.cos(aiming_angle)
            direction['z'] = math.sin(aiming_angle)
        elif face == 4:  # Top
            direction['x'] = math.sin(aiming_angle)
            direction['y'] = -math.cos(aiming_angle)
        elif face == 5:  # Bottom
            direction['x'] = math.sin(aiming_angle)
            direction['y'] = math.cos(aiming_angle)
        return direction

    def vector_length(self, vector):
        return (vector['x']**2 + vector['y']**2 + vector['z']**2) ** 0.5

    def update_aiming_line(self):
        pass

    def game_loop(self):
        # Implement the main game loop logic
        pass

    def update_ai(self):
        # Implement the logic to update the AI player
        pass
    

    def send_game_state(self):
        for self.client, client in PongConsumer.clients.items():
            game_state_message = {
                'type': 'game_state'
            }

            if self.client== 'player1':
                game_state_message['player1'] = {
                    'x': self.game_state['player1']['x'],
                    'y': self.game_state['player1']['y'],
                    'z': self.game_state['player1']['z'],
                    'rotation': self.game_state['player1']['rotation']
                }
            else:
                game_state_message['player2'] = {
                    'x': self.game_state['player2']['x'],
                    'y': self.game_state['player2']['y'],
                    'z': self.game_state['player2']['z'],
                    'rotation': self.game_state['player2']['rotation']
                }

            game_state_message.update({
                'ball': self.game_state['ball'],
                'ballSpeed': self.game_state['ballSpeed'],
                'playerTurn': self.game_state['playerTurn'],
                'playerScore': self.game_state['playerScore'],
                'aiScore': self.game_state['aiScore'],
                'ballIsHeld': self.game_state['ballIsHeld'],
                'current_face': self.game_state['current_face'],
                'current_face2': self.game_state['current_face2'],
                'aiming_angle': self.game_state['aiming_angle'],
                'reset_ball': self.game_state['reset_ball']
            })

            client.send(json.dumps(game_state_message))

    def game_update(self, data):

        if self.client == 'player1':
            self.game_state['player1'] = data['player1']
        else:
            self.game_state['player2'] = data['player2']
        self.game_state['playerTurn'] = data['playerTurn']
        self.game_state['playerScore'] = data['playerScore']
        self.game_state['aiScore'] = data['aiScore']
        self.game_state['ballIsHeld'] = data['ballIsHeld']
        self.game_state['current_face'] = data.get('current_face', self.game_state['current_face'])
        self.game_state['current_face2'] = data.get('current_face2', self.game_state['current_face2'])
        self.game_state['aiming_angle'] = data.get('aiming_angle', self.game_state['aiming_angle'])
        self.game_state['reset_ball'] = data.get('reset_ball', self.game_state['reset_ball'])

        #self.send_game_state()