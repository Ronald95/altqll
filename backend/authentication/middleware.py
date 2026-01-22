import logging
import hashlib
import threading
from datetime import datetime, timedelta
from django.core.cache import cache
from django.conf import settings
from django.http import JsonResponse
from django.utils.timezone import now
from rest_framework_simplejwt.tokens import UntypedToken, RefreshToken, AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken

logger = logging.getLogger('security')
audit_logger = logging.getLogger('auth_audit')

# Rutas que NO requieren autenticación
PUBLIC_PATHS = [
    '/',
    '/about',
    '/contact',
    '/signin',
    '/register',
    '/signup',
    '/api/auth/login/',
    '/api/auth/register/',
    '/api/auth/token/',
]

class JWTEnterpriseMiddleware:
    """
    Middleware JWT Enterprise:
    - Silent refresh con fingerprint de dispositivo
    - Logout global de todas las sesiones de un usuario
    - Rotación de refresh tokens en background
    - Blacklist automático
    - Gestión de sesión en cache
    - Cookies cross-site seguras
    - Auditoría y logging
    """

    ACCESS_REFRESH_THRESHOLD = timedelta(minutes=5)
    REFRESH_REFRESH_THRESHOLD = timedelta(hours=6)

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path
        
        # --- rutas públicas: no hacer nada ---
        if self.is_public_path(path):
            return self.get_response(request)

        access_token = request.COOKIES.get(settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token'))
        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token'))
        session_id = request.COOKIES.get('session_id')
        fingerprint = self.get_device_fingerprint(request)

        new_access_token = None
        new_refresh_token = None

        # --- Si no hay tokens, denegar acceso a rutas protegidas ---
        if not access_token and not refresh_token:
            return JsonResponse({
                "error": "Authentication required",
                "redirect": "/signin"
            }, status=401)

        # --- blacklist de access token ---
        if access_token and self.is_blacklisted(access_token):
            return JsonResponse({
                "error": "Access token invalidated",
                "redirect": "/signin"
            }, status=401)

        # --- Validar access token ---
        access_valid = False
        if access_token:
            try:
                access_obj = AccessToken(access_token)
                access_exp = datetime.fromtimestamp(access_obj['exp'])
                remaining_access = access_exp - datetime.utcnow()
                
                if remaining_access.total_seconds() > 0:
                    access_valid = True
                    # Silent refresh si está cerca de expirar
                    if remaining_access < self.ACCESS_REFRESH_THRESHOLD and refresh_token:
                        new_access_token = self.refresh_access_token(refresh_token, fingerprint, session_id)
                else:
                    logger.info("Access token expirado")
            except (TokenError, InvalidToken) as e:
                logger.warning(f"Access token inválido: {str(e)}")

        # --- Si access token no es válido, intentar refresh ---
        if not access_valid and refresh_token:
            new_access_token = self.refresh_access_token(refresh_token, fingerprint, session_id)
            if new_access_token:
                access_valid = True
            else:
                return JsonResponse({
                    "error": "Session expired",
                    "redirect": "/signin"
                }, status=401)

        # --- Si aún no hay token válido, denegar ---
        if not access_valid:
            return JsonResponse({
                "error": "Invalid authentication",
                "redirect": "/signin"
            }, status=401)

        # --- rotación refresh token background ---
        if refresh_token:
            try:
                refresh_obj = RefreshToken(refresh_token)
                refresh_exp = datetime.fromtimestamp(refresh_obj['exp'])
                remaining_refresh = refresh_exp - datetime.utcnow()
                if remaining_refresh < self.REFRESH_REFRESH_THRESHOLD:
                    new_refresh_token = self.rotate_refresh_token_bg(refresh_token, fingerprint, session_id)
            except (TokenError, InvalidToken):
                logger.warning("Refresh token inválido durante rotación background")

        # --- actualizar sesión en cache ---
        self.update_session(request, session_id, fingerprint)

        # --- headers de seguridad ---
        self.add_security_headers(request)

        response = self.get_response(request)

        # --- set cookies si hay nuevos tokens ---
        if new_access_token:
            self.set_access_cookie(response, new_access_token)
            audit_logger.info(f"Access token refreshed silently for IP {self.get_client_ip(request)}")

        if new_refresh_token:
            self.set_refresh_cookie(response, new_refresh_token)
            audit_logger.info(f"Refresh token rotated silently for IP {self.get_client_ip(request)}")

        self.enhance_response_security(response)

        return response

    def is_public_path(self, path):
        """Verifica si la ruta es pública"""
        # Coincidencia exacta
        if path in PUBLIC_PATHS:
            return True
        # Coincidencia con prefijo (para rutas con parámetros)
        for public_path in PUBLIC_PATHS:
            if path.startswith(public_path.rstrip('/')):
                return True
        return False

    # -------------------- blacklist --------------------
    def is_blacklisted(self, access_token):
        try:
            token_hash = hashlib.sha256(access_token.encode()).hexdigest()
            is_blacklisted = cache.get(f"blacklist_access:{token_hash}")
            if is_blacklisted:
                logger.warning(f"Blacklisted token used from IP {self.get_client_ip()}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error validando token blacklist: {str(e)}")
            return False

    # -------------------- refresh / rotation --------------------
    def refresh_access_token(self, refresh_token, fingerprint, session_id):
        try:
            token = RefreshToken(refresh_token)
            new_access = token.access_token
            self.log_refresh(new_access, fingerprint, session_id)
            return str(new_access)
        except Exception as e:
            logger.warning(f"Error refrescando access token: {str(e)}")
            return None

    def rotate_refresh_token_bg(self, refresh_token, fingerprint, session_id):
        """Nota: Retorna el nuevo token para actualizar la cookie"""
        try:
            old_token = RefreshToken(refresh_token)
            new_token = old_token.rotate()
            
            # Blacklist del token antiguo (sin thread para evitar race conditions)
            try:
                old_token.blacklist()
            except Exception as e:
                logger.warning(f"Error blacklisting old refresh token: {str(e)}")
            
            self.log_refresh(new_token, fingerprint, session_id)
            return str(new_token)
        except Exception as e:
            logger.warning(f"Error rotando refresh token: {str(e)}")
            return None

    # -------------------- session --------------------
    def update_session(self, request, session_id, fingerprint):
        if not session_id:
            return
        key = f"session:{session_id}"
        session_data = cache.get(key) or {}
        session_data.update({
            'last_activity': now().isoformat(),
            'ip_address': request.META.get('REMOTE_ADDR'),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'fingerprint': fingerprint
        })
        cache.set(key, session_data, timeout=7200)

    # -------------------- device fingerprint --------------------
    def get_device_fingerprint(self, request):
        components = [
            request.META.get('HTTP_USER_AGENT', ''),
            request.META.get('HTTP_ACCEPT_LANGUAGE', ''),
            request.META.get('HTTP_ACCEPT_ENCODING', '')
        ]
        fp_str = '|'.join(components)
        return hashlib.sha256(fp_str.encode()).hexdigest()[:16]

    def log_refresh(self, token, fingerprint, session_id):
        try:
            token_hash = hashlib.sha256(str(token).encode()).hexdigest()
            key = f"refresh_log:{token_hash}"
            data = {
                'session_id': session_id,
                'fingerprint': fingerprint,
                'timestamp': now().isoformat()
            }
            cache.set(key, data, timeout=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds())
            audit_logger.info(f"Refresh token logged: session={session_id}, fingerprint={fingerprint}")
        except Exception as e:
            logger.warning(f"Error logueando refresh: {str(e)}")

    # -------------------- cookies --------------------
    def set_access_cookie(self, response, access_token):
        exp = now() + settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
        response.set_cookie(
            key=settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token'),
            value=access_token,
            expires=exp,
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Lax' if settings.DEBUG else 'None',
            domain=settings.SIMPLE_JWT.get('AUTH_COOKIE_DOMAIN'),
            path=settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/')
        )

    def set_refresh_cookie(self, response, refresh_token):
        exp = now() + settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']
        response.set_cookie(
            key=settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token'),
            value=refresh_token,
            expires=exp,
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Lax' if settings.DEBUG else 'None',
            domain=settings.SIMPLE_JWT.get('AUTH_COOKIE_DOMAIN'),
            path='/'
        )

    # -------------------- security --------------------
    def add_security_headers(self, request):
        if hasattr(request, 'COOKIES'):
            total_size = sum(len(k)+len(v) for k,v in request.COOKIES.items())
            if total_size > 4096:
                logger.warning(f"Oversized cookies from IP {self.get_client_ip(request)}")
        ua = request.META.get('HTTP_USER_AGENT', '')
        if self.is_suspicious_user_agent(ua):
            logger.warning(f"Suspicious User-Agent: {ua[:100]}")

    def enhance_response_security(self, response):
        headers = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
        }
        for k,v in headers.items():
            if k not in response:
                response[k] = v

    def is_suspicious_user_agent(self, ua):
        if not ua or len(ua) < 10:
            return True
        suspicious = ['sqlmap','nmap','masscan','nessus','nikto','dirb','dirbuster','gobuster','wfuzz','burp','owasp']
        ua_lower = ua.lower()
        return any(p in ua_lower for p in suspicious)

    def get_client_ip(self, request=None):
        if not request:
            return '0.0.0.0'
        xff = request.META.get('HTTP_X_FORWARDED_FOR')
        if xff:
            ip = xff.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    # -------------------- logout global --------------------
    @staticmethod
    def global_logout(user):
        try:
            tokens = OutstandingToken.objects.filter(user=user)
            for token in tokens:
                try:
                    RefreshToken(token.token).blacklist()
                except:
                    pass
            logger.info(f"Global logout completed for user {user.id}")
        except Exception as e:
            logger.warning(f"Error en global logout: {str(e)}")