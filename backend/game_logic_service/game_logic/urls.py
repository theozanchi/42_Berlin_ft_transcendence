from django.contrib import admin
from django.urls import path, include
from game_logic import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.lobby),
]
