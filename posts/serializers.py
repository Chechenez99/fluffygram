from rest_framework import serializers
from .models import Post, PostImage, Like, Comment
from moderation.utils import filter_banned_words
from groups.models import Group
from .models import PostReport
from .models import CommentLike


class CommentSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    replies = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    liked_by_user = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'user', 'post', 'content', 'created_at', 'parent', 'replies', 'likes_count', 'liked_by_user']
        read_only_fields = ['id', 'user', 'created_at']

    def get_replies(self, obj):
        replies = obj.replies.all().order_by('created_at')
        return CommentSerializer(replies, many=True, context=self.context).data

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_liked_by_user(self, obj):
        user = self.context.get("request").user
        if user.is_authenticated:
            return obj.likes.filter(user=user).exists()
        return False


class PostImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostImage
        fields = ['id', 'image']


class PostSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    user_id = serializers.ReadOnlyField(source='user.id')
    username = serializers.CharField(source="user.username", read_only=True)
    user_avatar = serializers.ImageField(source="user.profile.avatar", read_only=True)  
    hashtags = serializers.JSONField(default=list)
    likes_count = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)
    images = PostImageSerializer(many=True, read_only=True)
    liked_by_user = serializers.SerializerMethodField()
    group = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        required=False,
        allow_null=True
    )
    group_name = serializers.CharField(source='group.name', read_only=True)
    group_avatar = serializers.ImageField(source='group.avatar', read_only=True)
    original_post = serializers.SerializerMethodField()
    original_post_id = serializers.IntegerField(source='original_post.id', read_only=True)
    reported = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id','user', 'user_id','username','user_avatar', 'content','hashtags','created_at','likes_count','repost_count','comments','images','group', 
            'group_name', 'group_avatar','liked_by_user', 'original_post','original_post_id','reported', 
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

    def get_liked_by_user(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            return obj.likes.filter(user=user).exists()
        return False

    def get_original_post(self, obj):
        if obj.original_post:
            return PostSerializer(obj.original_post, context=self.context).data
        return None

    def get_reported(self, obj):
        user = self.context.get("request").user
        if user.is_authenticated:
            return PostReport.objects.filter(post=obj, reporter=user).exists()
        return False

class PostReportSerializer(serializers.ModelSerializer):
    post_id = serializers.PrimaryKeyRelatedField(
        queryset=Post.objects.all(), source="post", write_only=True
    )
    post = PostSerializer(read_only=True)
    reporter = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = PostReport
        fields = "__all__"
