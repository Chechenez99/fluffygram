from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from .models import Post, Comment, PostImage, Like,  CommentLike
from .serializers import PostSerializer, CommentSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from django.db.models import Q
from users.models import FriendRequest
from .serializers import PostSerializer
from groups.models import Group  # только если используется где-то
from datetime import timedelta
from django.utils import timezone
from rest_framework import status
from direct_messages.models import Dialog, Message  # если нужно, добавь
from rest_framework import viewsets, permissions
from .models import PostReport
from .serializers import PostReportSerializer
from rest_framework.permissions import  IsAdminUser
from rest_framework.permissions import BasePermission, SAFE_METHODS

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all().order_by('-created_at')
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        comment = self.get_object()
        user = request.user
        now = timezone.now()

        is_comment_author = comment.user == user
        is_post_author = comment.post.user == user
        is_recent = (now - comment.created_at) <= timedelta(minutes=5)

        if is_comment_author and is_recent:
            return super().destroy(request, *args, **kwargs)
        elif is_post_author:
            return super().destroy(request, *args, **kwargs)
        else:
            return Response(
                {"detail": "Удалять комментарий может только автор в течение 5 минут или автор поста."},
                status=status.HTTP_403_FORBIDDEN
            )

class PostViewSet(viewsets.ModelViewSet):

    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Post.objects.all().order_by("-created_at")
        user_id = self.request.query_params.get("user")
        group_id = self.request.query_params.get("group")
        hashtag = self.request.query_params.get("hashtag")

        if user_id:
            queryset = queryset.filter(user_id=user_id, group__isnull=True, is_hidden=False)

        if group_id:
            queryset = queryset.filter(group_id=group_id, is_hidden=False)

        if hashtag:
            hashtag = hashtag.lower()
            queryset = queryset.filter(hashtags__icontains=hashtag, is_hidden=False)

        if not user_id and not group_id and not hashtag:
            queryset = queryset.filter(user=self.request.user, group__isnull=True, is_hidden=False)

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

        for image_file in self.request.FILES.getlist("images")[:10]:
            PostImage.objects.create(post=post, image=image_file)

    def destroy(self, request, *args, **kwargs):
        post = self.get_object()

        is_author = post.user == request.user
        
        if not is_author:
            return Response({'detail': 'У тебя нет прав удалить этот пост.'}, status=status.HTTP_403_FORBIDDEN)

        # Если это репост, уменьшаем счетчик репостов у оригинального поста
        if post.original_post:
            original = post.original_post
            original.repost_count = max(0, original.repost_count - 1)
            original.save()
            
        # Если у поста есть репосты и мы удаляем оригинал
        # обновляем счетчики и связи для репостов
        if not post.original_post and post.reposts.exists():
            for repost in post.reposts.all():
                # Делаем репосты "сиротами"
                repost.original_post = None
                repost.save()

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
            Q(user_id__in=friend_ids) | Q(group_id__in=group_ids),
            is_hidden=False
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

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_comment_like(request, comment_id):
    try:
        comment = Comment.objects.get(id=comment_id)
    except Comment.DoesNotExist:
        return Response({"error": "Комментарий не найден"}, status=404)

    user = request.user
    like, created = CommentLike.objects.get_or_create(user=user, comment=comment)

    if not created:
        like.delete()
        liked = False
    else:
        liked = True

    return Response({
        "likes_count": comment.likes.count(),
        "liked_by_user": liked
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def repost_post(request, pk):
    try:
        original = Post.objects.get(pk=pk)
    except Post.DoesNotExist:
        return Response({'error': 'Пост не найден'}, status=404)

    if original.original_post:
        root_post = original.original_post  # если уже репост, берем оригинал
    else:
        root_post = original

    # Получаем group_id из данных запроса
    group_id = request.data.get('group_id')
    group = None
    
    # Если указана группа, проверяем доступ
    if group_id:
        try:
            group = Group.objects.get(pk=group_id)
            # Проверка на членство в группе (опционально)
            if not request.user.subscribed_groups.filter(id=group_id).exists():
                return Response({'error': 'Вы не являетесь участником этой группы'}, status=403)
        except Group.DoesNotExist:
            return Response({'error': 'Группа не найдена'}, status=404)

    # Создаем репост
    repost = Post.objects.create(
        user=request.user,
        content=request.data.get('content', ''),  # Позволяем добавить комментарий к репосту
        hashtags=[],  # Можно также взять хэштеги из оригинала при необходимости
        original_post=root_post,
        group=group,  # Используем значение из запроса (может быть None)
    )

    # Увеличиваем счетчик репостов оригинала
    root_post.repost_count += 1
    root_post.save()

    serializer = PostSerializer(repost, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def share_post_to_chat(request, chat_id):
    try:
        post_id = request.data.get('post_id')
        print("DEBUG post_id:", post_id)
        post = Post.objects.get(pk=post_id)
        post.repost_count += 1
        post.save()
        chat = Dialog.objects.get(pk=chat_id)

        if chat.is_group:
            if not chat.participants.filter(id=request.user.id).exists():
                return Response({'error': 'Вы не являетесь участником этого чата'}, status=403)
        else:
            if request.user != chat.user1 and request.user != chat.user2:
                return Response({'error': 'Вы не участник этого диалога'}, status=403)

        message = Message.objects.create(
            dialog=chat,
            sender=request.user,
            receiver=None if chat.is_group else (chat.user2 if chat.user1 == request.user else chat.user1),
            text=request.data.get("comment", "Делюсь постом"),
            shared_post=post  # 🆕 прикрепляем пост
        )


        return Response({'success': True}, status=201)

    except Post.DoesNotExist:
        return Response({'error': 'Пост не найден'}, status=404)
    except Dialog.DoesNotExist:
        return Response({'error': 'Чат не найден'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

class IsReporterOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user == obj.reporter or request.user.is_staff

class PostReportViewSet(viewsets.ModelViewSet):
    serializer_class = PostReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = PostReport.objects.all()

        if user.is_staff:
            qs = qs.filter(is_resolved=False)
        else:
            qs = qs.filter(reporter=user, is_resolved=False)

        post_id = self.request.query_params.get("post")
        if post_id:
            qs = qs.filter(post_id=post_id)

        return qs

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsAuthenticated()]
        if self.action in ["create"]:
            return [IsAuthenticated()]
        return [IsReporterOrAdmin()]

    # В views.py, добавьте логирование в perform_create
    def perform_create(self, serializer):
        print("Данные запроса:", self.request.data)
        try:
            serializer.save(reporter=self.request.user)
        except Exception as e:
            print(f"Ошибка при создании отчета: {str(e)}")
            raise

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        # Сохраняем изменения в жалобе
        self.perform_update(serializer)

        # 💥 Если жалоба была одобрена (удалить пост) — скрываем сам пост
        is_deleted = serializer.validated_data.get("is_deleted")
        if is_deleted is True:
            post = instance.post
            post.is_hidden = True
            post.save()

        return Response(serializer.data)
