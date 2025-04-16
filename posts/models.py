from django.db import models
from django.conf import settings
from moderation.utils import filter_banned_words
from django.utils import timezone
import json
from django.db.models import JSONField
from groups.models import Group

class ListJSONField(JSONField):
    def from_db_value(self, value, expression, connection):
        if isinstance(value, list):
            return value
        if value is None:
            return value
        return json.loads(value)

class Post(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    # Используем наше поле ListJSONField для hashtags:
    hashtags = ListJSONField(
        default=list,
        help_text="Введите хотя бы один хэштег"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    repost_count = models.PositiveIntegerField(default=0)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, null=True, blank=True, related_name='posts')
    original_post = models.ForeignKey(
    'self',
    null=True,
    blank=True,
    on_delete=models.SET_NULL,
    related_name='reposts'
)

    def save(self, *args, **kwargs):
        if not getattr(self, 'original_post', None):  # Только если это НЕ репост
            if filter_banned_words(self.content):
                raise ValueError("Сообщение содержит запрещенные слова")
            if not self.hashtags or len(self.hashtags) == 0:
                raise ValueError("Необходимо указать хотя бы один хэштег")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Post by {self.user.username} at {self.created_at}"

class PostImage(models.Model):
    post = models.ForeignKey(Post, related_name="images", on_delete=models.CASCADE)
    image = models.ImageField(upload_to="posts/")

    def __str__(self):
        return f"Image for post {self.post.id}"

# models.py
class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies')  # 🆕

    def __str__(self):
        return f"Comment by {self.user.username} on {self.post.id}"

class Like(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'post')

    def __str__(self):
        return f"{self.user.username} лайкнул пост {self.post.id}"


class CommentLike(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'comment')

    def __str__(self):
        return f"{self.user.username} лайкнул комментарий {self.comment.id}"
