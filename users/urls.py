from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FriendRequestViewSet,
    UserProfileView,
    UserSearchView,
    FriendsListView,
    RemoveFriendView,
    UserDetailView,
    CustomTokenCreateView,
    IncomingFriendRequestsView,
    OutgoingFriendRequestsView,
)

router = DefaultRouter()
router.register(r'friend-requests', FriendRequestViewSet, basename='friend-request')

urlpatterns = [
    # Важные кастомные пути — выше, чтобы не конфликтовали с router
    path('friend-requests/incoming/', IncomingFriendRequestsView.as_view(), name='incoming-friend-requests'),
    path('friend-requests/outgoing/', OutgoingFriendRequestsView.as_view(), name='outgoing-friend-requests'),

    # Аутентификация и профиль
    path("auth/", include("djoser.urls")),
    # path("auth/", include("djoser.urls.jwt")),  # можешь раскомментировать при необходимости
    path('auth/jwt/create/', CustomTokenCreateView.as_view(), name='jwt-create'),
    path("profile/me/", UserProfileView.as_view(), name="user-profile"),

    # Пользователи
    path('search/', UserSearchView.as_view(), name='user-search'),
    path('friends/', FriendsListView.as_view(), name='friends-list'),
    path('friends/remove/<int:user_id>/', RemoveFriendView.as_view(), name='remove-friend'),
    path("<int:pk>/", UserDetailView.as_view(), name="user-detail"),

    # router — в самом конце, чтобы не перебивал другие пути
    path('', include(router.urls)),
]
