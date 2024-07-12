from django.db import models
from django.contrib.auth.models import User, AbstractBaseUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Sum, Window, F
from django.db.models.functions import DenseRank, Coalesce
import pprint
from django.dispatch import receiver
from django.db.models.signals import post_save
from django.http import JsonResponse


class UserManager(models.Manager):

    def get_user_rankings(self):
        return (
            self.annotate(
                total_score=Coalesce(Sum("participation__score"), 0),
                rank=Window(expression=DenseRank(), order_by=F("total_score").desc()),
            )
            .order_by("-total_score")
            .values_list("id", "username", "total_score", "rank")
        )

    def get_user_ranking(self, user_id):
        rankings = list(self.get_user_rankings())
        for user in rankings:
            if user[0] == user_id:
                return {
                    "rank": user[3],
                    "user_id": user[0],
                    "username": user[1],
                    "total_score": user[2],
                }
        return {"error": "User not found"}

    def get_by_natural_key(self, username):
        return self.get(username=username)


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, "userprofile"):
        instance.userprofile.save()


class UserProfile(models.Model):

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    id42 = models.IntegerField(null=True)
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    oauth_id = models.CharField(max_length=200, null=True, blank=True)
    picture_url = models.URLField(max_length=200, null=True, blank=True)
    last_login = models.DateTimeField(auto_now=True)
    last_activity = models.DateTimeField(auto_now=True)
    access_token = models.CharField(max_length=200, null=True, blank=True)
    friends = models.ManyToManyField(User, related_name="userprofiles")

    def delete(self, *args, **kwargs):
        self.avatar.delete(save=False)
        super(UserProfile, self).delete(*args, **kwargs)


User.add_to_class("rankings", UserManager())


class Tournament(models.Model):

    # This could be the ID for the tournament provided
    game_id = models.AutoField(primary_key=True)
    # If this is created at the beginning, the start_date is now
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField()
    # local = true, remote = false
    mode_is_local = models.BooleanField()
    # All the participants in the tournament
    participants = models.ManyToManyField(
        User, through="Participation", related_name="tournaments"
    )
    # Only one winner
    winner = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="winner"
    )


class Participation(models.Model):  # Binds User and Tournament classes

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
    score = models.IntegerField()
    rank = models.IntegerField()


class Round(models.Model):

    game = models.ForeignKey(
        Tournament, related_name="rounds", on_delete=models.CASCADE
    )
    round_number = models.PositiveIntegerField(null=True)
    player1 = models.ForeignKey(
        User, related_name="player1_rounds", on_delete=models.CASCADE
    )
    player2 = models.ForeignKey(
        User, related_name="player2_rounds", on_delete=models.CASCADE
    )
    winner = models.ForeignKey(
        User, related_name="won_rounds", null=True, on_delete=models.CASCADE
    )
    player1_score = models.PositiveIntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(10)]
    )
    player2_score = models.PositiveIntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(10)]
    )


@receiver(post_save, sender=UserProfile)
@receiver(post_save, sender=Participation)
@receiver(post_save, sender=Tournament)
def update_rankings(sender, **kwargs):
    User.rankings.get_user_rankings()
