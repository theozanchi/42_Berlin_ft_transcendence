from django.utils import timezone

from .models import Player


class LastActivityMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            Player.objects.filter(user=request.user).update(
                last_activity=timezone.now()
            )
        response = self.get_response(request)
        return response


def is_user_online(Player):
    if timezone.now() - Player.last_activity < timezone.timedelta(minutes=5) and Player.User.is_authenticated() :
        return True
    else:
        return False
