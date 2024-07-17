from django.contrib import admin
from django.urls import path, include
from game_logic import views
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path("admin/", admin.site.urls),
    path("game-update/", views.game_update),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
