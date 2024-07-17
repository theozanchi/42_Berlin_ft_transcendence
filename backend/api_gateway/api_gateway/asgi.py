import os

import api.routing
import django
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "api_gateway.settings")

# Initialize Django ASGI application early to ensure the AppRegistry is populated correctly
django.setup()

application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),  # Django's ASGI application to handle traditional HTTP requests
        "websocket": AuthMiddlewareStack(URLRouter(api.routing.websocket_urlpatterns)),
    }
)
