# oauth42/views.py

from .models import UserProfile, Round, Tournament, Participation
from django.shortcuts import render, redirect, get_object_or_404
from django.conf import settings
from django.contrib import messages
from django.contrib.auth import login, logout, update_session_auth_hash
from django.contrib.auth.models import User
from django.contrib.auth.forms import PasswordChangeForm
from django.http import JsonResponse
import requests
from django.utils.crypto import get_random_string
from .models import UserProfile, UserManager
from django.http import HttpResponseForbidden
from .forms import RegistrationForm, UserForm
from django.core.files.base import ContentFile
import pprint
from django.db.models import Sum
from django.views.generic.edit import CreateView
from django import forms
from django.contrib.auth.decorators import login_required
from django.db import transaction

CLIENT_ID = 'u-s4t2ud-9e96f9ff721ed4a4fdfde4cd65bdccc71959f355f62c3a5079caa896688bffe8'
CLIENT_SECRET = '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'
REDIRECT_URI = 'https://localhost:8443/api/user_mgt/oauth/callback/'

    # return Response(response.json(), status=response.status_code)

def save_avatar_from_url(user_profile, url):
    response = requests.get(url)

    if response.status_code == 200 and 'image' in response.headers['Content-Type']:
        image_content = ContentFile(response.content)
        filename = url.split("/")[-1]
        print("--> in save_avatar_from_url")

        if user_profile.avatar and filename in user_profile.avatar.name:
            pass
        else:
            user_profile.avatar.save(filename, image_content)
            user_profile.save()


def home(request):
    if request.user.is_authenticated:
        pprint.pprint(request.user.userprofile.avatar)
        print(f'UserProfile ID in home: {request.user.userprofile.id} : {request.user.userprofile.avatar}')
        return render(request, 'oauth42/home.html', {'user': request.user})
    return render(request, 'oauth42/home.html')


def oauth_login(request):
    state = get_random_string(32)
    request.session['oauth_state'] = state
    authorization_url = (
        f'https://api.intra.42.fr/oauth/authorize?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&state={state}&prompt=login'
    )
    return redirect(authorization_url)

def oauth_callback(request):
    state = request.GET.get('state')
    if state != request.session.pop('oauth_state', ''):
        return redirect('/api/user_mgt')
    code = request.GET.get('code')
    token_url = 'https://api.intra.42.fr/oauth/token'
    token_data = {
        'grant_type': 'authorization_code',
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'code': code,
        'redirect_uri': REDIRECT_URI,
    }
    token_response = requests.post(token_url, data=token_data)
    token_json = token_response.json()
    if token_response.status_code != 200:
        return render(request, "error.html", {"error": "No access token in 42 server response. API credentials might be outdated"})
    access_token = token_json.get('access_token')
    if not access_token:
        return render(request, "error.html", {"error": "Server response does not contain access_token"})

    user_info_url = 'https://api.intra.42.fr/v2/me'
    headers = {'Authorization': f'Bearer {access_token}'}
    user_info_response = requests.get(user_info_url, headers=headers)
    if user_info_response.status_code != 200:
        return redirect('/')

    user_info = user_info_response.json()
    email = user_info.get('email')
    username = user_info.get('login')
    first_name = user_info.get('first_name')
    last_name = user_info.get('last_name')
    picture_url = user_info.get('image', {}).get('versions', {}).get('small')
    id42 = user_info.get('campus_users', [{}])[0].get('user_id')

    try:
        user_profile = UserProfile.objects.get(id42=id42)
        user = user_profile.user
    except UserProfile.DoesNotExist:
        user, created = User.objects.get_or_create(
            username=username,
            defaults={'email': email,
                    'first_name': first_name,
                    'last_name': last_name })

        user_profile, created = UserProfile.objects.update_or_create(
            user=user,
            defaults={'picture_url': picture_url,
                    'access_token': access_token,
                    'id42': id42})

        if created:
            user.set_unusable_password()
            user.save()

        save_avatar_from_url(user.userprofile, picture_url)

    login(request, user)

    return redirect(settings.LOGIN_REDIRECT_URL)


def delete_cookie(request):
	if request.method == 'POST':
		logout(request)
		request.session.flush()
		response = redirect('/')
		response.delete_cookie(settings.SESSION_COOKIE_NAME)
		return response

# email and password registration
def register(request):
    if request.method == "POST":
        form = RegistrationForm(request.POST, request.FILES)
        if form.is_valid():
            user = form.save()
            avatar = form.cleaned_data['avatar']
            profile, created = UserProfile.objects.update_or_create(user=user, defaults={'avatar': avatar})
            print(f'UserProfile ID in register: {profile.id} with {profile.avatar}')
            login(request, user=user)
            return redirect("home")
    else:
        form = RegistrationForm()
    return render(request, "register.html", {"form": form})


def ranking(request):
        rankings = User.rankings.get_user_rankings()
        return render(request, "ranking.html", {"rankings": rankings})

def password(request):
    if not request.user.is_authenticated or request.user.userprofile.id42:
        return HttpResponseForbidden
    if request.method == "POST":
        password_form = PasswordChangeForm(request.user, request.POST)
        if password_form.is_valid():
            user = password_form.save()
            update_session_auth_hash(request, user)
            messages.success(request, 'Password changed')
            return redirect('home')
        else:
            messages.error(request, 'please correct the error')
    else:
        password_form = PasswordChangeForm(request.user)

    return render(request, 'password.html', {'password_form': password_form})

def update(request):
    if request.method == "POST":
        form = UserForm(request.POST, request.FILES, instance=request.user)

        if form.is_valid():
            user = form.save()
            messages.success(request, 'Your profile was successfully updated!')
            return redirect('home')
        else:
            messages.error(request, 'Please correct the error below.')
    else:
        form = UserForm(instance=request.user)

    return render(request, "update.html", {
        "user": request.user,
        'form': form
    })




def profile(request, user_id):
    user = get_object_or_404(User, id=user_id)
    user_profile = get_object_or_404(UserProfile, user=user)
    participations = Participation.objects.filter(user=user)

    total_wins = Tournament.objects.filter(winner=user).count()
    total_lost = participations.count() - total_wins
    total_score = participations.aggregate(Sum('score'))['score__sum'] or 0

    games = []
    tournaments = 0
    for participation in participations.order_by('-tournament__start_date'):
        tournament = participation.tournament
        game = {
            'game_id': tournament.game_id,
            'start_date': tournament.start_date,
            'end_date': tournament.end_date,
            'own_rank': participation.rank,
            'own_score': participation.score,
            'winner': tournament.winner,
            'participants': [(p.user.username, p.user.id) for p in Participation.objects.filter(tournament=tournament)]
        }
        games.append(game)
        tournaments = tournaments + 1

    friends = [(friend.username, friend.id) for friend in user.userprofile.friends.all()]
    if request.user.is_authenticated and hasattr(request.user, 'userprofile'):
        requesting_user_friends_ids = [friend.id for friend in request.user.userprofile.friends.all()]
    else:
        requesting_user_friends_ids = []

    player_data = {
        'user_id': user.id,
        'nickname': user.username,
        'full_name': user.first_name,
        'joined': user.date_joined,
        'total_wins': total_wins,
        'total_lost': total_lost,
        'total_score': total_score,
        'tournaments': tournaments,
        'requesting_user_friends_ids': requesting_user_friends_ids
        # 'games' : games,
    }
    if request.user.is_authenticated:
        player_data['games'] = games
        player_data['last_login'] = user.last_login
        player_data['rank'] = User.rankings.get_user_ranking(user.id)
        player_data['total_users'] = User.objects.count()
    if request.user.is_authenticated and request.user.id == user.id:
        player_data['friends'] = friends

    pprint.pprint(player_data)
    return render(request, 'profile.html', {'user': request.user, 'player_data': player_data})


from django.contrib.auth.views import LoginView

class CustomLoginView(LoginView):
    def get_success_url(self):
        return '/api/user_mgt'


class RegisterView(CreateView):
    model = User
    form_class = RegistrationForm
    template_name = 'register.html'
    success_url = '/api/user_mgt'

    def form_valid(self, form):
        response = super().form_valid(form)
        login(self.request, self.object)
        return response

@login_required
def delete_profile(request):
    user = request.user
    user.delete()
    messages.success(request, 'Your profile has been deleted.')
    return redirect('home')

@login_required
def add_friend(request, user_id):
    friend = get_object_or_404(User, id=user_id)
    user_profile = request.user.userprofile
    if friend not in user_profile.friends.all():
        user_profile.friends.add(friend)
        user_profile.save()
        print("--> user added")
    else:
        messages.info(request, 'This user is already your friend.')
    return redirect('profile', user_profile.user.id)

@login_required
def remove_friend(request, user_id):
    friend = get_object_or_404(User, id=user_id)
    user_profile = request.user.userprofile
    user_profile.friends.remove(friend)
    user_profile.save()
    return redirect('profile', user_profile.user.id)