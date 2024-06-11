import json
from channels.generic.websocket import WebsocketConsumer

class game_logicConsumer(WebsocketConsumer):
	def connect(self):
		self.accept()

		self.send(text_data=json.dumps({
			'type':'conection_established',
			'message':'You are now conected!'
		}))

	def receive(self, text_data):
		text_data_json = json.loads(text_data)
		message = text_data_json['message']

		print('Message:', message)