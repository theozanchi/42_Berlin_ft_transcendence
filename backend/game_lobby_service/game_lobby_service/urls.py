"""
URL configuration for game_lobby project.

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
from django.contrib import staticfiles
from django.urls import path, include
from game_lobby import views, routing
from game_lobby.consumers import LobbyConsumer
from . import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    path('create_lobby/', views.create_lobby),
    #path('join_lobby/', views.join_lobby),
    path('verify_host/', views.verify_host),
    path('ws/', include(routing.websocket_urlpatterns)),
] 

""" # websocket url patterns
urlpatterns += [
    path('ws/', include(routing.websocket_urlpatterns)),
] """



