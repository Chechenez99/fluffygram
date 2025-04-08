from django.db import models
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import UserProfile
from .serializers import UserProfileSerializer
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import FriendRequest
from .serializers import FriendRequestSerializer
from .models import CustomUser
from .serializers import UserSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import CustomUser
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken


class CustomTokenCreateView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.user
        refresh = RefreshToken.for_user(user)

        print("🎯 CustomTokenCreateView работает! user:", user.username, "id:", user.id)

        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user_id": user.id
        })




class UserDetailView(generics.RetrieveAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]


class FriendsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        accepted_requests = FriendRequest.objects.filter(
            accepted=True
        ).filter(
            models.Q(sender=user) | models.Q(receiver=user)
        )

        friends = []
        for fr in accepted_requests:
            if fr.sender == user:
                friends.append(fr.receiver)
            else:
                friends.append(fr.sender)

        serializer = UserSerializer(friends, many=True)
        return Response(serializer.data)


class UserSearchView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        search_query = self.request.query_params.get('search', '')
        return CustomUser.objects.filter(username__istartswith=search_query).order_by('username')


class FriendRequestViewSet(viewsets.ModelViewSet):
    serializer_class = FriendRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return FriendRequest.objects.filter(receiver=user, accepted=False)

    def create(self, request, *args, **kwargs):
        receiver_id = request.data.get("receiver")
        if FriendRequest.objects.filter(
            models.Q(sender=request.user, receiver_id=receiver_id) |
            models.Q(sender_id=receiver_id, receiver=request.user)
        ).exists():
            return Response({"detail": "Вы уже отправляли или получили заявку от этого пользователя"}, status=400)

        data = request.data.copy()
        data['sender'] = request.user.id
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        accepted = request.data.get('accepted')
        if accepted is not None:
            instance.accepted = accepted
            instance.save()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        return Response({"detail": "Поле 'accepted' не предоставлено"}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        try:
            return self.request.user.profile
        except UserProfile.DoesNotExist:
            return UserProfile.objects.create(user=self.request.user)


class RemoveFriendView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        user = request.user

        friendship = FriendRequest.objects.filter(
            accepted=True
        ).filter(
            (models.Q(sender=user) & models.Q(receiver__id=user_id)) |
            (models.Q(sender__id=user_id) & models.Q(receiver=user))
        ).first()

        if friendship:
            friendship.delete()
            return Response({"detail": "Друг удалён"}, status=204)
        return Response({"detail": "Дружба не найдена"}, status=404)
