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


class UserSerializer(serializers.ModelSerializer):
    city = serializers.CharField(source="profile.city", default="", read_only=True)
    bio = serializers.CharField(source="profile.bio", default="", read_only=True)
    avatar = serializers.SerializerMethodField()
    is_staff = serializers.BooleanField(read_only=True)

    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'avatar', 'bio', 'city', 'is_staff')

    def get_avatar(self, obj):
        request = self.context.get('request')
        avatar = getattr(obj.profile, 'avatar', None)
        if avatar and request:
            return request.build_absolute_uri(avatar.url)
        return None

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['username', 'email', 'bio', 'avatar', 'city']

class FriendRequestSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)

    class Meta:
        model = FriendRequest
        fields = ['id', 'sender', 'receiver', 'accepted', 'created_at']
