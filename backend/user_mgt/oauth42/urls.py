# oauth42/urls.py

from django.urls import path

from .oauth import oauth_callback, oauth_login
from .views import (add_friend, add_friend_view, delete_cookie, delete_profile,
                    get_csrf_token, home, logout_user, online_users_view, profile, rankings, register,
                    regular_login, remove_friend, remove_friend_view, update,
                    who_am_i, registered_users_view)

urlpatterns = [
    path("api/user_mgt", home, name="home"),
    path("api/user_mgt/profile/<int:user_id>/", profile, name="profile"),
    path("api/user_mgt/oauth/login/", oauth_login, name="oauth_login"),
    path("api/user_mgt/oauth/callback/", oauth_callback, name="oauth_callback"),
    path("api/user_mgt/delete_cookie/", delete_cookie, name="delete_cookie"),
    path("api/user_mgt/register/", register, name="register"),
    path("api/user_mgt/login/", regular_login, name="login"),
    path("api/user_mgt/logout/", logout_user, name="logout"),
    path("api/user_mgt/ranking/", rankings, name="ranking"),
    path("api/user_mgt/update/", update, name="update"),
    path("api/user_mgt/delete_profile/", delete_profile, name="delete_profile"),
    path("api/user_mgt/add_friend/", add_friend, name="add_friend"),
    path(
        "api/user_mgt/add_friend_view/<int:user_id>",
        add_friend_view,
        name="add_friend_view",
    ),
    path("api/user_mgt/remove_friend/", remove_friend, name="remove_friend"),
    path(
        "api/user_mgt/remove_friend_view/<int:user_id>",
        remove_friend_view,
        name="remove_friend_view",
    ),
    path("api/user_mgt/online_users/", online_users_view, name="online_users"),
    path("api/user_mgt/me", who_am_i, name="me"),
    path("api/user_mgt/user_list", registered_users_view, name="user_list"),
    path("api/user_mgt/get-csrf-token/", get_csrf_token, name="get_csrf_token"),
]
