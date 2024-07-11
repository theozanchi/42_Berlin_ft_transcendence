# oauth42/views.py

from .models import UserProfile, Round, Tournament, Participation
from django.shortcuts import render, redirect, get_object_or_404
from django.conf import settings
from django.contrib import messages
from django.contrib.auth import login, logout, update_session_auth_hash, authenticate
from django.contrib.auth.models import User
from django.http import JsonResponse
import requests

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
from django.core.files.storage import default_storage
from django.utils import timezone
from .middleware import is_user_online
from django.core import serializers
import json
from django.contrib.auth.hashers import make_password
from django.views.decorators.csrf import csrf_exempt
import os

# CLIENT_ID = "u-s4t2ud-9e96f9ff721ed4a4fdfde4cd65bdccc71959f355f62c3a5079caa896688bffe8"
# CLIENT_SECRET = "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"\


# return Response(response.json(), status=response.status_code)


def save_avatar_from_url(user_profile, url):
    response = requests.get(url)

    if response.status_code == 200 and "image" in response.headers["Content-Type"]:
        image_content = ContentFile(response.content)
        filename = url.split("/")[-1]

        if user_profile.avatar and filename in user_profile.avatar.name:
            pass
        else:
            user_profile.avatar.save(filename, image_content)
            user_profile.save()


def home(request):
    if request.user.is_authenticated:
        return render(request, "oauth42/home.html", {"user": request.user})
    return render(request, "oauth42/home.html")


def delete_cookie(request):
    if request.method == "POST":
        logout(request)
        request.session.flush()
        response = redirect("/")
        response.delete_cookie(settings.SESSION_COOKIE_NAME)
        return response


def upload_avatar(request, user_id):
    user = get_object_or_404(User, pk=user_id)
    user_profile, created = UserProfile.objects.get_or_create(user=user)
    if request.method == "POST":
        avatar = request.FILES.get("image")
        if avatar:
            user_profile.avatar = avatar
            user_profile.save()
            return {"avatar_status": "Avatar uploaded successfully"}
        else:
            return {"avatar_status": "No uploaded avatar found"}
    else:
        return {"avatar_status": "Method not allowed"}


def delete_avatar(request, user_id):
    user = get_object_or_404(User, pk=user_id)
    user_profile = get_object_or_404(UserProfile, user=user)

    if user_profile.avatar:
        user_profile.avatar.delete()  # This deletes the file and clears the field
        user_profile.save()
        return {"avatar_status": "Avatar deleted successfully."}
    else:
        return {"avatar_status": "No avatar to delete."}


def update_avatar(request, user_id):
    user = get_object_or_404(User, pk=user_id)
    user_profile = get_object_or_404(UserProfile, user=user)

    if request.method == "POST":
        new_avatar = request.FILES.get("image")
        if new_avatar:
            user_profile.avatar.delete(save=False)
            user_profile.avatar = new_avatar
            user_profile.save()
            response_message = f"Avatar successfully updated to {new_avatar}".strip()
            return {"avatar_status": response_message}
        else:
            return {"avatar_status": "No uploaded avatar for update found"}
    else:
        return {"avatar_status": "Method not allowed"}


@csrf_exempt
def register(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        image = request.FILES.get("image")

        if User.objects.filter(username=username).exists():
            return JsonResponse({"error": "Username already exists"}, status=400)

        if not all([username, password]):
            return JsonResponse({"error": "Missing required fields"}, status=400)

        user = User.objects.create(
            username=username,
            password=make_password(password),
        )
        response_data = {"message": "User created successfully.", "user_id": user.id}

        if image:
            avatar_status = upload_avatar(request, user.id)
            response_data.update(avatar_status)

        login(request, user)
        return JsonResponse(response_data, status=201)

    # return JsonResponse({'error': 'Method not allowed'}, status=405)
    return render(request, "register.html")


def rankings(request):
    rankings_qs = User.rankings.get_user_rankings()
    rankings = list(rankings_qs.values("id", "username", "total_score", "rank"))
    return JsonResponse(rankings, safe=False)


@login_required
@csrf_exempt
def update(request):
    user = request.user
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        image = request.FILES.get("image")

        if (
            username
            and User.objects.exclude(pk=request.user.pk)
            .filter(username=username)
            .exists()
        ):
            return JsonResponse(
                {"error": "Username already exists, please chose another one"},
                status=400,
            )

        if not any([username, password, image]):
            return JsonResponse({"error": "No field updated"}, status=400)

        fields_to_update = {}

        if username:
            fields_to_update["username"] = username
        if password:
            fields_to_update["password"] = make_password(password)

        if fields_to_update:
            for field, value in fields_to_update.items():
                setattr(user, field, value)
            user.save()

        avatar_status = update_avatar(request, user.id)

        response_data = {"message": "User updated successfully.", "user_id": user.id}
        response_data.update(avatar_status)

        return JsonResponse(response_data, status=201)
    else:
        return render(request, "update.html")


def profile(request, user_id):
    user = get_object_or_404(User, id=user_id)
    user_profile = get_object_or_404(UserProfile, user=user)
    participations = Participation.objects.filter(user=user)

    total_wins = Tournament.objects.filter(winner=user).count()
    total_lost = participations.count() - total_wins
    total_score = participations.aggregate(Sum("score"))["score__sum"] or 0

    games = []
    tournaments = 0
    for participation in participations.order_by("-tournament__start_date"):
        tournament = participation.tournament
        game = {
            "game_id": tournament.game_id,
            "start_date": tournament.start_date,
            "end_date": tournament.end_date,
            "own_rank": participation.rank,
            "own_score": participation.score,
            "winner": tournament.winner.username if tournament.winner else None,
            "participants": [
                (p.user.username, p.user.id)
                for p in Participation.objects.filter(tournament=tournament)
            ],
        }
        games.append(game)
        tournaments = tournaments + 1

    friends = [
        (friend.username, friend.id) for friend in user.userprofile.friends.all()
    ]
    if request.user.is_authenticated and hasattr(request.user, "userprofile"):
        requesting_user_friends_ids = [
            friend.id for friend in request.user.userprofile.friends.all()
        ]
    else:
        requesting_user_friends_ids = []

    player_data = {
        "user_id": user.id,
        "nickname": user.username,
        "full_name": user.first_name,
        "joined": user.date_joined,
        "total_wins": total_wins,
        "total_lost": total_lost,
        "total_score": total_score,
        "tournaments": tournaments,
        "requesting_user_friends_ids": requesting_user_friends_ids,
    }
    if request.user.is_authenticated:
        player_data["games"] = games
        player_data["last_login"] = user.last_login
        player_data["rank"] = User.rankings.get_user_ranking(user.id)
        player_data["total_users"] = User.objects.count()
    if request.user.is_authenticated and request.user.id == user.id:
        player_data["friends"] = friends

    return JsonResponse(player_data)


@csrf_exempt
def regular_login(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse({"success": "Login successful"}, status=200)
        else:
            return JsonResponse({"error": "Invalid username or password."}, status=400)

    else:
        # return JsonResponse({'success': 'Login successful'}, status=200);
        return render(request, "login.html")


@login_required
def delete_profile(request):
    user = request.user
    user.delete()
    messages.success(request, "Your profile has been deleted.")
    return redirect("home")

@csrf_exempt
@login_required
def add_friend(request, user_id):
    print(f"friend_id: {user_id}")
    if request.method == "POST":
        print("--> post to add_friend")
        friend = get_object_or_404(User, id=user_id)
        user_profile = request.user.userprofile
        print(f"---")
        pprint.pprint(friend)
        pprint.pprint(user_profile)
        if friend not in user_profile.friends.all():
            user_profile.friends.add(friend)
            user_profile.save()
            return JsonResponse(
                {"status": "success", "message": "Friend added successfully."},
                status=200,
            )
        return JsonResponse(
            {"status": "info", "message": "This user is already your friend."},
            status=200,
        )
    else:
        print("in else")
        return render(request, "add-friend.html", {"user_id": user_id})
    # return JsonResponse({"status": "error", "message": "Method not valid"}, status=400)


@login_required
def remove_friend(request, user_id):
    if request.method == "POST":
        friend = get_object_or_404(User, id=user_id)
        user_profile = request.user.userprofile
        if friend in user_profile.friends.all():
            user_profile.friends.remove(friend)
            user_profile.save()
            return JsonResponse(
                {"status": "success", "message": "Friend removed successfully."}
            )
        return JsonResponse(
            {"status": "info", "message": "This user was not your friend."}
        )
    return render(request, "remove-friend.html")
    # return JsonResponse({"status": "error", "message": "Method not valid"}, status=400)


@login_required
def online_users_view(request):
    five_minutes_ago = timezone.now() - timezone.timedelta(minutes=5)
    online_user_profiles = UserProfile.objects.filter(
        last_activity__gte=five_minutes_ago
    ).values("user__username", "user", "avatar", "last_login", "last_activity")
    online_user_profiles_list = list(online_user_profiles)
    pprint.pprint(online_user_profiles)
    return JsonResponse({"online_user_profiles": online_user_profiles_list}, safe=False)
