from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Sum, Window, F
from django.db.models.functions import DenseRank
import pprint

class UserManager(models.Manager):
    def get_user_rankings(self):
        return self.annotate(
            total_score=Sum('participation__score'),
            rank=Window(expression=DenseRank(), order_by=F('total_score').desc())
        ).order_by('-total_score').values_list('id','rank')
    def get_user_ranking(self, user_id):
        rankings = list(self.get_user_rankings())
        pprint.pprint(rankings)
        for i, user in enumerate(rankings):
            if user[0] == user_id:
                return (i+1, user[1])
        return None

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    nickname = models.CharField(max_length=50, null=True, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    oauth_id = models.CharField(max_length=200, null=True, blank=True)
    picture_url = models.URLField(max_length=200, null=True, blank=True)
    last_login = models.DateTimeField(auto_now=True)
    access_token = models.CharField(max_length=200, null=True, blank=True)

User.add_to_class('rankings', UserManager())

class Tournament(models.Model):
    # This could be the ID for the tournament provided
    game_id = models.AutoField(primary_key=True)
    # If this is created at the beginning, the start_date is now
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField()
    # local = true, remote = false
    mode_is_local = models.BooleanField()
    # All the participants in the tournament
    participants = models.ManyToManyField(User, through='Participation', related_name='tournaments')
    # Only one winner
    winner = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='winner')

class Participation(models.Model): # Binds User and Tournament classes
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
    score = models.IntegerField()
    rank = models.IntegerField()


class Round(models.Model):
    game = models.ForeignKey(Tournament, related_name='rounds', on_delete=models.CASCADE)
    round_number = models.PositiveIntegerField(null=True)
    player1 = models.ForeignKey(User, related_name='player1_rounds', on_delete=models.CASCADE)
    player2 = models.ForeignKey(User, related_name='player2_rounds', on_delete=models.CASCADE)
    winner = models.ForeignKey(User, related_name='won_rounds', null=True, on_delete=models.CASCADE)
    player1_score = models.PositiveIntegerField(default = 0, validators=[MinValueValidator(0), MaxValueValidator(10)])
    player2_score = models.PositiveIntegerField(default = 0, validators=[MinValueValidator(0), MaxValueValidator(10)])


"""
def get_user_participations(user):
    participations = Participation.objects.filter(user=user)
    return participations

def get_user_tournaments(user):
    participations = get_user_participations(user)
    tournaments = [participation.tournament for participation in participations]
    return tournaments

def get_user_total_score(user):
    participations = get_user_participations(user)
    total_score = sum(participation.score for participation in participations)
    return total_score """