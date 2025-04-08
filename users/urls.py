from django.urls import path, include
from .views import UserProfileView
from rest_framework.routers import DefaultRouter
from .views import FriendRequestViewSet
from django.urls import path
from .views import UserSearchView
from .views import FriendsListView
from .views import RemoveFriendView
from .views import UserDetailView 
from .views import CustomTokenCreateView

router = DefaultRouter()
router.register(r'friend-requests', FriendRequestViewSet, basename='friend-request')

urlpatterns = [
    path("auth/", include("djoser.urls")),  # Основные URL-ы Djoser
    #path("auth/", include("djoser.urls.jwt")),  # JWT URL-ы
    path("profile/me/", UserProfileView.as_view(), name="user-profile"),
    path('', include(router.urls)),
    path('search/', UserSearchView.as_view(), name='user-search'),
    path('friends/', FriendsListView.as_view(), name='friends-list'),
    path('friends/remove/<int:user_id>/', RemoveFriendView.as_view(), name='remove-friend'),
    path("users/<int:pk>/", UserDetailView.as_view(), name="user-detail"),
    path('auth/jwt/create/', CustomTokenCreateView.as_view(), name='jwt-create'),
]
