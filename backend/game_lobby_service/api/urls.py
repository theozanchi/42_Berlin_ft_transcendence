from django.urls import path
from . import views
from game_lobby_service import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', views.LobbyView.as_view(), name='lobby'),
    path('create', views.create_lobby),
    path('join', views.join_lobby),
] 

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
