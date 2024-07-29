import os
import logging
from typing import Optional, Dict, Any

import requests
from django.contrib.auth import login
from django.core.files.base import ContentFile
from django.http import JsonResponse, HttpResponse, HttpRequest
from django.shortcuts import redirect
from django.utils.crypto import get_random_string

from .models import User, UserProfile

logger = logging.getLogger(__name__)

def get_redirect_uri(request: HttpRequest) -> str:
    redirect_uri = request.build_absolute_uri('/api/user_mgt/oauth/callback/').replace('443', os.getenv('SPORT'))
    return redirect_uri

CLIENT_ID = os.environ.get("CLIENT_ID")
CLIENT_SECRET = os.environ.get("CLIENT_SECRET")
# REDIRECT_URI = "https://localhost:8443/api/user_mgt/oauth/callback/"
OAUTH_BASE_URL = "https://api.intra.42.fr"


def oauth_login(request) -> HttpResponse:
    REDIRECT_URI = get_redirect_uri(request)
    logger.info(f"Redirect URI: {REDIRECT_URI}")
    state = get_random_string(32)
    request.session["oauth_state"] = state
    authorization_url = f"{OAUTH_BASE_URL}/oauth/authorize?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&state={state}&prompt=login"
    return redirect(authorization_url)


def get_oauth_result(request) -> HttpResponse:
    result = request.session.pop("oauth_result", {})
    logger.info(f"OAuth result: {result}")
    return JsonResponse(
        result
        if result
        else {"status": "error", "message": "42 login failed. No OAuth result found."}
    )


def oauth_callback(request) -> HttpResponse:
    logger.info("Starting OAuth callback")
    if not validate_state(request):
        return error_response("State mismatch. Possible CSRF attack detected.")

    code = request.GET.get("code")
    access_token = exchange_code_for_token(request, code)
    if not access_token:
        return error_response("Failed to obtain access token..")

    user_info = fetch_user_info(access_token)
    if not user_info:
        return error_response("Failed to fetch user info.")

    user = update_or_create_user(user_info, access_token)
    if user:
        login(request, user)
        request.session["oauth_result"] = {
            "status": "success",
            "message": "42 Login successful",
        }
    else:
        request.session["oauth_result"] = {
            "status": "error",
            "message": "42 Login failed",
        }
    return redirect("/oresult")


def validate_state(request) -> bool:
    state_request = request.GET.get("state")
    state_session = request.session.pop("oauth_state", None)
    return state_request == state_session


def exchange_code_for_token(request: HttpRequest, code: str) -> Optional[str]:
    REDIRECT_URI = get_redirect_uri(request)
    token_url = f"{OAUTH_BASE_URL}/oauth/token"
    token_data = {
        "grant_type": "authorization_code",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "code": code,
        "redirect_uri": REDIRECT_URI,
    }

    try:
        response = requests.post(token_url, data=token_data, timeout=10)
        response.raise_for_status()
        return response.json().get("access_token")
    except requests.RequestException as e:
        logger.error(f"Failed to exchange code for token: {e}")
        return None


def fetch_user_info(access_token: str) -> Optional[Dict[str, Any]]:
    user_info_url = f"{OAUTH_BASE_URL}/v2/me"
    headers = {"Authorization": f"Bearer {access_token}"}

    try:
        response = requests.get(user_info_url, headers=headers, timeout=10)
        response.raise_for_status()
        user_info = response.json()
        return {
            "username": user_info.get("login"),
            "picture_url": user_info.get("image", {}).get("versions", {}).get("small"),
            "id42": user_info.get("campus_users", [{}])[0].get("user_id"),
        }
    except requests.RequestException as e:
        logger.error(f"Failed to fetch user info: {e}")
        return None


def update_or_create_user(
    user_info: Dict[str, Any], access_token: str
) -> Optional[User]:
    if not all(
        [
            user_info.get("username"),
            user_info.get("picture_url"),
            user_info.get("id42"),
            access_token,
        ]
    ):
        return None

    user, _ = User.objects.get_or_create(username=user_info["username"])
    user_profile, created = UserProfile.objects.update_or_create(
        user=user,
        defaults={
            "picture_url": user_info["picture_url"],
            "access_token": access_token,
            "id42": user_info["id42"],
            "registered": True,
        },
    )

    if created:
        user.set_unusable_password()
        user.save()

    save_avatar_from_url(user.player, user_info["picture_url"])
    return user


def save_avatar_from_url(user_profile: UserProfile, url: str) -> None:
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        content_type = response.headers.get("Content-Type", "")

        if content_type.startswith("image/"):
            image_content = ContentFile(response.content)
            filename = url.split("/")[-1]

            if not user_profile.avatar or filename not in user_profile.avatar.name:
                user_profile.avatar.save(filename, image_content)
                user_profile.save()
        else:
            logger.warning(f"Invalid content type for avatar: {content_type}")
    except requests.RequestException as e:
        logger.error(f"Failed to save avatar from URL: {e}")


def error_response(message: str) -> JsonResponse:
    logger.error(f"Error: {message}. 42 login failed.")
    return redirect("/oresult")
