from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'local/$', consumers.LocalConsumer.as_asgi()),
    re_path(r'^join/(?P<lobby_id>[0-9a-fA-F]{8})/$', consumers.PlayerConsumer.as_asgi()),
]
