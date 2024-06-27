# oauth42/urls.py

from django.urls import path
from .views import home, oauth_login, oauth_callback, delete_cookie, CustomLoginView, register

urlpatterns = [
    path('', home, name='home'),
    path('oauth/login/', oauth_login, name='oauth_login'),
    path('oauth/callback/', oauth_callback, name='oauth_callback'),
    path('delete_cookie/', delete_cookie, name='delete_cookie'),
    path('register/', register, name="register"),
    path('login/', CustomLoginView.as_view(), name = "login"),
]
