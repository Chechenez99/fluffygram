# pet_social/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),       # пользователи
    path('api/pets/', include('pets.urls')),     # питомцы
    path('api/posts/', include('posts.urls')),
    path('api/groups/', include('groups.urls')),  # путь для групп
    path('api/users/', include('users.urls')),
    path('api/direct_messages/', include('direct_messages.urls')),     # пользователи
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
