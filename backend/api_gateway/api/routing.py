from django.urls import re_path
from django.conf.urls import url
from . import consumers

websocket_urlpatterns = [
    url(r'^ws/local/$', consumers.LocalConsumer.as_asgi()),
    url(r'^ws/join/(?P<game_id>[0-9a-fA-F]{8})/$', consumers.RemoteConsumer.as_asgi()),
    url(r'^ws/host/$', consumers.HostConsumer.as_asgi()),
]

