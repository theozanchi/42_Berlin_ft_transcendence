from django.utils import timezone
from .models import UserProfile


class LastActivityMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            UserProfile.objects.filter(user=request.user).update(
                last_activity=timezone.now()
            )
        response = self.get_response(request)
        return response


def is_user_online(userprofile):
    if timezone.now() - userprofile.last_activity < timezone.timedelta(minutes=5):
        return True
    else:
        return False
