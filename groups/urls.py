from django.urls import path
from . import views

urlpatterns = [
    path('', views.GroupListCreateView.as_view(), name='group-list-create'),
    path('my/', views.MyGroupsView.as_view(), name='my-groups'),
    path('subscribed/', views.SubscribedGroupsView.as_view(), name='subscribed-groups'),
    path('<int:pk>/', views.GroupDetailView.as_view(), name='group-detail'),
    path('<int:pk>/subscribe/', views.GroupSubscribeView.as_view(), name='group-subscribe'),
    path('<int:pk>/subscribers/', views.GroupSubscribersView.as_view(), name='group-subscribers'),
    
]
