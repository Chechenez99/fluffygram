from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path("ws/chat/<int:dialog_id>/", consumers.ChatConsumer.as_asgi()),
    path("ws/notifications/", consumers.NotificationsConsumer.as_asgi()),
]
