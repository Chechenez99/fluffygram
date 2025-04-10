from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, NewsFeedView
from .views import toggle_like

router = DefaultRouter()
router.register(r'', PostViewSet, basename='post')

urlpatterns = [
    path('newsfeed/', NewsFeedView.as_view(), name='newsfeed'),  # Перенесли вверх!
    path('', include(router.urls)),  # Потом уже роутер
    path('<int:post_id>/like/', toggle_like),
]

