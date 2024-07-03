from django.contrib import admin
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import get_game, create_game, update_game, user_mgt_proxy

urlpatterns = [
	path('admin/', admin.site.urls),
    path('get-game/', get_game),
    path('create-game/', create_game),
    path('update-game/' , update_game),
]
