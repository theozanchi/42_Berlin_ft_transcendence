from django.contrib import admin
from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import create_game, get_game, update_game

urlpatterns = [
    path("admin/", admin.site.urls),
    path("get-game/", get_game),
    path("create-game/", create_game),
    path("update-game/", update_game),
]
