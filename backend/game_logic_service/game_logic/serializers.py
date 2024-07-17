# serializers.py

from rest_framework import serializers


class RotationSerializer(serializers.Serializer):
    x = serializers.FloatField()
    y = serializers.FloatField()
    z = serializers.FloatField()


class PlayerSerializer(serializers.Serializer):
    x = serializers.FloatField()
    y = serializers.FloatField()
    z = serializers.FloatField()
    rotation = RotationSerializer()


class BallSpeedSerializer(serializers.Serializer):
    x = serializers.FloatField()
    y = serializers.FloatField()
    z = serializers.FloatField()


class BallSerializer(serializers.Serializer):
    x = serializers.FloatField()
    y = serializers.FloatField()
    z = serializers.FloatField()


class GameStateSerializer(serializers.Serializer):
    game_id = serializers.CharField()
    aiming_angle = serializers.FloatField()
    aimingSpeed = serializers.FloatField()
    maxaiming_angle = serializers.FloatField()
    minaiming_angle = serializers.FloatField()
    cube_size = serializers.FloatField()
    ball_radius = serializers.FloatField()
    resetting_ball = serializers.BooleanField()
    last_update_time = serializers.FloatField()
    update_interval = serializers.FloatField()
    player1 = PlayerSerializer()
    player2 = PlayerSerializer()
    ball = BallSerializer()
    ballSpeed = BallSpeedSerializer()
    playerTurn = serializers.BooleanField()
    playerScore = serializers.IntegerField()
    aiScore = serializers.IntegerField()
    ballIsHeld = serializers.BooleanField()
    current_face = serializers.IntegerField()
    current_face2 = serializers.IntegerField()
    wall_hits = serializers.IntegerField()
    reset_ball = serializers.BooleanField()
    collision_marker_position = BallSerializer(required=False)

    def create(self, validated_data):
        return validated_data

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)
        return instance
