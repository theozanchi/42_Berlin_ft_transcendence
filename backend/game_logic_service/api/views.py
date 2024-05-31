from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.http import HttpResponse, JsonResponse

@api_view(['GET', 'POST'])
def play_game(request):
    pass
