from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import get_game, create_game, update_game, user_mgt_proxy

urlpatterns = [
    path('get-game/', get_game),
    path('create-game/', create_game),
    path('update-game/' , update_game),
    path('user_mgt/<path:path>', user_mgt_proxy),
]
