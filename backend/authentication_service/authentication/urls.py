from django.urls import path, include # type: ignore
from . import views

urlpatterns = [
    path('authentication/', views.hello_world),
    path('authentication/test', views.hello_world),
]
