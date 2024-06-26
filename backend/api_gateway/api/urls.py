from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import get_game, create_game, update_game

urlpatterns = [
    path('get-game/', get_game),
    path('create-game/', create_game),
    path('update-game/' , update_game),
]
