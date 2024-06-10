from rest_framework.response import Response
from rest_framework.decorators import api_view


@api_view(['GET'])
def hello_world(request):
	return Response({"message": "Hello, world!"})

@api_view(['GET'])
def coucou(request):
	return Response({"message": "Hello, world!"})
	