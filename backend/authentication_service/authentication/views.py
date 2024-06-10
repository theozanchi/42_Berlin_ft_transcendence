from rest_framework.response import Response # type: ignore
from rest_framework.decorators import api_view # type: ignore


@api_view(['GET'])
def hello_world(request):
	return Response({"message": "Hello, world!"})
