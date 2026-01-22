"""
Django settings for app project.
"""

from pathlib import Path
from decouple import config
from dotenv import load_dotenv
import os
from datetime import timedelta

# Load environment variables
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# Security
SECRET_KEY = config('SECRET_KEY', default='unsafe-secret-key')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='*').split(',')

AUTH_USER_MODEL = 'aplication.CustomUser'

# Installed apps
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    'storages',

    # Local apps
    'aplication',
    'authentication.apps.AuthenticationConfig',
]

# Middleware
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # must be first
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'authentication.middleware.JWTEnterpriseMiddleware',  # custom JWT middleware
]

ROOT_URLCONF = 'app.urls'

# Templates
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'app.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_DATABASE'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST'),
        'PORT': config('DB_PORT'),
        'OPTIONS': {'sslmode': 'require'},
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static & Media
STATIC_URL = '/static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / "media"
STATIC_ROOT = BASE_DIR / "staticfiles"

POPPLER_PATH = config('POPPLER_PATH', default=None)  

# Security headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Rate limits
MAX_LOGIN_ATTEMPTS = 5
RATE_LIMITS = {
    'LOGIN_ATTEMPTS': 5,
    'REFRESH_ATTEMPTS': 10,
    'GLOBAL_LOGOUT_ATTEMPTS': 3,
    'RATE_LIMIT_WINDOW': 900,
}

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer'
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'authentication.authentication.JWTCookieAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
    ],
}

# JWT configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'AUTH_COOKIE': 'access_token',
    'AUTH_COOKIE_REFRESH': 'refresh_token',
    'AUTH_COOKIE_DOMAIN': None,
    'AUTH_COOKIE_PATH': '/',
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# CORS default settings
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_METHODS = [
    "DELETE", "GET", "OPTIONS", "PATCH", "POST", "PUT",
]
CORS_ALLOW_HEADERS = [
    "accept", "accept-encoding", "authorization", "content-type",
    "dnt", "origin", "user-agent", "x-csrftoken", "x-requested-with",
]

# Environment-specific settings
if DEBUG:
    print("🚀 Running in DEVELOPMENT mode")

    # Local CORS & CSRF
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS.copy()

    # Cookies for dev
    SESSION_COOKIE_SECURE = False
    SESSION_COOKIE_SAMESITE = 'Lax'
    CSRF_COOKIE_SECURE = False
    CSRF_COOKIE_SAMESITE = 'Lax'
    SIMPLE_JWT.update({
        'AUTH_COOKIE_SECURE': False,
        'AUTH_COOKIE_SAMESITE': 'Lax',
    })

    SECURE_SSL_REDIRECT = False
    SECURE_HSTS_SECONDS = 0
    SECURE_HSTS_INCLUDE_SUBDOMAINS = False
    SECURE_HSTS_PRELOAD = False

else:
    print("🔒 Running in PRODUCTION mode")

    # Production CORS & CSRF
    CORS_ALLOWED_ORIGINS = [
        "https://altqll.vercel.app",
    ]
    CSRF_TRUSTED_ORIGINS = [
        "https://altqll.vercel.app",
    ]

    # Cookies for prod
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_SAMESITE = 'None'
    CSRF_COOKIE_SECURE = True
    CSRF_COOKIE_SAMESITE = 'None'
    SIMPLE_JWT.update({
        'AUTH_COOKIE_SECURE': True,
        'AUTH_COOKIE_SAMESITE': 'None',
    })

    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
