from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Dialog(models.Model):
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dialogs_initiated')
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dialogs_received')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user1', 'user2')

    def __str__(self):
        return f"Диалог между {self.user1.username} и {self.user2.username}"

class Message(models.Model):
    dialog = models.ForeignKey(Dialog, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')  # 👈 добавь это
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.sender.username}: {self.text[:30]}"
