import logging
from django.utils.timezone import now
from django.conf import settings
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import never_cache
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
import secrets
import hashlib
from authentication.middleware import JWTEnterpriseMiddleware

logger = logging.getLogger('auth_audit')
security_logger = logging.getLogger('security')

# ------------------- LOGIN -------------------
@method_decorator([csrf_exempt, never_cache], name='dispatch')
class EnterpriseTokenObtainPairView(TokenObtainPairView):
    """Login seguro con httpOnly cookies"""
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')
            
            if access_token and refresh_token:
                session_id = secrets.token_urlsafe(32)
                access_exp = now() + settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
                refresh_exp = now() + settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']

                is_secure = not settings.DEBUG
                same_site = 'Lax' if settings.DEBUG else 'None'

                # Set cookies
                response.set_cookie(
                    key=settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token'),
                    value=access_token,
                    expires=access_exp,
                    httponly=True,
                    secure=is_secure,
                    samesite=same_site,
                    domain=settings.SIMPLE_JWT.get('AUTH_COOKIE_DOMAIN'),
                    path='/'
                )
                
                response.set_cookie(
                    key=settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token'),
                    value=refresh_token,
                    expires=refresh_exp,
                    httponly=True,
                    secure=is_secure,
                    samesite=same_site,
                    domain=settings.SIMPLE_JWT.get('AUTH_COOKIE_DOMAIN'),
                    path='/'
                )
                
                response.set_cookie(
                    key='session_id',
                    value=session_id,
                    expires=refresh_exp,
                    httponly=True,
                    secure=is_secure,
                    samesite=same_site,
                    domain=settings.SIMPLE_JWT.get('AUTH_COOKIE_DOMAIN'),
                    path='/'
                )

                # Cache session
                middleware = JWTEnterpriseMiddleware(None)
                fingerprint = middleware.get_device_fingerprint(request)
                
                token_obj = AccessToken(access_token)
                user_id = token_obj.get('user_id')
                
                session_data = {
                    'user_id': user_id,
                    'ip_address': middleware.get_client_ip(request),
                    'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                    'fingerprint': fingerprint,
                    'access_token_hash': hashlib.sha256(access_token.encode()).hexdigest(),
                    'refresh_token_hash': hashlib.sha256(refresh_token.encode()).hexdigest(),
                    'created_at': now().isoformat(),
                    'last_activity': now().isoformat()
                }
                cache.set(f"session:{session_id}", session_data, timeout=7200)

                logger.info(f"Login successful: user={user_id}, IP={middleware.get_client_ip(request)}, session={session_id}")

                response.data = {
                    'message': 'Login successful',
                    'redirect': '/home',
                    'session_id': session_id,
                    'expires_in': int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds())
                }
        
        return response


# ------------------- REFRESH -------------------
@method_decorator([csrf_exempt, never_cache], name='dispatch')
class EnterpriseTokenRefreshView(TokenRefreshView):
    """Refresh token view"""
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(
            settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token')
        )
        
        if not refresh_token:
            return Response(
                {"error": "Refresh token not found", "redirect": "/signin"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        request.data._mutable = True if hasattr(request.data, '_mutable') else None
        request.data['refresh'] = refresh_token
        
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            access_token = response.data.get('access')
            new_refresh_token = response.data.get('refresh')
            session_id = request.COOKIES.get('session_id')
            
            middleware = JWTEnterpriseMiddleware(None)
            fingerprint = middleware.get_device_fingerprint(request)
            
            is_secure = not settings.DEBUG
            same_site = 'Lax' if settings.DEBUG else 'None'

            if access_token:
                access_exp = now() + settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
                response.set_cookie(
                    key=settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token'),
                    value=access_token,
                    expires=access_exp,
                    httponly=True,
                    secure=is_secure,
                    samesite=same_site,
                    domain=settings.SIMPLE_JWT.get('AUTH_COOKIE_DOMAIN'),
                    path='/'
                )

            if new_refresh_token and new_refresh_token != refresh_token:
                refresh_exp = now() + settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']
                response.set_cookie(
                    key=settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token'),
                    value=new_refresh_token,
                    expires=refresh_exp,
                    httponly=True,
                    secure=is_secure,
                    samesite=same_site,
                    domain=settings.SIMPLE_JWT.get('AUTH_COOKIE_DOMAIN'),
                    path='/'
                )

            if session_id:
                session_data = cache.get(f"session:{session_id}", {})
                session_data.update({
                    'last_activity': now().isoformat(),
                    'last_refresh': now().isoformat(),
                    'fingerprint': fingerprint,
                    'ip_address': middleware.get_client_ip(request)
                })
                
                if access_token:
                    session_data['access_token_hash'] = hashlib.sha256(access_token.encode()).hexdigest()
                if new_refresh_token:
                    session_data['refresh_token_hash'] = hashlib.sha256(new_refresh_token.encode()).hexdigest()
                
                cache.set(f"session:{session_id}", session_data, timeout=7200)

            logger.info(f"Token refreshed: session={session_id}")

            response.data = {
                'message': 'Token refreshed successfully',
                'expires_in': int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds())
            }

        return response


# ------------------- LOGOUT -------------------
@method_decorator([csrf_exempt, never_cache], name='dispatch')
class EnterpriseLogoutView(APIView):
    """
    Logout view - NO requiere autenticación previa por el middleware
    Procesa cookies directamente
    """
    permission_classes = [AllowAny]  # ← CRÍTICO: AllowAny para que el middleware no bloquee

    def post(self, request):
        session_id = request.COOKIES.get('session_id')
        access_token = request.COOKIES.get(
            settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token')
        )
        refresh_token = request.COOKIES.get(
            settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token')
        )

        logout_success = False

        # Blacklist access token
        if access_token:
            try:
                token_hash = hashlib.sha256(access_token.encode()).hexdigest()
                ttl = int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds())
                cache.set(f"blacklist_access:{token_hash}", True, timeout=ttl)
                logger.info(f"Access token blacklisted: {token_hash[:16]}")
                logout_success = True
            except Exception as e:
                logger.error(f"Error blacklisting access token: {str(e)}")
        
        # Blacklist refresh token
        if refresh_token:
            try:
                token_obj = RefreshToken(refresh_token)
                token_obj.blacklist()
                logger.info(f"Refresh token blacklisted")
                logout_success = True
            except Exception as e:
                logger.warning(f"Error blacklisting refresh token: {str(e)}")
        
        # Eliminar sesión
        if session_id:
            try:
                cache.delete(f"session:{session_id}")
                logger.info(f"Session deleted: {session_id}")
                logout_success = True
            except Exception as e:
                logger.error(f"Error deleting session: {str(e)}")

        # Crear respuesta
        response = Response({
            "success": logout_success,
            "message": "Logout successful" if logout_success else "Logout completed (no active session)",
            "redirect": "/"
        }, status=200)

        # Eliminar TODAS las cookies
        cookie_domain = settings.SIMPLE_JWT.get('AUTH_COOKIE_DOMAIN')
        is_secure = not settings.DEBUG
        same_site = 'Lax' if settings.DEBUG else 'None'
        
        cookies_to_delete = [
            'access_token',
            'refresh_token',
            'session_id',
            'csrftoken',
        ]
        
        for cookie_name in cookies_to_delete:
            response.delete_cookie(
                cookie_name,
                path='/',
                domain=cookie_domain,
                samesite=same_site
            )
            # Intentar eliminar también sin dominio (por si acaso)
            response.delete_cookie(
                cookie_name,
                path='/',
                samesite=same_site
            )

        # Headers anti-cache
        response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        
        logger.info(f"Logout completed: session={session_id}, tokens_cleared={logout_success}")
        
        return response


# ------------------- LOGOUT GLOBAL -------------------
@method_decorator([csrf_exempt, never_cache], name='dispatch')
class EnterpriseGlobalLogoutView(APIView):
    """
    Global logout - cierra todas las sesiones del usuario
    """
    permission_classes = [AllowAny]

    def post(self, request):
        # Intentar obtener user desde el token
        access_token = request.COOKIES.get(
            settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token')
        )
        
        user = None
        if access_token:
            try:
                token_obj = AccessToken(access_token)
                user_id = token_obj.get('user_id')
                from django.contrib.auth import get_user_model
                User = get_user_model()
                user = User.objects.get(id=user_id)
            except Exception as e:
                logger.warning(f"Could not get user from token: {str(e)}")

        # Logout global si tenemos el usuario
        if user:
            JWTEnterpriseMiddleware.global_logout(user)
            logger.info(f"Global logout executed for user {user.id}")

        # Limpiar sesión actual
        session_id = request.COOKIES.get('session_id')
        access_token = request.COOKIES.get(settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token'))
        
        if access_token:
            token_hash = hashlib.sha256(access_token.encode()).hexdigest()
            ttl = int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds())
            cache.set(f"blacklist_access:{token_hash}", True, timeout=ttl)
        
        if session_id:
            cache.delete(f"session:{session_id}")

        # Respuesta
        response = Response({
            "success": True,
            "message": "Global logout successful - all sessions terminated",
            "redirect": "/"
        }, status=200)

        # Eliminar cookies
        cookie_domain = settings.SIMPLE_JWT.get('AUTH_COOKIE_DOMAIN')
        is_secure = not settings.DEBUG
        same_site = 'Lax' if settings.DEBUG else 'None'
        
        cookies_to_delete = ['access_token', 'refresh_token', 'session_id', 'csrftoken']
        
        for cookie_name in cookies_to_delete:
            response.delete_cookie(cookie_name, path='/', domain=cookie_domain, samesite=same_site)
            response.delete_cookie(cookie_name, path='/', samesite=same_site)

        response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        
        return response


# ------------------- VERIFY -------------------
class VerifyAuthView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({
            'status': 'authenticated',
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email
            }
        })
    
    def post(self, request):
        return self.get(request)


# ------------------- HOME -------------------
class Home(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        session_id = request.COOKIES.get('session_id')
        
        session_data = cache.get(f"session:{session_id}", {}) if session_id else {}
        
        return Response({
            'message': 'Welcome to home',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'session': {
                'id': session_id,
                'last_activity': session_data.get('last_activity'),
                'created_at': session_data.get('created_at')
            }
        })