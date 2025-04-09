from rest_framework import serializers
from .models import Dialog, Message
from django.contrib.auth import get_user_model

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
    last_message_time = serializers.SerializerMethodField()
    last_message_text = serializers.SerializerMethodField()
    last_message_sender = serializers.SerializerMethodField()
    last_message_is_read = serializers.SerializerMethodField()

    class Meta:
        model = Dialog
        fields = ['id', 'user1', 'user2', 'created_at', 'last_message_time', 'last_message_text', 'last_message_sender', 'last_message_is_read']

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



class MessageSerializer(serializers.ModelSerializer):
    sender = UserShortSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'dialog', 'sender', 'text', 'timestamp', 'is_read']
