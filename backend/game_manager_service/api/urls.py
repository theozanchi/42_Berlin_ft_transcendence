from django.urls import path
from .views import create_game

urlpatterns = [
    path('', create_game)
]