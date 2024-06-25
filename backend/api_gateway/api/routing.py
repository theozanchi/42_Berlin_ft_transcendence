from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'local/$', consumers.LocalConsumer.as_asgi()),
    re_path(r'^join/(?P<game_id>[0-9a-fA-F]{8})/$', consumers.RemoteConsumer.as_asgi()),
    re_path(r'^host/$', consumers.HostConsumer.as_asgi()),
]
