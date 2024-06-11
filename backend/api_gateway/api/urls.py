from django.urls import path
from .views import create_lobby, join_lobby, start_game

urlpatterns = [
    path('create_lobby/', create_lobby, name='create_lobby'),
    path('join_lobby/', join_lobby, name='join_lobby'),
    path('start_game/', start_game, name='start_game'),
]




