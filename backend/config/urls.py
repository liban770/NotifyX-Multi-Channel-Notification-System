from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/organizations/', include('apps.organizations.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/templates/', include('apps.templates.urls')),
    path('api/v1/preferences/', include('apps.preferences.urls')),
    path('api/v1/providers/', include('apps.providers.urls')),
    path('api/v1/api-keys/', include('apps.api_keys.urls')),
    path('api/v1/analytics/', include('apps.analytics.urls')),
    path('api/v1/audit-logs/', include('apps.audit_logs.urls')),
]
