from django.urls import path
from .views import create_lobby, join_lobby, start_game

urlpatterns = [
    path('create-lobby/', create_lobby),
    path('join-lobby/', join_lobby),
    path('start-game/', start_game)
]




