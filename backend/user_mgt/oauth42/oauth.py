from django.http import JsonResponse
import os
import requests
from django.core.files.base import ContentFile
from django.contrib.auth import login
from .models import UserProfile, User
from django.utils.crypto import get_random_string
from django.shortcuts import redirect
import pprint


CLIENT_ID = os.environ.get("CLIENT_ID")
CLIENT_SECRET = os.environ.get("CLIENT_SECRET")

REDIRECT_URI = "https://localhost:8443/api/user_mgt/oauth/callback/"


def oauth_login(request):
    state = get_random_string(32)
    request.session["oauth_state"] = state
    authorization_url = f"https://api.intra.42.fr/oauth/authorize?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&state={state}&prompt=login"
    return redirect(authorization_url)


def oauth_callback(request):
    state = validate_state(request)
    if not state:
        return error_response("State mismatch. Possible CSRF attack detected.")

    code = request.GET.get("code")
    access_token = exchange_code_for_token(code)
    if not access_token:
        return error_response(
            "No access token in 42 server response. API credentials might be outdated."
        )

    user_info = fetch_user_info(access_token)
    if not user_info:
        return error_response("Failed to fetch user info.")

    user = update_or_create_user(user_info, access_token)
    if not user:
        return error_response("User information incomplete.")
    login_user(request, user)

    return success_response(user.id)


def validate_state(request):
    state_request = request.GET.get("state")
    state_session = request.session.pop("oauth_state", None)
    return state_request == state_session


def exchange_code_for_token(code):
    token_url = "https://api.intra.42.fr/oauth/token"

    token_data = {
        "grant_type": "authorization_code",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "code": code,
        "redirect_uri": REDIRECT_URI,
    }

    token_response = requests.post(token_url, data=token_data)
    if token_response.status_code == 200:
        token_json = token_response.json()
        access_token = token_json.get("access_token")
        return access_token
    return None


def fetch_user_info(access_token):
    user_info_url = "https://api.intra.42.fr/v2/me"
    headers = {"Authorization": f"Bearer {access_token}"}
    user_info_response = requests.get(user_info_url, headers=headers)
    if user_info_response.status_code != 200:
        return None

    try:
        user_info = user_info_response.json()
    except ValueError:
        return None

    username = user_info.get("login")
    picture_url = user_info.get("image", {}).get("versions", {}).get("small")
    id42 = user_info.get("campus_users", [{}])[0].get("user_id")

    return {"username": username, "picture_url": picture_url, "id42": id42}


def update_or_create_user(user_info, access_token):
    username = user_info.get("username")
    picture_url = user_info.get("picture_url")
    id42 = user_info.get("id42")

    if not all([username, picture_url, id42, access_token]):
        return None
    try:
        user_profile = UserProfile.objects.get(id42=id42)
        user = user_profile.user
    except UserProfile.DoesNotExist:
        user, created = User.objects.get_or_create(
            username=username,
        )

        user_profile, created = UserProfile.objects.update_or_create(
            user=user,
            defaults={
                "picture_url": picture_url,
                "access_token": access_token,
                "id42": id42,
            },
        )

        if created:
            user.set_unusable_password()
            user.save()

        save_avatar_from_url(user.userprofile, picture_url)
    return user


def login_user(request, user):
    login(request, user)


def error_response(message):
    data = {"status": "error", "message": message}
    return JsonResponse(data, 200)


def success_response(user_id):
    return JsonResponse(
        {
            "status": "success",
            "message": "Login with 42 oauth Login was successful",
            "user_id": user_id,
        },
        status=200,
    )


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
