# views.py

from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

from channels.layers import get_channel_layer
from django.core.cache import cache
from asgiref.sync import async_to_sync
import json
import time

@csrf_exempt
@async_to_sync
async def game_update(request):
    if request.method == 'POST':
        channel_layer = get_channel_layer()

        data = json.loads(request.body)

        game_state = data.get('game_state')
        game_id = data.get('game_id')

        if game_state is None:
            game_state = create_new_game_state()

        # process data with logic here

        game_state['type'] = 'game_update'
        cache.set(game_id, game_state, timeout=None)

        await channel_layer.group_send(game_id, game_state)

        return JsonResponse("updated game state", safe=False, status=200)
    else:
        return JsonResponse("Invalid request", safe=False, status=400)

def create_new_game_state():
    return {
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

def update_game_state(game):
    current_time = time.time()
        # Handle ball movement and collision detection server-side
    update_aiming_line()
    if current_time - game.last_update_time >= game.update_interval:
        game.last_update_time = current_time
        if game.game_state['reset_ball'] and not game.game_state['ballIsHeld']:
            game.reset_ball()
        game.update_ball()
    game.update_ai()
    game.send_game_state()

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
