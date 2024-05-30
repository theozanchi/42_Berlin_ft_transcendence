from rest_framework.response import Response
from rest_framework.decorators import api_view

@api_view(['GET', 'POST'])
def play_game(self, request):
    coords = 0
    return Response(coords)
