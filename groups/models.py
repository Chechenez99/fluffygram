# models.py
from django.db import models
from django.conf import settings

class Group(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    avatar = models.ImageField(upload_to='group_avatars/', null=True, blank=True)
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_groups')
    subscribers = models.ManyToManyField(
    settings.AUTH_USER_MODEL, related_name='subscribed_groups', blank=True
)

    def __str__(self):
        return self.name
