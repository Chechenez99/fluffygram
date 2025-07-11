# Generated by Django 5.1.7 on 2025-04-10 16:20

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('direct_messages', '0003_dialog_avatar_dialog_is_group_dialog_participants_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='dialog',
            unique_together=set(),
        ),
        migrations.AlterField(
            model_name='dialog',
            name='user1',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='dialogs_initiated', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='dialog',
            name='user2',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='dialogs_received', to=settings.AUTH_USER_MODEL),
        ),
    ]
