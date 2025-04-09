from django.shortcuts import render

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

@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_dialog_self(request, dialog_id):
    dialog = Dialog.objects.filter(id=dialog_id).first()
    if dialog:
        # Тут можно реализовать скрытие только для текущего пользователя
        dialog.delete()  # пока полное удаление
    return Response(status=204)

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

# views.py
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_unread_messages(request):
    user = request.user
    unread_count = Message.objects.filter(receiver=user, is_read=False).count()
    return Response({"unread_count": unread_count})


User = get_user_model()


class DialogListView(generics.ListAPIView):
    serializer_class = DialogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Dialog.objects.filter(user1=self.request.user) | Dialog.objects.filter(user2=self.request.user)


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
        serializer = DialogSerializer(dialog)
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

        if dialog.user1 == current_user:
            receiver = dialog.user2
        else:
            receiver = dialog.user1

        serializer.save(sender=current_user, receiver=receiver)
