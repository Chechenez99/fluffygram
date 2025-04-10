from django.urls import path
from .views import (
    DialogListView,
    DialogCreateView,
    MessageListView,
    MessageCreateView,
    delete_dialog_self,
    delete_dialog_all,
)
from .views import mark_messages_read  
from .views import get_unread_messages
from .views import create_or_get_dialog 
from .views import create_group_chat
from .views import update_group_chat


urlpatterns = [
    path('dialogs/', DialogListView.as_view(), name='dialog-list'),
    path('dialogs/create/', DialogCreateView.as_view(), name='dialog-create'),
    path('dialogs/<int:dialog_id>/messages/', MessageListView.as_view(), name='message-list'),
    path('messages/create/', MessageCreateView.as_view(), name='message-create'),
    path('dialogs/<int:dialog_id>/delete/', delete_dialog_self),
    path('dialogs/<int:dialog_id>/delete_all/', delete_dialog_all),
    path('messages/mark_read/', mark_messages_read),
    path('unread/', get_unread_messages, name='get-unread-messages'),
    path('dialogs/start/', create_or_get_dialog, name='create-or-get-dialog'),
    path("group_chats/", create_group_chat),
    path("group_chats/<int:dialog_id>/", update_group_chat),

]

