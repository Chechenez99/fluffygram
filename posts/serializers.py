from rest_framework import serializers
from .models import Post, PostImage, Comment
from moderation.utils import filter_banned_words
from groups.models import Group


class CommentSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = Comment
        fields = ['id', 'user', 'content', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class PostImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostImage
        fields = ['id', 'image']


class PostSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    user_id = serializers.ReadOnlyField(source='user.id')
    username = serializers.CharField(source="user.username", read_only=True)
    user_avatar = serializers.ImageField(source="user.profile.avatar", read_only=True)  # 🆕 Аватарка профиля
    hashtags = serializers.JSONField(default=list)
    likes_count = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)
    images = PostImageSerializer(many=True, read_only=True)
    group = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        required=False,
        allow_null=True
    )
    group_name = serializers.CharField(source='group.name', read_only=True)
    group_avatar = serializers.ImageField(source='group.avatar', read_only=True)


    class Meta:
        model = Post
        fields = [
            'id',
            'user',
            'user_id',
            'username',
            'user_avatar',  # 🆕 Добавлено в список
            'content',
            'hashtags',
            'created_at',
            'likes_count',
            'repost_count',
            'comments',
            'images',
            'group', 
            'group_name', 
            'group_avatar'
        ]
        read_only_fields = [
            'id', 'user', 'user_id', 'created_at',
            'likes_count', 'repost_count', 'comments'
        ]

    def get_likes_count(self, obj):
        return obj.likes.count() if hasattr(obj, 'likes') else 0

    def validate_content(self, value):
        if filter_banned_words(value):
            raise serializers.ValidationError("Сообщение содержит запрещенные слова")
        return value

    def validate_hashtags(self, value):
        if not value or len(value) == 0:
            raise serializers.ValidationError("Необходимо указать хотя бы один хэштег")
        return value
