import re
import bleach

import requests
import logging
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.contrib.sessions.models import Session
from django.core.files.base import ContentFile
from django.db.models import F, Sum
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import redirect
from django.utils import timezone
from django.utils.html import escape
from django.views.decorators.csrf import ensure_csrf_cookie
from PIL import Image

from .middleware import is_user_online
from .models import Participation, Round, Tournament, UserProfile


logger = logging.getLogger(__name__)


def save_avatar_from_url(user_profile, url):
    try:
        response = requests.get(url)
        response.raise_for_status()

        if "image" in response.headers["Content-Type"]:
            image_content = ContentFile(response.content)
            filename = url.split("/")[-1]

            if user_profile.avatar and filename in user_profile.avatar.name:
                pass
            else:
                user_profile.avatar.save(filename, image_content)
                user_profile.save()
        else:
            raise ValueError("The URL does not contain an image.")
    except requests.RequestException as e:
        logging.debug(f"Error fetching image from URL: {e}")
    except ValueError as e:
        logging.debug(f"Error with image content: {e}")
    except Exception as e:
        logging.debug(f"Unexpected error occurred: {e}")


def logout_user(request):
    if request.method == "POST":
        user_id = request.POST.get("user_id")
        user_id = int(user_id) if user_id and user_id.isdigit() else 0
        user = request.user

        if user.is_authenticated and user.id == user_id:
            logout(request)
            request.session.flush()
            return JsonResponse(
                {"status": "success", "message": "User logged out."}, status=200
            )
        else:
            return JsonResponse(
                {
                    "status": "error",
                    "message": "No user logged in who could get logged out.",
                },
                status=200,
            )

    return JsonResponse(
        {"status": "error", "message": "Method not allowed (logout)"}, status=200
    )


def is_valid_image(image):

    try:
        img = Image.open(image)
        img.verify()
        return True
    except (IOError, SyntaxError):
        return False


def upload_avatar(request, user_id):
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return JsonResponse({"status": "error", "message": "User no found"})
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


def delete_avatar(request, user_id):
    try:
        user = User.objects.get(pk=user_id)
        user_profile = UserProfile.objects.get(user=user)
    except User.DoesNotExist:
        return JsonResponse(
            {
                "status": "error",
                "message": "User not found (def delete avatar)",
                "404_user_id": user_id,
            }
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
        user_profile.avatar.delete()
        user_profile.save()
        return {"status": "info", "message": "Avatar deleted successfully."}
    else:
        return {"status": "info", "message": "No avatar to delete."}


def update_avatar(request, user_id):
    try:
        user = User.objects.get(pk=user_id)
        user_profile = UserProfile.objects.get(user=user)
    except User.DoesNotExist:
        return JsonResponse(
            {
                "status": "error",
                "message": "User not found (def update_avatar)",
                "404_user_id": user_id,
            }
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


def sanitize_input(username=None, password=None, image=None, input_check=True):

    errors = []

    sanitized_username = ""
    if username is not None:
        sanitized_username = bleach.clean(username.strip())
        sanitized_username = re.sub(r"[^\w\s-]", "", sanitized_username)
        sanitized_username = escape(sanitized_username)
        if sanitized_username != username:
            errors.append(f"The potentially malicious username is rejected. Use only letters, numbers and dashes. '{username}' vs. '{sanitized_username}'")
        if sanitized_username.lower() == "admin":
            errors.append(f"Username cannot be '{sanitized_username}' ")
        if input_check and len(sanitized_username) > 50:
            errors.append("Username cannot be longer than 50 characters")

    sanitized_password = ""
    if password is not None:
        sanitized_password = bleach.clean(password.strip())
        sanitized_password = re.sub(r"[^\w\s-]", "", sanitized_password)
        sanitized_password = escape(sanitized_password)
        if sanitized_password != password:
            errors.append(f"The potentially malicious password is rejected. Use only letters, numbers and dashes. '{password}' vs. '{sanitized_password}'")
        if input_check and len(sanitized_password) < 8:
            errors.append("Password must be at least 8 characters long")
        if (
            input_check
            and not any(c.isdigit() for c in sanitized_password)
            or not any(c.isalpha() for c in sanitized_password)
        ):
            errors.append("Password must contain at least one letter and one number.")

    if image is not None:
        allowed_types = ["image/jpeg", "image/png"]
        max_file_size = 5 * 1024 * 1024
        if image.content_type not in allowed_types:
            errors.append("Invalid image file type (only jpg and png)")
        if image.size > max_file_size:
            errors.append("Image file size exceeds the limit")
        if not is_valid_image(image):
            errors.append("Image is not a valid image!")

    if errors:
        error_message = " - ".join(errors)
        return error_message, 400
    else:
        return {
            "status": "success",
            "username": sanitized_username,
            "password": sanitized_password,
        }, 200


def register(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        image = request.FILES.get("image")

        sanitized_data, status_code = sanitize_input(username, password, image)
        logger.info(f"Sanitized data status_code: {status_code}")
        if status_code != 200:
            # sanitized_data.pop("image", None)
            return JsonResponse({"status": "error", "message": sanitized_data})
        logger.info(f"Sanitized data: {sanitized_data}")

        username = sanitized_data["username"]
        password = sanitized_data["password"]

        if username == password:
            return JsonResponse(
                {"status": "error", "message": "Username and password cannot be the same."},
                status=200,
            )

        if User.objects.filter(username=username).exists():
            return JsonResponse(
                {"status": "error", "message": "Username already exists"}, status=200
            )

        if not all([username, password]):
            return JsonResponse(
                {"status": "error", "message": "Missing required fields"}, status=200
            )

        user = User.objects.create(
            username=username,
            password=make_password(password),
        )
        user_profile = UserProfile.objects.create(
            user=user,
            alias=username,
            registered=True,
        )
        response_data = {
            "status": "success",
            "message": f"User '{user.username}' created successfully.",
            "user_id": user.id,
            "username": user.username,
            "provided_password": bool(password),
            "provided_avatar": bool(image),
        }
        if image:
            avatar_status = upload_avatar(request, user.id)
            # response_data.update(avatar_status)

        login(request, user)
        return JsonResponse(response_data, status=200)

    return JsonResponse(
        {"status": "error", "message": "Method not allowed"}, status=200
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


@login_required
def update(request):
    user = request.user
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        image = request.FILES.get("image")

        sanitized_data, status_code = sanitize_input(username, password, image)
        if status_code != 200:
            return JsonResponse({"status": "error", "message": sanitized_data})

        username = sanitized_data.get("username")
        password = sanitized_data.get("password")

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

        # if not any([username, password, image]):
        #     return JsonResponse(
        #         {"status": "error", "message": "No field updated"}, status=400
        #     )

        fields_to_update = {}

        if username:
            fields_to_update["username"] = username
        if password:
            fields_to_update["password"] = make_password(password)

        if fields_to_update:
            for field, value in fields_to_update.items():
                setattr(user, field, value)
            user.save()

        if image:
            avatar_status = update_avatar(request, user.id)

        response_data = {
            "status": "success",
            "message": "User updated successfully.",
            "user_id": user.id,
        }
        if image:
            response_data.update(avatar_status)

        return JsonResponse(response_data, status=201)
    else:
        return JsonResponse({"status": "error", "message": "Method not allowed."})


def get_total_score(user_id):
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return JsonResponse(
            {
                "status": "error",
                "message": "User not found (def get_total_score)",
                "404_user_id": user_id,
            }
        )

    total_score = Participation.objects.filter(user=user).aggregate(Sum("score"))[
        "score__sum"
    ]
    return total_score or 0


def game_rounds(game_id):
    rounds = Round.objects.filter(game=game_id)
    game_rounds = []
    if not rounds.exists():
        return game_rounds
    for round in rounds.order_by("round_number"):
        game_round = {
            "round_number": round.round_number,
            "round_status": round.status,
            "player1": {
                "alias": round.player1.alias if round.player1 else None,
                "score": round.player1_score if round.player1 else None,
                "user_id": round.player1.user_id if round.player1 else None,
            },
            "player2": {
                "alias": round.player2.alias if round.player2 else None,
                "score": round.player2_score if round.player1 else None,
                "user_id": round.player2.user_id if round.player1 else None,
            },
            "winner": {
                "alias": round.winner.alias if round.winner else None,
                "user_id": round.winner.user_id if round.winner else None,
            },
        }
        game_rounds.append(game_round)
    return game_rounds


def profile(request, user_id):
    try:
        user = User.objects.get(pk=user_id)
        user_profile = UserProfile.objects.get(user=user)
    except User.DoesNotExist:
        return JsonResponse(
            {
                "status": "error",
                "message": "User not found. (def profile)",
                "404_user_id": user_id,
            }
        )
    except UserProfile.DoesNotExist:
        return JsonResponse(
            {
                "status": "error",
                "message": "Userprofile not found (def profile)",
                "404_userprofile_id": user_id,
            }
        )
    participations = Participation.objects.filter(user=user)

    total_wins = Tournament.objects.filter(winner=user_profile).count()
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
            "rounds": game_rounds(tournament.game_id),
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
    player_data["rank"] = User.rankings.get_user_ranking(user.id)

    if request.user.is_authenticated:
        player_data["games"] = games
        player_data["last_login"] = user.last_login
        player_data["total_users"] = User.objects.count()
    if request.user.is_authenticated and request.user.id == user.id:
        player_data["friends"] = friends

    return JsonResponse({"status": "info", "player_data": player_data})


def who_am_i(request):
    if request.user.id == 1:
        logout(request)
        return JsonResponse(
            {
                "status": "error",
                "message": "User is not logged in.",
            }
        )
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


def regular_login(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        sanitized_data, status_code = sanitize_input(
            username=username, password=password, input_check=False
        )
        if status_code != 200:
            return JsonResponse({"status": "error", "message": sanitized_data})

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
        return JsonResponse({"status": "success", "message": "Wrong method"})


@ensure_csrf_cookie
def get_csrf_token(request):
    token = get_token(request)

    return JsonResponse({"csrfToken": token})


@login_required
def delete_profile(request):
    user = request.user
    user.delete()
    messages.success(request, "Your profile has been deleted.")
    return redirect("home")


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


def is_online(user_id):
    now = timezone.now()
    active_sessions = Session.objects.filter(expire_date__gte=now)
    for session in active_sessions:
        session_data = session.get_decoded()
        if str(user_id) == session_data.get("_auth_user_id"):
            return True
    return False


@login_required
def online_users_view(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {
                "status": "error",
                "message": "Please login/register to see a list of online users.",
            }
        )

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


def get_registered_users():
    registered_user_profiles = (
        UserProfile.objects.filter(registered=True)
        .annotate(
            username=F("user__username"),
        )
        .values(
            "username",
            "user_id",
            "avatar",
            "last_login",
            "last_activity",
            "alias",
            "won_games",
            "won_rounds",
        )
        .order_by("user_id", "username")  # Adjusted to comply with PostgreSQL's requirements
        .distinct("user_id")
    )
    return registered_user_profiles


@login_required
def registered_users_view(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {
                "status": "error",
                "message": "Please login/register to see the list of registered users.",
            }
        )

    registered_user_profiles_list = list(get_registered_users())
    return JsonResponse(
        {"status": "info", "user_list": registered_user_profiles_list},
        safe=False,
    )
