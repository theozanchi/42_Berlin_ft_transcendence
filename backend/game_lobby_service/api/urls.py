from django.urls import path
from . import views
from game_lobby import settings

urlpatterns = [
    path('', views.create_lobby),
    path('lobby/', views.LobbyView.as_view(), name='lobby'),
]

# Serve static files during development
if settings.DEBUG:
    from django.conf.urls.static import static
    from django.conf import settings
    from django.views.static import serve as static_serve
    
    urlpatterns += [
        path('static/<path:path>', static_serve),
    ]