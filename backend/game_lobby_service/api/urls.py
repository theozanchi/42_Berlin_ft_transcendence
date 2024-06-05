from django.urls import path
from . import views
from game_lobby_service import settings

urlpatterns = [
    path('', views.LobbyView.as_view(), name='lobby'),
    path('create_lobby/', views.create_lobby),
    path('join_lobby/', views.join_lobby),
    path('verify_host/', views.verify_host)
] 