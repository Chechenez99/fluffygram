from django.db import models
from django.contrib.auth import get_user_model
from posts.models import Post 

User = get_user_model()

class Dialog(models.Model):
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dialogs_initiated', blank=True, null=True)
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dialogs_received', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_group = models.BooleanField(default=False)
    title = models.CharField(max_length=255, blank=True)
    participants = models.ManyToManyField(User, related_name='group_chats', blank=True)
    avatar = models.ImageField(upload_to='group_avatars/', blank=True, null=True)

    def __str__(self):
        if self.is_group:
            return f"Групповой чат: {self.title or 'Без названия'}"
        else:
            return f"Диалог: {self.user1.username} и {self.user2.username}"

class Message(models.Model):
    dialog = models.ForeignKey(Dialog, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages', null=True, blank=True)
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    shared_post = models.ForeignKey(Post, on_delete=models.SET_NULL, null=True, blank=True, related_name='shared_in_messages')  # 🆕
    media = models.FileField(upload_to='chat_media/', null=True, blank=True)  
    edited = models.BooleanField(default=False)
    def __str__(self):
        return f"{self.sender.username}: {self.text[:30]}"