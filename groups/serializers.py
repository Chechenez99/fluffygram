from rest_framework import serializers
from .models import Group

class GroupSerializer(serializers.ModelSerializer):
    subscribers = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    creator = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Group
        fields = ['id', 'name', 'description', 'avatar', 'subscribers', 'creator']  # Уже добавлено описание
