from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, CommentViewSet, NewsFeedView, toggle_like, toggle_comment_like, repost_post, share_post_to_chat
from .views import PostReportViewSet

router = DefaultRouter()
router.register(r'post-reports', PostReportViewSet, basename='postreport')  # Сначала более специфичный
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'', PostViewSet, basename='post')  # Самый общий — внизу


urlpatterns = [
    path('newsfeed/', NewsFeedView.as_view(), name='newsfeed'),
    path('<int:pk>/repost/', repost_post, name='repost-post'), # Перенесли вверх!
    path('', include(router.urls)),  # Потом уже роутер
    path('<int:post_id>/like/', toggle_like),
    path("comments/<int:comment_id>/like/", toggle_comment_like, name="toggle-comment-like"),
    path('chats/<int:chat_id>/share/', share_post_to_chat, name='share-post-to-chat'),
]
