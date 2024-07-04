# oauth42/urls.py

from django.urls import path
from .views import home, oauth_login, oauth_callback, delete_cookie, CustomLoginView, register, profile, RegisterView, ranking, update, password, delete_profile, add_friend, remove_friend

urlpatterns = [
    path('api/user_mgt', home, name='home'),
    path('api/user_mgt/profile/<int:user_id>/', profile, name='profile'),
    path('api/user_mgt/oauth/login/', oauth_login, name='oauth_login'),
    path('api/user_mgt/oauth/callback/', oauth_callback, name='oauth_callback'),
    path('api/user_mgt/delete_cookie/', delete_cookie, name='delete_cookie'),
    path('api/user_mgt/register/', RegisterView.as_view(), name="register"),
    path('api/user_mgt/login/', CustomLoginView.as_view(), name = "login"),
    path('api/user_mgt/ranking/', ranking, name='ranking'),
    path('api/user_mgt/update/', update, name='update'),
    path('api/user_mgt/password/', password, name='password'),
    path('api/user_mgt/delete_profile/', delete_profile, name='delete_profile'),
    path('api/user_mgt/add_friend/<int:user_id>', add_friend, name='add_friend'),
    path('api/user_mgt/remove_friend/<int:user_id>', remove_friend, name='remove_friend')
]
