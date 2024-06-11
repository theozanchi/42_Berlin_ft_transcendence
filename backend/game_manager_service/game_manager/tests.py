from django.test import TestCase, Client
from django.urls import reverse
# Create your tests here.

class TestViews(TestCase):

    def setup(self):
        self.client = Client()
        self.username = "test_user_name"

    def test_create_game_POST(self):

        response = self.client.get(reverse('game'))

        self.assertEquals(response.status_code, 200)
