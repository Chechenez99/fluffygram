from django.shortcuts import render

from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from .models import Group
from .serializers import GroupSerializer
from users.serializers import UserSerializer  # если у тебя есть короткий сериализатор

class GroupSubscribersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            group = Group.objects.get(pk=pk)
        except Group.DoesNotExist:
            return Response({"error": "Группа не найдена"}, status=404)

        subscribers = group.subscribers.all()
        serializer = UserSerializer(subscribers, many=True)
        return Response(serializer.data)


class GroupListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        search = request.query_params.get("search")
        if search:
            groups = Group.objects.filter(name__istartswith=search)
        else:
            groups = Group.objects.all()
        serializer = GroupSerializer(groups, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = GroupSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(creator=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        print("Ошибки сериализатора:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MyGroupsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        groups = Group.objects.filter(creator=request.user)
        serializer = GroupSerializer(groups, many=True)
        return Response(serializer.data)


class SubscribedGroupsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        groups = Group.objects.filter(subscribers=request.user)
        serializer = GroupSerializer(groups, many=True)
        return Response(serializer.data)


class GroupDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            group = Group.objects.get(pk=pk)
        except Group.DoesNotExist:
            return Response({"error": "Группа не найдена"}, status=404)

        serializer = GroupSerializer(group)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            group = Group.objects.get(pk=pk, creator=request.user)
        except Group.DoesNotExist:
            return Response({"error": "Группа не найдена или вы не владелец"}, status=403)

        serializer = GroupSerializer(group, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        try:
            group = Group.objects.get(pk=pk, creator=request.user)
        except Group.DoesNotExist:
            return Response({"error": "Группа не найдена или вы не являетесь её владельцем."}, status=404)
        group.delete()
        return Response(status=204)


class GroupSubscribeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            group = Group.objects.get(pk=pk)
        except Group.DoesNotExist:
            return Response({"error": "Группа не найдена"}, status=404)

        group.subscribers.add(request.user)
        return Response({"message": "Вы подписались на группу."}, status=200)

    def delete(self, request, pk):
        try:
            group = Group.objects.get(pk=pk)
        except Group.DoesNotExist:
            return Response({"error": "Группа не найдена"}, status=404)

        group.subscribers.remove(request.user)
        return Response({"message": "Вы отписались от группы."}, status=200)
