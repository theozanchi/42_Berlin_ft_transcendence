# oauth42/views.py

from .models import UserProfile, Round, Tournament, Participation
from django.shortcuts import render, redirect
from django.conf import settings
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
import requests
from django.utils.crypto import get_random_string
from .models import UserProfile
from django.http import HttpResponseForbidden
from .forms import RegistrationForm
from django.core.files.base import ContentFile
import pprint
from django.db.models import Sum

CLIENT_ID = 'u-s4t2ud-9e96f9ff721ed4a4fdfde4cd65bdccc71959f355f62c3a5079caa896688bffe8'
CLIENT_SECRET = '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'
REDIRECT_URI = 'https://localhost:8443/api/user_mgt/oauth/callback/'


def save_avatar_from_url(user_profile, url):
    response = requests.get(url)

    if response.status_code == 200 and 'image' in response.headers['Content-Type']:
        image_content = ContentFile(response.content)
        filename = url.split("/")[-1]

        if user_profile.avatar and filename in user_profile.avatar.name:
            pass
        else:
            user_profile.avatar.save(filename, image_content)
            user_profile.save()


def home(request):
    if request.user.is_authenticated:
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
        return redirect('/')
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
        return redirect('/')
    access_token = token_json.get('access_token')
    print(f"Access token: {access_token}")
    if not access_token:
        return redirect('/')

    user_info_url = 'https://api.intra.42.fr/v2/me'
    headers = {'Authorization': f'Bearer {access_token}'}
    user_info_response = requests.get(user_info_url, headers=headers)
    if user_info_response.status_code != 200:
        return redirect('/')

    user_info = user_info_response.json()
    email = user_info['email']
    username = user_info['login']
    first_name = user_info['first_name']
    last_name = user_info['last_name']
    picture_url = user_info['image']['versions']['small']

    user, created = User.objects.get_or_create(
        username=username,
        defaults={'email': email,
                  'first_name': first_name,
                  'last_name': last_name })

    user_profile, created = UserProfile.objects.update_or_create(
		user=user,
        defaults={'picture_url': picture_url,
                  'access_token': access_token})

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
        form = RegistrationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect("login")
    else:
        form = RegistrationForm()
    return render(request, "register.html", {"form"})


def profile(request, user_id):
    user = User.objects.get(id = user_id)
    user_profile = UserProfile.objects.get(user=user)
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

    player_data = {
        'nickname': user_profile.nickname,
        'full_name': user.get_full_name(),
        'joined': user.date_joined,
        'total_wins': total_wins,
        'total_lost': total_lost,
        'total_score': total_score,
        'tournaments': tournaments,
        # 'games' : games,
    }
    if request.user.is_authenticated:
        player_data['games'] = games
        player_data['last_login'] = user.last_login
        player_data['rank'] = User.rankings.get_user_ranking(user.id)

    pprint.pprint(player_data)
    return render(request, 'profile.html', {'player_data': player_data})


from django.contrib.auth.views import LoginView

class CustomLoginView(LoginView):
    def get_success_url(self):
        return '/api/user_mgt'