"""
URL configuration for game_manager project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import include, path
from game_manager import views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("create-game/", views.create_game),
    path("join-game/", views.join_game),
    path("update-round-status/", views.update_round_status),
    path("round/", views.round),
    path("game-status/", views.get_game),
    path("player-left/", views.update_players),
]
