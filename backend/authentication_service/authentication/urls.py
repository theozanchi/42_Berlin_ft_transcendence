from django.urls import path, include # type: ignore
from . import views

urlpatterns = [
    path('authentication/', views.user_list),
]
