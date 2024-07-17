from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from game_logic import views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("game-update/", views.game_update),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
