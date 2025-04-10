import json
from django.shortcuts import render, get_object_or_404
# Create your views here.
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Dialog, Message
from .serializers import DialogSerializer, MessageSerializer
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Message
from rest_framework.permissions import IsAuthenticated
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.shortcuts import render
from django.db import models




@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_dialog_self(request, dialog_id):
    dialog = Dialog.objects.filter(id=dialog_id).first()
    if dialog:
        # Тут можно реализовать скрытие только для текущего пользователя
        dialog.delete()  # пока полное удаление
    return Response(status=204)
    
@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_group_chat(request, dialog_id):
    dialog = get_object_or_404(Dialog, id=dialog_id, is_group=True)

    if dialog.user1 != request.user:
        return Response({"error": "Вы не являетесь создателем группы"}, status=403)

    title = request.data.get("title")
    avatar = request.FILES.get("avatar")
    members_raw = request.data.get("new_members")

    if title:
        dialog.title = title

    if avatar:
        dialog.avatar = avatar

    if members_raw:
        try:
            member_ids = json.loads(members_raw)
            users = User.objects.filter(id__in=member_ids)
            all_participants = list(users)
            if request.user not in all_participants:
                all_participants.append(request.user)
            dialog.participants.set(all_participants)
        except Exception as e:
            return Response({"error": f"Invalid member list: {str(e)}"}, status=400)

   

    dialog.save()

    # WebSocket уведомление
    channel_layer = get_channel_layer()

    for participant in dialog.participants.all():
        async_to_sync(channel_layer.group_send)(
            f"user_{participant.id}",
            {
                "type": "new_group_chat",
                "dialog_id": dialog.id,
            }
        )


    return Response({"status": "updated"})


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_dialog_all(request, dialog_id):
    Dialog.objects.filter(id=dialog_id).delete()
    return Response(status=204)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_messages_read(request):
    dialog_id = request.data.get("dialogId")
    dialog = Dialog.objects.filter(id=dialog_id).first()
    if dialog:
        current_user = request.user
        messages = dialog.messages.filter(is_read=False).exclude(sender=current_user)
        messages.update(is_read=True)
        return Response({"status": "messages marked as read"})
    return Response({"error": "Dialog not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_or_get_dialog(request):
    recipient_id = request.data.get("recipient_id")
    if not recipient_id:
        return Response({"error": "recipient_id required"}, status=400)

    user = request.user
    recipient = get_object_or_404(User, id=recipient_id)

    if user == recipient:
        return Response({"error": "Нельзя создать диалог с собой"}, status=400)

    user1 = min(user, recipient, key=lambda u: u.id)
    user2 = max(user, recipient, key=lambda u: u.id)

    dialog, created = Dialog.objects.get_or_create(user1=user1, user2=user2)

    return Response({"id": dialog.id})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_group_chat(request):
    title = request.POST.get("title")
    user_ids_raw = request.POST.get("user_ids")
    avatar = request.FILES.get("avatar")

    if not title or not user_ids_raw:
        return Response({"error": "Missing data"}, status=400)

    try:
        user_ids = json.loads(user_ids_raw)
    except Exception:
        return Response({"error": "Invalid user_ids format"}, status=400)

    users = User.objects.filter(id__in=user_ids)
    if not users.exists():
        return Response({"error": "Invalid users"}, status=400)

    dialog = Dialog.objects.create(is_group=True, title=title, user1=request.user, user2=request.user)

    if avatar:
        dialog.avatar = avatar

    dialog.save()
    dialog.participants.set([request.user] + list(users))  # Заполняем всех участников

    return Response({"id": dialog.id})



# views.py
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unread_messages(request):
    user = request.user

    dialogs = Dialog.objects.filter(
        models.Q(user1=user) | models.Q(user2=user) | models.Q(participants=user)
    ).distinct()

    unread_count = Message.objects.filter(
        dialog__in=dialogs,
        is_read=False
    ).exclude(sender=user).count()

    return Response({"unread_count": unread_count})


User = get_user_model()


class DialogListView(generics.ListAPIView):
    serializer_class = DialogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        direct_dialogs = Dialog.objects.filter(
            models.Q(user1=user) | models.Q(user2=user),
            is_group=False
        )
        group_dialogs = Dialog.objects.filter(
            participants=user,
            is_group=True
        )
        return (direct_dialogs | group_dialogs).distinct()

    def get_serializer_context(self):
        return {'request': self.request}  # 🔥 вот это нужно!

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        print("[DEBUG] DialogListView.list called", queryset)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class DialogCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        username = request.data.get("username")
        if not username:
            return Response({"error": "username is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user2 = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if user2 == request.user:
            return Response({"error": "Нельзя создать диалог с собой"}, status=status.HTTP_400_BAD_REQUEST)

        dialog, created = Dialog.objects.get_or_create(
            user1=min(request.user, user2, key=lambda u: u.id),
            user2=max(request.user, user2, key=lambda u: u.id)
        )

        serializer = DialogSerializer(dialog, context={"request": request})  # ✅ здесь был context
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)



class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        dialog_id = self.kwargs['dialog_id']
        return Message.objects.filter(dialog_id=dialog_id)


class MessageCreateView(generics.CreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        dialog = serializer.validated_data['dialog']
        current_user = self.request.user

        if dialog.is_group:
            serializer.save(sender=current_user, receiver=None)
        else:
            receiver = dialog.user2 if dialog.user1 == current_user else dialog.user1
            serializer.save(sender=current_user, receiver=receiver)
