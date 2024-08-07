from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase
from django.urls import reverse
from django.utils import timezone

from .models import UserManager, UserProfile


class RegisterViewTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.register_url = reverse("register")
        self.home_url = reverse("home")

    def test_register_and_home_view(self):
        # Create a new user via the register view
        with open("/app/oauth42/templates/testfiles/dog-img.jpg", "rb") as img:
            avatar = SimpleUploadedFile(img.name, img.read())
            response = self.client.post(
                self.register_url,
                {
                    "username": "testuser10",
                    "email": "testuser10@example.com",
                    "password1": "testpassword10",
                    "password2": "testpassword10",
                    "avatar": avatar,
                },
            )

        # Check that the user was created
        User = get_user_model()
        self.assertEqual(User.objects.count(), 1)
        user = User.objects.first()
        self.assertEqual(user.username, "testuser10")
        self.assertEqual(user.email, "testuser10@example.com")

        # Check that the UserProfile was created
        self.assertEqual(UserProfile.objects.count(), 1)
        profile = UserProfile.objects.first()
        self.assertEqual(profile.user, user)
        self.assertIsNotNone(profile.avatar)

        # Call the home view
        response = self.client.get(self.home_url)

        # Check the username and avatar in the home view
        self.assertContains(response, "testuser10")
        self.assertContains(response, profile.avatar.url)


from .models import Participation, Tournament, User


class RankingTest(TestCase):
    def setUp(self):
        # Create a tournament
        self.tournament = Tournament.objects.create(
            end_date=timezone.now(), mode_is_local=True
        )

        # Create 5 users with different scores
        self.users = [
            User.objects.create_user(username=f"user{i}", password="123")
            for i in range(5)
        ]
        self.scores = [100, 200, 50, 300, 150]
        self.ranks = [5, 4, 1, 3, 2]
        for user, score, rank in zip(self.users, self.scores, self.ranks):
            Participation.objects.create(
                user=user, tournament=self.tournament, score=score, rank=rank
            )

    def test_ranking(self):
        ranking = User.rankings.get_user_rankings()
        # Get the User objects for each ID in the ranking
        users = [User.objects.get(id=id) for id, rank in ranking]
        # Get the usernames
        usernames = [user.username for user in users]

        # Check that the ranking is in the correct order
        self.assertEqual(
            usernames,
            [
                self.users[3].username,
                self.users[1].username,
                self.users[4].username,
                self.users[0].username,
                self.users[2].username,
            ],
        )

        self.users.append(User.objects.create_user(username="user5", password="123"))
        self.scores.append(400)
        self.ranks.append(6)
        Participation.objects.create(
            user=self.users[-1],
            tournament=self.tournament,
            score=self.scores[-1],
            rank=self.ranks[-1],
        )

        ranking = User.rankings.get_user_rankings()
        # Get the User objects for each ID in the ranking
        users = [User.objects.get(id=id) for id, rank in ranking]
        # Get the usernames
        usernames = [user.username for user in users]

        self.assertEqual(
            usernames,
            [
                self.users[5].username,
                self.users[3].username,
                self.users[1].username,
                self.users[4].username,
                self.users[0].username,
                self.users[2].username,
            ],
        )
