"""
Django settings for NotifyX Enterprise Notification Platform.
"""
import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-notifyx-enterprise-key-production-ready')
DEBUG = os.environ.get('DEBUG', '1') == '1'
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    # NotifyX Apps
    'apps.accounts',
    'apps.organizations',
    'apps.notifications',
    'apps.templates',
    'apps.channels',
    'apps.providers',
    'apps.preferences',
    'apps.scheduling',
    'apps.api_keys',
    'apps.analytics',
    'apps.audit_logs',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_DB', 'notifyx_db'),
        'USER': os.environ.get('POSTGRES_USER', 'notifyx_user'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'notifyx_secret_password'),
        'HOST': os.environ.get('POSTGRES_HOST', 'localhost'),
        'PORT': os.environ.get('POSTGRES_PORT', '5432'),
    }
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'apps.api_keys.authentication.APIKeyAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 25,
    'EXCEPTION_HANDLER': 'apps.notifications.exceptions.custom_exception_handler',
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}

CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
CELERY_TASK_ROUTES = {
    'apps.notifications.tasks.dispatch_single_notification': {'queue': 'default'},
    'apps.notifications.tasks.dispatch_critical_notification': {'queue': 'high_priority'},
    'apps.notifications.tasks.dispatch_bulk_notifications': {'queue': 'bulk'},
}

CORS_ALLOW_ALL_ORIGINS = True
AUTH_USER_MODEL = 'accounts.User'
TIME_ZONE = 'UTC'
USE_TZ = True
