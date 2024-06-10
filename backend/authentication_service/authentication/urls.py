from django.urls import path, include # type: ignore
from . import views

urlpatterns = [
    path('authentication/', views.hello_world),
]
