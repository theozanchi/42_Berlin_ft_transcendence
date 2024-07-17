import asyncio
import json
import logging

import requests
from channels.generic.websocket import AsyncJsonWebsocketConsumer

logging.basicConfig(
    level=logging.ERROR, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

GAME_MANAGER_REST_URL = "http://game_manager:8000"
GAME_LOGIC_REST_URL = "http://game_logic:8000"


class APIConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        self.game_id = None
        self.host = False
        self.alias = None
        self.mode = None
        self.player_id = None
        self.last_sent_state = None
        self.lock = asyncio.Lock()
        self.csrftoken = self.extract_csrftoken()
        if self.csrftoken is None:
            return
        await self.accept()

    def extract_csrftoken(self):
        """
        Extracts the csrftoken from the cookie header in the raw headers.
        """
        for key, value in self.scope["headers"]:
            if key.decode("utf-8") == "cookie":
                cookies = value.decode("utf-8").split("; ")
                for cookie in cookies:
                    if cookie.startswith("csrftoken="):
                        token = cookie.split("=")[1]
                        # ISSUE validate token with authentication server
                        return token
        return None  # Return None if csrftoken is not found or not validated

    #  TO DO : the whole routine of somebody leaving should only occur if tournament is not over, if not we just let clients disconnect
    async def disconnect(self, close_code):
        if self.game_id:
            content = {
                "game-id": self.game_id,
                "alias": self.alias,
                "channel_name": self.channel_name,
            }
            logging.debug("Player left: " + str(content))
            response = requests.post(
                GAME_MANAGER_REST_URL + "/player-left/",
                json=content,
                headers=self.get_headers(),
            )
            response.raise_for_status()
            await self.channel_layer.group_send(
                self.game_id, {"type": "broadcast", "content": response.json()}
            )
            await self.channel_layer.group_discard(self.game_id, self.channel_name)
        await self.close(close_code)

    async def receive_json(self, content):
        logging.debug("received: " + str(content))
        type_to_method = {
            "broadcast": self.broadcast,
            "game-state": self.game_state,
            "create-game": self.create_game,
            "join-game": self.join_game,
            "start-game": self.start_game,
            "set-alias": self.set_alias,
        }

        method = type_to_method.get(content.get("type"))

        if method:
            await method(content)
        else:
            await self.send_json({"error": 'Invalid "type" or missing "type" in json'})

    def get_headers(self):
        return {k.decode("utf-8"): v.decode("utf-8") for k, v in self.scope["headers"]}

    async def broadcast(self, content):
        logging.debug("broadcasting: " + str(content))
        await self.send_json(content)

    async def keep_alive(self, content):
        await self.send_json({"type": "keep-alive"})

    # TO DO: if local game, start it immediately
    async def create_game(self, content):
        try:
            content["channel_name"] = self.channel_name
            self.alias = content.get("players")[0]

            # Update players with alias and channel name
            players = content.get("players", [])
            updated_players = [
                {"alias": player, "channel_name": self.channel_name}
                for player in players
            ]
            content["players"] = updated_players

            player_ids = content.get("user_ids", [])
            updated_ids = [
                {"alias": user.alias, "user_id": user.user_id} for user in player_ids
            ]
            content["ids"] = updated_ids

            response = requests.post(
                GAME_MANAGER_REST_URL + "/create-game/",
                json=content,
                headers=self.get_headers(),
            )
            response.raise_for_status()
            self.game_id = response.json().get("game_id")
            self.mode = response.json().get("mode")
            self.host = True
            if self.game_id:
                await self.channel_layer.group_add(self.game_id, self.channel_name)
            data = response.json()
            data["type"] = "create-game"

            """             players_in_game = Player.object.filter(game__id=self.game_id).select_related('user')
            players_info = [{"username": player.user.username, "user.id": player.user.id} for player in players_in_game]
            data['test'] = players_info """

            await self.send_json(data)

        except requests.RequestException as e:
            await self.send_json({"error": str(e)})

    async def join_game(self, content):
        try:
            content["channel_name"] = self.channel_name
            self.alias = content.get("players")[0]

            # Update players with alias and channel name
            players = content.get("players", [])
            updated_players = [
                {"alias": player, "channel_name": self.channel_name}
                for player in players
            ]
            content["players"] = updated_players

            response = requests.post(
                GAME_MANAGER_REST_URL + "/join-game/",
                json=content,
                headers=self.get_headers(),
            )
            if response.status_code == 404:
                self.game_id = content.get("game_id")
                raise ValueError(f"{self.game_id} not found.")
            response.raise_for_status()
            self.game_id = response.json().get("game_id")
            self.mode = "remote"

            await self.channel_layer.group_add(self.game_id, self.channel_name)
            await self.channel_layer.group_send(
                self.game_id, {"type": "broadcast", "content": response.json()}
            )

        except requests.RequestException as e:
            await self.send_json({"error": str(e)})
            await self.close()
        except ValueError as e:
            await self.send_json({"error": str(e)})
            await self.close()

    async def start_game(self, content):
        if self.host is not True:
            await self.send_json({"error": "Only host can start game"})
        try:
            content = {"game-id": self.game_id}
            response = requests.post(
                GAME_MANAGER_REST_URL + "/round/",
                json=content,
                headers=self.get_headers(),
            )
            response.raise_for_status()

            round_info = None
            for round_data in response.json():
                if round_data.get("status") == "pending":
                    round_info = round_data
                    break

            # Send round info to all players
            await self.channel_layer.group_send(
                self.game_id, {"type": "broadcast", "content": response.json()}
            )
            if round_info is not None:
                # Send player id to pther players
                await self.channel_layer.group_send(
                    self.game_id, {"type": "get_player_id", "content": round_info}
                )

        except requests.RequestException as e:
            await self.send_json({"error": str(e)})
            await self.send_json({"error": str(e)})

    async def get_player_id(self, content):
        data = content.get("content")
        self.round_number = data.get("round_number")
        if self.mode == "remote":
            player1_channel = data.get("player1_channel_name")
            player2_channel = data.get("player2_channel_name")

            if player1_channel == self.channel_name:
                self.player_id = "player1"
            elif player2_channel == self.channel_name:
                self.player_id = "player2"
            else:
                self.player_id = "spectator"
        else:
            self.player_id = None
        await self.send_json(
            {
                "type": "start-game",
                "mode": self.mode,
                "player_id": self.player_id,
                "alias": self.alias,
                "round_number": self.round_number,
            }
        )

    async def game_state(self, content):
        if content == self.last_sent_state:
            return

        self.last_sent_state = content
        if self.player_id != "player1" and self.player_id != "player2":
            await self.send_json({"error": "Not your turn"})
        try:
            async with self.lock:
                content["game_id"] = self.game_id
                response = requests.post(
                    GAME_LOGIC_REST_URL + "/game-update/",
                    json=content,
                    headers=self.get_headers(),
                )
                response.raise_for_status()

                await self.channel_layer.group_send(
                    self.game_id, {"type": "update", "content": response.json()}
                )
                # await self.send_json({'type': 'update', 'content': content})

        except Exception as e:
            await self.send_json({"error": str(e)})
            logging.error({"error": str(e)})

    async def update(self, content):
        async with self.lock:
            await self.send_json(content)

    async def set_alias(self, content):
        if content.get("alias"):
            self.alias = content.get("alias")
            await self.send_json({"alias": self.alias})
            await self.send_json({"alias": self.alias})
        else:
            await self.send_json({"error": "No alias received"})
