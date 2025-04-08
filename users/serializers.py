from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer, UserSerializer as BaseUserSerializer
from rest_framework import serializers
from .models import CustomUser, UserProfile
from .models import FriendRequest

# users/serializers.py
class UserShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'avatar']


class UserCreateSerializer(BaseUserCreateSerializer):
    re_password = serializers.CharField(write_only=True)

    class Meta(BaseUserCreateSerializer.Meta):
        model = CustomUser
        fields = ('id', 'username', 'password', 're_password', 'email', 'avatar', 'bio', 'city')

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('re_password'):
            raise serializers.ValidationError({"password": "Пароли не совпадают"})
        return attrs

    def create(self, validated_data):
        # Удаляем re_password, чтобы его не передавать в модель
        validated_data.pop('re_password', None)
        return super().create(validated_data)

class UserSerializer(BaseUserSerializer):
    city = serializers.CharField(source="profile.city", default="", read_only=True)
    bio = serializers.CharField(source="profile.bio", default="", read_only=True)
    avatar = serializers.ImageField(source="profile.avatar", default=None, read_only=True)

    class Meta(BaseUserSerializer.Meta):
        model = CustomUser
        fields = ('id', 'username', 'email', 'avatar', 'bio', 'city')

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['username', 'email', 'bio', 'avatar', 'city']

class FriendRequestSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True)

    class Meta:
        model = FriendRequest
        fields = ['id', 'sender', 'sender_username', 'receiver', 'receiver_username', 'accepted', 'created_at']
        read_only_fields = ['id', 'sender', 'created_at']