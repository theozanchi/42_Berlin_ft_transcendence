from django.contrib import admin

# Register your models here.

from .models import GameConfig

admin.site.register(GameConfig)