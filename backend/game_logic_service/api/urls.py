from django.urls import path
from . import views

urlpatterns = [
    path('game-logic/', views.getGame)
]