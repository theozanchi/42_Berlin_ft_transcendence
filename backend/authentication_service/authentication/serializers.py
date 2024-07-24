from rest_framework import serializers # type: ignore
from authentication.models import User

class UserSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    userName = serializers.CharField(max_length=50, required=True)
    email = serializers.EmailField()

    def create(self, validated_data):
        """
        Create and return a new `User` instance, given the validated data.
        """
        return User.objects.create(**validated_data)
    
    def update(self, instance, validated_data):
        """
        Update and return an existing `User` instance, given the validated data.
        """
        instance.userName = validated_data.get('userName', instance.userName)
        instance.email = validated_data.get('email', instance.email)
        instance.save()
        return instance
