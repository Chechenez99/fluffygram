from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),  # ✅ правильно
    path('api/pets/', include('pets.urls')),
    path('api/posts/', include('posts.urls')),
    path('api/groups/', include('groups.urls')),
    path('api/direct_messages/', include('direct_messages.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
