from channels.generic.websocket import AsyncWebsocketConsumer
import json


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.dialog_id = self.scope['url_route']['kwargs']['dialog_id']
        self.room_group_name = f'chat_{self.dialog_id}'

        # Подключение к группе WebSocket
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        # Разрешаем соединение
        await self.accept()

    async def disconnect(self, close_code):
        # Убираем пользователя из группы при отключении
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Получение сообщений от WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        sender = text_data_json['sender']

        # Отправляем сообщение в группу WebSocket
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender': sender
            }
        )

    # Отправка сообщения в WebSocket
    async def chat_message(self, event):
        message = event['message']
        sender = event['sender']

        # Отправляем сообщение WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'sender': sender
        }))
        
class NotificationsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.room_group_name = f"user_{self.user.id}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def new_group_chat(self, event):
        await self.send(text_data=json.dumps({
            "type": "new_group_chat",
            "dialog_id": event["dialog_id"]
        }))

    async def new_friend_request(self, event):
        await self.send(text_data=json.dumps({
            "type": "friend_request",
            "sender_id": event["sender_id"],
            "sender_username": event["sender_username"]
        }))
