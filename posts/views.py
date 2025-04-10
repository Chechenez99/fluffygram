from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from .models import Post, Comment, PostImage, Like
from .serializers import PostSerializer, CommentSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from django.db.models import Q
from users.models import FriendRequest
from .serializers import PostSerializer
from groups.models import Group  # только если используется где-то

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all().order_by('-created_at')
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class PostViewSet(viewsets.ModelViewSet):

    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Post.objects.all().order_by("-created_at")
        user_id = self.request.query_params.get("user")
        group_id = self.request.query_params.get("group")
        hashtag = self.request.query_params.get("hashtag")

        if user_id:
            queryset = queryset.filter(user_id=user_id, group__isnull=True)

        if group_id:
            queryset = queryset.filter(group_id=group_id)

        if hashtag:
            hashtag = hashtag.lower()
            queryset = queryset.filter(hashtags__icontains=hashtag)

        if not user_id and not group_id and not hashtag:
            queryset = queryset.filter(user=self.request.user, group__isnull=True)

        return queryset







    def perform_create(self, serializer):
        group_id = self.request.POST.get('group') or self.request.data.get('group')
        group = None
        if group_id:
            from groups.models import Group
            try:
                group = Group.objects.get(id=group_id)
            except Group.DoesNotExist:
                group = None

        post = serializer.save(user=self.request.user, group=group)

        # 💡 Обрабатываем до 10 изображений
        for image_file in self.request.FILES.getlist("images")[:10]:
            PostImage.objects.create(post=post, image=image_file)



        

    def destroy(self, request, *args, **kwargs):
        post = self.get_object()
        if post.user != request.user:
            return Response({'detail': 'У тебя нет прав удалить этот пост.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

class NewsFeedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # 1. Получаем id друзей
        sent = FriendRequest.objects.filter(sender=user, accepted=True).values_list('receiver_id', flat=True)
        received = FriendRequest.objects.filter(receiver=user, accepted=True).values_list('sender_id', flat=True)
        friend_ids = list(set(sent) | set(received))

        # 2. Получаем id групп, на которые подписан (ManyToMany)
        group_ids = user.subscribed_groups.values_list('id', flat=True)

        # 3. Посты от друзей и из групп
        posts = Post.objects.filter(
            Q(user_id__in=friend_ids) | Q(group_id__in=group_ids)
        ).order_by('-created_at')

        serializer = PostSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_like(request, post_id):
    user = request.user
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Пост не найден"}, status=404)

    like, created = Like.objects.get_or_create(user=user, post=post)
    if not created:
        like.delete()
        liked = False
    else:
        liked = True

    return Response({
        "likes_count": post.likes.count(),
        "liked_by_user": liked
    })
