from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views


urlpatterns = [
    # path('api/user_mgt/', include('oauth42.urls')),
    path("api/user_mgt/admin/", admin.site.urls),
    path("api/user_mgt/accounts/", include("django.contrib.auth.urls")),
    path("", include("oauth42.urls")),
]
