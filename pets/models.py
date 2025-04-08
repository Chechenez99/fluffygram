from django.db import models
from django.conf import settings  # Импортируем настройки

class Pet(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='pets')  # Используем settings.AUTH_USER_MODEL
    name = models.CharField(max_length=100)
    species = models.CharField(max_length=50)  # кошка, собака, хомяк и т.п.
    breed = models.CharField(max_length=100, blank=True, null=True)
    age = models.PositiveIntegerField(blank=True, null=True)
    avatar = models.ImageField(upload_to='pet_avatars/', blank=True, null=True)
    about = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.species})"
