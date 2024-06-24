# views.py
from django.http import HttpResponse, JsonResponse
from rest_framework.response import Response
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from game_manager.models import Game, Player, Round
from .serialize import GameSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def create_game(request):
    try:
        game = Game.objects.create(game_id = request.data.get('game-id'), mode=request.data.get('game-mode'))
        game.add_players_to_game(request.data)
        game.create_rounds()
        # Game can now be played
        #for round in game.rounds.all():
        #    round.initialize_round()
        game.save()
        serializer = GameSerializer(game)
        return Response(serializer.data, status=200)
    
    except request.data.get('game-id') is None:
        return Response({'error': 'Missing game ID.'}, status=404)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_game(request):
    try:
        game = Game.objects.get(pk=request.data.get('game-id'))
        serializer = GameSerializer(game)
        return Response(serializer.data, status=200)
    
    except Game.DoesNotExist:
        return Response({'error': 'Game not found.'}, status=404)

@api_view(['PUT'])
@permission_classes([AllowAny])
def update_round_status(request):
    try:
        game = Game.objects.get(pk=request.data.get('game-id'))

        game.update_game(request.data)
        game.save()

        serializer = GameSerializer(game)
        return Response(serializer.data, status=200)
    
    except Game.DoesNotExist:
        return Response({'error': 'Game not found.'}, status=404)
    
@api_view(['GET'])
@permission_classes([AllowAny])
def play_next_round(request):
    try:
        game = Game.objects.get(pk=request.data.get('game-id'))
        round_to_play = Round.objects.filter(game=game, winner__isnull=True).order_by('round_number').first()
        
        if round_to_play:
            round_to_play.initialize_round()

            serializer = GameSerializer(game)
            return Response(serializer.data, status=200)
        
        else:
            return Response({'message': 'No rounds to play or all rounds played.'}, status=404)

    except Game.DoesNotExist:
        return Response({'error': 'Game not found.'}, status=404)

@api_view(['GET'])
@permission_classes([AllowAny])
def finish_game(request):
    try:
        game = Game.objects.get(pk=request.data.get('game-id'))
        game.determine_winner()

        game.save()
        return Response({'message': 'Game finished.', 'winner': game.winner}, status=200)
                             
    except Game.DoesNotExist:
        return Response({'error': 'Game not found.'}, status=404)