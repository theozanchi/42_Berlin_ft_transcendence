# views.py

from rest_framework.views import APIView
from rest_framework.response import Response

class GameConfigAPIView(APIView):
    def get(self, request):
        # Your logic to retrieve game configuration data
        return Response({'message': 'Game configuration data'})

