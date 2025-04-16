from rest_framework import serializers
from .models import Dialog, Message
from django.contrib.auth import get_user_model
from posts.serializers import PostSerializer


User = get_user_model()

class UserShortSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(source='profile.avatar', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar']




# serializers.py
class DialogSerializer(serializers.ModelSerializer):
    user1 = UserShortSerializer(read_only=True)
    user2 = UserShortSerializer(read_only=True)
    participants = UserShortSerializer(many=True, read_only=True)  # ← поле участников
    last_message_time = serializers.SerializerMethodField()
    last_message_text = serializers.SerializerMethodField()
    last_message_sender = serializers.SerializerMethodField()
    last_message_is_read = serializers.SerializerMethodField()
    avatar = serializers.ImageField(read_only=True)
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Dialog
        fields = [
            'id', 'user1', 'user2', 'participants', 'created_at',
            'last_message_time', 'last_message_text', 'last_message_sender', 'last_message_is_read',
            'is_group', 'title', 'avatar', 'unread_count'  # ← добавь сюда
        ]

    def get_last_message_time(self, obj):
        last = obj.messages.order_by('-timestamp').first()
        return last.timestamp if last else obj.created_at

    def get_last_message_text(self, obj):
        last = obj.messages.order_by('-timestamp').first()
        return last.text if last else ""

    def get_last_message_sender(self, obj):
        last = obj.messages.order_by('-timestamp').first()
        return last.sender.username if last else ""

    def get_last_message_is_read(self, obj):
        last = obj.messages.order_by('-timestamp').first()
        return last.is_read if last else True

    def get_unread_count(self, obj):
        user = self.context['request'].user
        return obj.messages.filter(is_read=False).exclude(sender=user).count()



class MessageSerializer(serializers.ModelSerializer):
    sender = UserShortSerializer(read_only=True)
    text = serializers.CharField(required=False, allow_blank=True)
    shared_post = PostSerializer(read_only=True)  # 🆕
    media = serializers.FileField(required=False)  # 🆕
    class Meta:
        model = Message
        fields = ['id', 'dialog', 'sender', 'text', 'timestamp', 'is_read', 'shared_post', 'media']