# oauth42/views.py

import json
import os
import pprint

import requests
from django import forms
from django.conf import settings
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.core import serializers
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import transaction
from django.db.models import F, Sum
from django.http import HttpResponseForbidden, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.generic.edit import CreateView
from PIL import Image

from .forms import RegistrationForm, UserForm
from .middleware import is_user_online
from .models import Participation, Round, Tournament, UserManager, UserProfile

# CLIENT_ID = "u-s4t2ud-9e96f9ff721ed4a4fdfde4cd65bdccc71959f355f62c3a5079caa896688bffe8"
# CLIENT_SECRET = "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"\


# return Response(response.json(), status=response.status_code)

@csrf_exempt
def save_avatar_from_url(user_profile, url):
    response = requests.get(url)

    if response.status_code == 200 and "image" in response.headers["Content-Type"]:
        image_content = ContentFile(response.content)
        filename = url.split("/")[-1]
        print(f"save_avatar_from_url({user_profile}, {url})")

        if user_profile.avatar and filename in user_profile.avatar.name:
            pass
        else:
            user_profile.avatar.save(filename, image_content)
            user_profile.save()


def home(request):
    if request.user.is_authenticated:
        return render(request, "oauth42/home.html", {"user": request.user})
    return render(request, "oauth42/home.html")

@csrf_exempt
def logout_user(request):
    if request.method == "POST":
        user_id = request.POST.get("user_id")
        user_id = int(user_id) if user_id and user_id.isdigit() else 0
        user = request.user
        print(f"--> user_id: '{user_id}")

        if user.is_authenticated and user.id == user_id:
            logout(request)
            request.session.flush()
            return JsonResponse({"status": "success", "message": "User logged out."})
        else:
            return JsonResponse({"status": "error", "message": "No user logged in who could get logged out."})

    return JsonResponse({"status":"error", "message":"Method not allowed"})


def delete_cookie(request):
    if request.method == "POST":
        logout(request)
        request.session.flush()
        response = redirect("/")
        response.delete_cookie(settings.SESSION_COOKIE_NAME)
        return response


def is_valid_image(image):
    try:
        img = Image.open(image)
        img.verify()
        return True
    except (IOError, SyntaxError):
        return False

@csrf_exempt
def upload_avatar(request, user_id):
    if request.method == "POST":
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return JsonResponse({"status": "error", "message": "User not found"})
        user_profile, created = UserProfile.objects.get_or_create(user=user)
        avatar = request.FILES.get("image")
        is_valid = is_valid_image(avatar)

        if avatar and is_valid:
            user_profile.avatar = avatar
            user_profile.save()
            return {
                "status": "success",
                "message": "Avatar uploaded successfully",
                "avatar": user_profile.avatar,
            }
        else:
            return {
                "status": "error",
                "message": "No valid uploaded avatar image found",
            }
    else:
        return {"status": "error", "message": "Method not allowed"}


def delete_avatar(request, user_id):
    try:
        user = User.objects.get(pk=user_id)
        user_profile = UserProfile.objects.get(user=user)
    except User.DoesNotExist:
        return JsonResponse(
            {"status": "error", "message": "User not found", "404_user_id": user_id}
        )
    except UserProfile.DoesNotExist:
        return JsonResponse(
            {
                "status": "error",
                "message": "User not found",
                "404_userprofile_id": user_id,
            }
        )

    if user_profile.avatar:
        user_profile.avatar.delete()  # This deletes the file and clears the field
        user_profile.save()
        return {"status": "info", "message": "Avatar deleted successfully."}
    else:
        return {"status": "info", "message": "No avatar to delete."}

@csrf_exempt
def update_avatar(request, user_id):
    try:
        user = User.objects.get(pk=user_id)
        user_profile = UserProfile.objects.get(user=user)
    except User.DoesNotExist:
        return JsonResponse(
            {"status": "error", "message": "User not found", "404_user_id": user_id}
        )
    except UserProfile.DoesNotExist:
        return JsonResponse(
            {
                "status": "error",
                "message": "User not found",
                "404_userprofile_id": user_id,
            }
        )

    if request.method == "POST":
        new_avatar = request.FILES.get("image")
        is_valid = is_valid_image(new_avatar)

        if new_avatar and is_valid:
            user_profile.avatar.delete(save=False)
            user_profile.avatar = new_avatar
            user_profile.save()
            response_message = f"Avatar successfully updated to {new_avatar}".strip()
            return {"status": "success", "message": response_message}
        else:
            return {
                "status": "error",
                "message": "No valid uploaded avatar image for update found",
            }
    else:
        return {"status": "error", "message": "Method not allowed"}

@csrf_exempt
def register(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        image = request.FILES.get("image")

        if User.objects.filter(username=username).exists():
            return JsonResponse(
                {"status": "error", "message": "Username already exists"}, status=200
            )

        if not all([username]):
            return JsonResponse(
                {"status": "error", "message": "Missing required fields"}, status=200
            )

        user = User.objects.create(
            username=username,
            password=make_password(password),
        )
        response_data = {
            "status": "success",
            "message": "User created successfully.",
            "user_id": user.id,
            "username": user.username,
            "provided_password": bool(password),
            "provided_avatar": bool(image),
        }

        if image:
            avatar_status = upload_avatar(request, user.id)
            response_data.update(avatar_status)

        login(request, user)
        return JsonResponse(response_data, status=201)

    # return render(request, "register.html")
    return JsonResponse(
        {"status": "error", "message": "Method not allowed"}, status=405
    )


# Only for user.id creation with username.
def just_username_login(request):
    if request.method == "POST":
        username = request.POST.get("username")
        image = request.FILES.get("image")

        if User.objects.filter(username=username).exists():
            return JsonResponse(
                {"status": "error", "message": "Username already exists"}, status=200
            )

        if not all([username]):
            return JsonResponse(
                {"status": "error", "message": "Missing required fields"}, status=200
            )

        user = User.objects.create(
            username=username,
        )
        response_data = {
            "status": "success",
            "message": "User created successfully ONLY USERNAME.",
            "user_id": user.id,
        }

        if image:
            avatar_status = upload_avatar(request, user.id)
            response_data.update(avatar_status)

        login(request, user)
        return JsonResponse(response_data, status=201)

    return JsonResponse(
        {"status": "error", "message": "Method not allowed"}, status=405
    )


def rankings(request):
    rankings_qs = User.rankings.get_user_rankings()
    rankings = list(
        rankings_qs.values("id", "username", "total_score", "rank", "avatar")
    )
    if not rankings:
        return JsonResponse(
            {
                "status": "error",
                "message": "No ranking. Possbility no users in database?",
            }
        )
    return JsonResponse({"status": "info", "rankings": rankings})

@csrf_exempt
@login_required
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
                {
                    "status": "error",
                    "message": "Username already exists, please chose another one",
                },
            )

        if not any([username, password, image]):
            return JsonResponse(
                {"status": "error", "message": "No field updated"}, status=400
            )

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

        response_data = {
            "status": "success",
            "message": "User updated successfully.",
            "user_id": user.id,
        }
        response_data.update(avatar_status)

        return JsonResponse(response_data, status=201)
    else:
        # return render(request, "update.html")
        return JsonResponse({"status": "error", "message": "Method not allowed."})


def get_total_score(user_id):
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return JsonResponse(
            {"status": "error", "message": "User not found", "404_user_id": user_id}
        )

    total_score = Participation.objects.filter(user=user).aggregate(Sum("score"))[
        "score__sum"
    ]
    return total_score or 0


def profile(request, user_id):
    try:
        user = User.objects.get(pk=user_id)
        user_profile = UserProfile.objects.get(user=user)
    except User.DoesNotExist:
        return JsonResponse(
            {"status": "error", "message": "User not found", "404_user_id": user_id}
        )
    except UserProfile.DoesNotExist:
        return JsonResponse(
            {
                "status": "error",
                "message": "Userprofile not found",
                "404_userprofile_id": user_id,
            }
        )
    participations = Participation.objects.filter(user=user)

    total_wins = Tournament.objects.filter(winner=user.id).count()
    total_lost = participations.count() - total_wins
    total_score = get_total_score(user_id)

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
            "winner": tournament.winner.user.username if tournament.winner else None,
            "participants": [
                {
                    "username": p.user.username,
                    "user_id": p.user.id,
                    "rank": p.rank,
                    "score": p.score,
                    "avatar": p.user.player.avatar.name,
                    "online": get_online_status(p.user.id),
                }
                for p in Participation.objects.filter(tournament=tournament)
            ],
        }
        games.append(game)
        tournaments = tournaments + 1

    friends = [
        (
            {
                "username": friend.username,
                "user_id": friend.id,
                "avatar": friend.player.avatar.name,
                "total_score": get_total_score(friend.id),
                "online": get_online_status(friend.id),
            }
        )
        for friend in user.player.friends.all()
    ]
    if request.user.is_authenticated and hasattr(request.user, "player"):
        requesting_user_friends_ids = [
            friend.id for friend in request.user.player.friends.all()
        ]
    else:
        requesting_user_friends_ids = []

    player_data = {
        "user_id": user.id,
        "nickname": user.username,
        "joined": user.date_joined,
        "total_wins": total_wins,
        "total_lost": total_lost,
        "total_score": total_score,
        "tournaments": tournaments,
        "avatar": user_profile.avatar.name,
    }
    if request.user.is_authenticated:
        player_data["games"] = games
        player_data["last_login"] = user.last_login
        player_data["rank"] = User.rankings.get_user_ranking(user.id)
        player_data["total_users"] = User.objects.count()
    if request.user.is_authenticated and request.user.id == user.id:
        player_data["friends"] = friends

    return JsonResponse({"status": "info", "player_data": player_data})


def who_am_i(request):
    if not request.user.is_authenticated:
        return JsonResponse({"status": "error", "message": "User is not logged in."})
    if request.user.is_authenticated:
        return JsonResponse(
            {
                "status": "success",
                "message": "User is logged in.",
                "user_id": request.user.id,
            }
        )
    return JsonResponse(
        {
            "status": "error",
            "message": "View can't handle this. This error should not happen.",
        }
    )


@csrf_exempt
def regular_login(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse(
                {"status": "success", "message": "Login successful", "user_id": user.id}
            )
        else:
            return JsonResponse(
                {"status": "error", "message": "Invalid username or password."}
            )

    else:
        # return render(request, "login.html")
        return JsonResponse({"status": "success", "message": "Wrong method"})


@login_required
def delete_profile(request):
    user = request.user
    user.delete()
    messages.success(request, "Your profile has been deleted.")
    return redirect("home")


@csrf_exempt
@login_required
def add_friend(request):
    if request.method == "POST":
        user_id = request.headers.get("friend")
        try:
            user_id = int(user_id)
            friend = User.objects.get(id=user_id)
        except ValueError:
            return JsonResponse(
                {"status": "error", "message": "Invalid user ID."},
                status=200,
            )
        except User.DoesNotExist:
            return JsonResponse(
                {"status": "error", "message": "User not found."},
                status=200,
            )
        except:
            return JsonResponse(
                {"status": "other error"},
                status=200,
            )
        if friend.id == request.user.id:
            return JsonResponse(
                {"status": "info", "message": "You cannot add yourself."}
            )
        user_profile = request.user.player
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
        return JsonResponse({"status": "error", "message": "Method not valid"})


@csrf_exempt
@login_required
def add_friend_view(request, user_id):
    return render(request, "add-friend.html", {"user_id": user_id})


@csrf_exempt
@login_required
def remove_friend(request):
    if request.method == "POST":
        user_id = request.headers.get("friend")
        try:
            user_id = int(user_id)
            friend = User.objects.get(id=user_id)
        except ValueError:
            return JsonResponse(
                {"status": "error", "message": "Invalid user ID."},
                status=200,
            )
        except User.DoesNotExist:
            return JsonResponse(
                {"status": "error", "message": "User not found."},
                status=200,
            )
        except:
            return JsonResponse(
                {
                    "status": "error",
                    "message": "Database error. This should not happen.",
                },
                status=200,
            )
        user_profile = request.user.player
        if friend in user_profile.friends.all():
            user_profile.friends.remove(friend)
            user_profile.save()
            return JsonResponse(
                {"status": "success", "message": "Friend removed successfully."}
            )
        return JsonResponse(
            {"status": "info", "message": "This user was not your friend."}
        )
    return JsonResponse({"status": "error", "message": "Method not valid"})


@csrf_exempt
@login_required
def remove_friend_view(request, user_id):
    return render(request, "remove-friend.html", {"user_id": user_id})


def get_online_users():
    five_minutes_ago = timezone.now() - timezone.timedelta(minutes=5)
    online_user_profiles = (
        UserProfile.objects.filter(last_activity__gte=five_minutes_ago)
        .annotate(
            username=F("user__username"),
        )
        .values("username", "user_id", "avatar", "last_login", "last_activity")
    )
    return online_user_profiles


@login_required
def online_users_view(request):

    online_user_profiles_list = list(get_online_users())
    return JsonResponse(
        {"status": "info", "online_user_profiles": online_user_profiles_list},
        safe=False,
    )


def get_online_status(user_id):
    online_users = get_online_users()
    for user in online_users:
        if user["user_id"] == user_id:
            return True
    return False
