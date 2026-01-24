"""
Django settings for app project (React + Django JWT via Authorization headers)
"""

from pathlib import Path
from decouple import config
from dotenv import load_dotenv
from datetime import timedelta
import platform
import os

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent


# ------------------------------------------------------------------------------
# CORE
# ------------------------------------------------------------------------------
SECRET_KEY = config('SECRET_KEY', default='unsafe-secret-key')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='*').split(',')


# SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
# SUPABASE_KEY = os.getenv("VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY")


SUPABASE_URL = os.getenv("SUPABASE_URL")  # Ej: https://xyzcompany.supabase.co
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # Service role key

AUTH_USER_MODEL = 'aplication.CustomUser'


SYSTEM = platform.system()  # Detecta 'Windows', 'Linux', 'Darwin' (macOS)

if SYSTEM == "Windows":
    POPPLER_PATH = os.getenv(
        "POPPLER_PATH_WIN",
        r"C:/poppler-25.12.0/Library/bin"
    )
else:
    # Linux (Render) y macOS → usar PATH del sistema
    POPPLER_PATH = None
print(f"🖨️ POPPLER_PATH detectado: {POPPLER_PATH}")

# ------------------------------------------------------------------------------
# APPS
# ------------------------------------------------------------------------------
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
    'rest_framework_simplejwt.token_blacklist',  # AGREGADO para blacklist
    'csp',

    # Local
    'aplication',
    'authentication.apps.AuthenticationConfig',
]

# ------------------------------------------------------------------------------
# MIDDLEWARE (ORDEN CRÍTICO)
# ------------------------------------------------------------------------------
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',

    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',

    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',

    'csp.middleware.CSPMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'app.urls'
WSGI_APPLICATION = 'app.wsgi.application'

# ------------------------------------------------------------------------------
# TEMPLATES (ADMIN)
# ------------------------------------------------------------------------------
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

# ------------------------------------------------------------------------------
# DATABASE
# ------------------------------------------------------------------------------
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

# ------------------------------------------------------------------------------
# AUTH / PASSWORDS
# ------------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ------------------------------------------------------------------------------
# I18N
# ------------------------------------------------------------------------------
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ------------------------------------------------------------------------------
# STATIC
# ------------------------------------------------------------------------------
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / "media"

# ------------------------------------------------------------------------------
# DJANGO REST + JWT (HEADERS)
# ------------------------------------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    
    # IMPORTANTE: Algoritmo y configuración de firma
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,
    
    # Configuración de tokens
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',
    
    'JTI_CLAIM': 'jti',
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}

# ------------------------------------------------------------------------------
# CORS (JWT POR HEADERS → NO COOKIES)
# ------------------------------------------------------------------------------
CORS_ALLOW_CREDENTIALS = False
CORS_ALLOW_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "origin",
    "user-agent",
    "x-requested-with",
]

# ------------------------------------------------------------------------------
# CSP (FORMATO NUEVO django-csp >= 4.0)
# ------------------------------------------------------------------------------
CONTENT_SECURITY_POLICY = {
    "DIRECTIVES": {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "https:"],
        "font-src": ["'self'", "data:"],
        "connect-src": ["'self'"],  # Se actualizará por entorno
        "frame-ancestors": ["'none'"],
    }
}

# ------------------------------------------------------------------------------
# ENV
# ------------------------------------------------------------------------------
if DEBUG:
    print("🚀 Running in DEVELOPMENT mode")
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    # CSP debe permitir conexiones al backend local
    CONTENT_SECURITY_POLICY["DIRECTIVES"]["connect-src"] = [
        "'self'", 
        "http://localhost:8000", 
        "http://127.0.0.1:8000"
    ]
    SECURE_SSL_REDIRECT = False
    
    # Logging para debug
    LOGGING = {
        'version': 1,
        'disable_existing_loggers': False,
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
            },
        },
        'loggers': {
            'auth_audit': {
                'handlers': ['console'],
                'level': 'INFO',
            },
            'rest_framework_simplejwt': {
                'handlers': ['console'],
                'level': 'DEBUG',
            },
        },
    }
else:
    print("🔒 Running in PRODUCTION mode")
    CORS_ALLOWED_ORIGINS = ["https://altqll.vercel.app"]
    # CSP debe permitir conexiones al backend de producción
    PRODUCTION_BACKEND_URL = config('PRODUCTION_BACKEND_URL', default='https://altqll-backend.onrender.com/')
    CONTENT_SECURITY_POLICY["DIRECTIVES"]["connect-src"] = [
        "'self'", 
        PRODUCTION_BACKEND_URL
    ]
    
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')