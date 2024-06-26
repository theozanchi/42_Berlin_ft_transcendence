import json
import logging
import math
from channels.generic.websocket import AsyncWebsocketConsumer

logging.basicConfig(level=logging.INFO)

class PongConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.aiming_angle = 0  # Initialize aiming_angle
        self.aimingSpeed = 0.05  # Example speed value, adjust as needed
        self.maxaiming_angle = 1.57  # Example max angle value (90 degrees in radians)
        self.minaiming_angle = -1.57 
        self.cube_size = 2
        self.ball_radius = 0.05

    game_state = {
        'player1': {'x': 0, 'y': 0, 'z': 1},
        'player2': {'x': 0, 'y': 0, 'z': -1},
        'ball': {'x': 0, 'y': 0, 'z': 0},
        'ballSpeed': {'x': 0, 'y': 0, 'z': 0},
        'playerTurn': True,  # Initial value, assuming player 1 starts
        'playerScore': 0,
        'aiScore': 0,
        'ballIsHeld': True,  # Initial value, assuming ball is held initially
        'current_face': 0,  # Adding initial value for current face
        'current_face2': 0,
        'wall_hits': 0,
        'aiming_angle': 0
    }

    async def connect(self):
        self.game_id = self.scope['url_route']['kwargs']['game_id']

        await self.channel_layer.group_add(
            self.game_id,
            self.channel_name
        )

        await self.accept()
        await self.reset_ball()
        await self.send_game_state()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.game_id,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data['type'] == 'player_move':
            await self.handle_player_move(data)
        elif data['type'] == 'update_state':
            await self.update_game_state(data)
        elif data['type'] == 'game_state':
            #await self.update_game_state_from_data(data)
            await self.update_game_state(data)

    async def handle_player_move(self, data):
        # Update player positions based on client input
        self.game_state['player1'] = data['player1']
        self.game_state['player2'] = data['player2']
        self.game_state['current_face'] = data.get('current_face', self.game_state['current_face'])
        self.game_state['current_face2'] = data.get('current_face2', self.game_state['current_face2'])
        # Broadcast the updated game state
        await self.send_game_state()

    async def update_game_state(self, data):
        print("GAME LOGIC: received update")
        # Handle ball movement and collision detection server-side
        await self.game_update(data)
        self.update_aiming_line()
        self.update_ball()
        self.update_ai()
        await self.send_game_state()

    async def update_ball(self):
        if self.game_state['ballIsHeld']:
            # Place the ball at the player's position
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
            self.game_state['playerTurn'] = not self.game_state['playerTurn']
            self.game_state['wall_hits'] = 0
            self.game_state['ballIsHeld'] = True
            self.update_score()
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
        center = {
            'x': (start['x'] + end['x']) / 2,
            'y': (start['y'] + end['y']) / 2,
            'z': (start['z'] + end['z']) / 2
        }
        size = {
            'x': abs(end['x'] - start['x']) + self.ball_radius * 2,
            'y': abs(end['y'] - start['y']) + self.ball_radius * 2,
            'z': abs(end['z'] - start['z']) + self.ball_radius * 2
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
    
    def update_score(self):
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
    
    async def reset_ball(self):
        offset_distance = 10  # Adjust as needed

        if self.game_state['ballIsHeld']:
            # Place the ball at the player's position
            if self.game_state['playerTurn']:
                self.game_state['ball'] = self.game_state['player1'].copy()
            else:
                self.game_state['ball'] = self.game_state['player2'].copy()
            self.update_aiming_line()
        else:
            # Determine player position
            if self.game_state['playerTurn']:
                player_position = self.game_state['player1']
            else:
                player_position = self.game_state['player2']

            # Calculate the direction based on the current face and aiming angle
            direction = self.calculate_direction(
                self.game_state['playerTurn'],
                self.game_state['current_face'],
                self.game_state['current_face2'],
                self.game_state['aiming_angle']
            )

            # Normalize the direction vector
            direction_length = self.vector_length(direction)
            direction = {k: v / direction_length for k, v in direction.items()}

            # Apply the initial velocity to the ball in the direction the player is facing
            initial_velocity_magnitude = 0.02
            ball_speed = {k: v * initial_velocity_magnitude for k, v in direction.items()}
            self.game_state['ballSpeed'] = ball_speed

            # Set the ball's position slightly in front of the player to avoid immediate collision
            ball_start_position = self.clone_and_add(player_position, direction, offset_distance)
            self.game_state['ball'] = ball_start_position
            return 1


    async def update_collision_marker(self):
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
        face = current_face if player_turn else current_face2
        if face == 0:  # Front
            direction['x'] = math.sin(aiming_angle)
            direction['z'] = -math.cos(aiming_angle)
        elif face == 1:  # Back
            direction['x'] = math.sin(aiming_angle)
            direction['z'] = math.cos(aiming_angle)
        elif face == 2:  # Left
            direction['x'] = -math.cos(aiming_angle)
            direction['z'] = math.sin(aiming_angle)
        elif face == 3:  # Right
            direction['x'] = math.cos(aiming_angle)
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

    async def send_game_state(self):
        print("Publishing game state to channel ")
        self.channel_layer.group_send(
        self.game_id,
        {
            'type': 'game_update',
            'player1': self.game_state['player1'],
            'player2': self.game_state['player2'],
            'playerTurn': self.game_state['playerTurn'],
            'playerScore': self.game_state['playerScore'],
            'aiScore': self.game_state['aiScore'],
            'ballIsHeld': self.game_state['ballIsHeld'],
            'current_face': self.game_state['current_face'],
            'current_face2': self.game_state['current_face2'],
            'aiming_angle': self.game_state['aiming_angle']
        }
    )

    async def game_update(self, data):
        # Update game state based on received data
        print("GAME LOGIC: received update from channel layer")
        self.game_state['player1'] = data.get('player1', self.game_state['player1'])
        self.game_state['player2'] = data.get('player2', self.game_state['player2'])
        #self.game_state['ball'] = data.get('ball', self.game_state['ball'])
       # self.game_state['ballSpeed'] = data.get('ballSpeed', self.game_state['ballSpeed'])
        self.game_state['playerTurn'] = data.get('playerTurn', self.game_state['playerTurn'])
        self.game_state['playerScore'] = data.get('playerScore', self.game_state['playerScore'])
        self.game_state['aiScore'] = data.get('aiScore', self.game_state['aiScore'])
        self.game_state['ballIsHeld'] = data.get('ballIsHeld', self.game_state['ballIsHeld'])
        self.game_state['current_face'] = data.get('current_face', self.game_state['current_face'])
        self.game_state['current_face2'] = data.get('current_face2', self.game_state['current_face2'])
        self.game_state['aiming_angle'] = data.get('aiming_angle', self.game_state['aiming_angle'])

    async def update_game_state_from_data(self, data):
        self.game_state['player1'] = data['player1']
        self.game_state['player2'] = data['player2']
        self.game_state['playerTurn'] = data['playerTurn']
        self.game_state['playerScore'] = data['playerScore']
        self.game_state['aiScore'] = data['aiScore']
        self.game_state['ballIsHeld'] = data['ballIsHeld']
        self.game_state['current_face'] = data.get('current_face', self.game_state['current_face'])
        self.game_state['current_face2'] = data.get('current_face2', self.game_state['current_face2'])
        self.game_state['aiming_angle'] = data.get('aiming_angle', self.game_state['aiming_angle'])

        # Broadcast updated game state to the room group
        self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_update',
                'player1': self.game_state['player1'],
                'player2': self.game_state['player2'],
                'playerTurn': self.game_state['playerTurn'],
                'playerScore': self.game_state['playerScore'],
                'aiScore': self.game_state['aiScore'],
                'ballIsHeld': self.game_state['ballIsHeld'],
                'current_face': self.game_state['current_face'],
                'current_face2': self.game_state['current_face2'],
                'aiming_angle': self.game_state['aiming_angle']
            }
        )
