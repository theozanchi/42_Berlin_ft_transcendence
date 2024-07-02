# oauth42/urls.py

from django.urls import path
from .views import home, oauth_login, oauth_callback, delete_cookie, CustomLoginView, register, profile, RegisterView, ranking

urlpatterns = [
    path('api/user_mgt', home, name='home'),
    path('api/user_mgt/profile/<int:user_id>/', profile, name='profile'),
    path('api/user_mgt/oauth/login/', oauth_login, name='oauth_login'),
    path('api/user_mgt/oauth/callback/', oauth_callback, name='oauth_callback'),
    path('api/user_mgt/delete_cookie/', delete_cookie, name='delete_cookie'),
    path('api/user_mgt/register/', RegisterView.as_view(), name="register"),
    path('api/user_mgt/login/', CustomLoginView.as_view(), name = "login"),
    path('api/user_mgt/ranking/', ranking, name='ranking')
]
