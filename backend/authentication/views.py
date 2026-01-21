import logging
from django.utils.timezone import now
from django.conf import settings
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.views.decorators.cache import never_cache
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken, UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
import hashlib
import secrets
import ipaddress
import time
import threading
from datetime import timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from django.db import transaction

# Configurar logging para auditoría
logger = logging.getLogger('auth_audit')
security_logger = logging.getLogger('security')

class Home(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user  
        content = {
            'user': {
                'username': user.username,
                'email': user.email
            }
        }
        return Response(content)

    def get_user(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return serializer.user


@method_decorator([csrf_exempt, never_cache], name='dispatch')
class SecureTokenObtainPairView(TokenObtainPairView):
    """Vista segura para obtención de tokens JWT con múltiples capas de seguridad"""
    
    def get(self, request, *args, **kwargs):
        return Response(
            {"detail": "Method not allowed. Use POST."},
            status=405
        )
    
    def post(self, request, *args, **kwargs):
        start_time = time.time()
        
        # 1. Rate limiting por IP
        client_ip = self.get_client_ip(request)
        if not self.check_rate_limit(client_ip):
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            return Response(
                {"error": "Too many login attempts. Try again later."}, 
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        # 2. Validar entrada y detectar ataques (optimizado)
        if not self.validate_login_data_fast(request.data):
            logger.warning(f"Invalid login data from IP: {client_ip}")
            return Response(
                {"error": "Invalid credentials"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 3. Procesar autenticación
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Login exitoso - procesar en paralelo
            self.handle_successful_login_optimized(request, response, client_ip)
        else:
            # Login fallido - operación rápida
            self.increment_rate_limit(client_ip)
            logger.warning(f"Failed login attempt from IP: {client_ip}")
        
        total_time = time.time() - start_time
        logger.info(f"Login processing time: {total_time:.3f}s")
        
        return response
    
    def handle_successful_login_optimized(self, request, response, client_ip):
        """Maneja login exitoso con configuración paralela y optimizada"""
        access_token = response.data.get('access')
        refresh_token = response.data.get('refresh')
        
        if not access_token or not refresh_token:
            return
        
        # Generar datos básicos rápido
        session_id = secrets.token_urlsafe(32)
        access_exp = now() + settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
        refresh_exp = now() + settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']
        
        # Configurar cookies inmediatamente
        self.set_auth_cookies_fast(response, access_token, refresh_token, 
                                 session_id, access_exp, refresh_exp)
        
        # Headers de seguridad
        self.set_security_headers(response)
        
        # Limpiar response data
        response.data = {
            'message': 'Login successful',
            'session_id': session_id,
            'expires_in': settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()
        }
        
        # Operaciones pesadas en background
        def background_tasks():
            try:
                # Hash token y almacenar metadata
                access_hash = hashlib.sha256(access_token.encode()).hexdigest()
                session_metadata = {
                    'user_id': getattr(request, 'user', None) and request.user.id,
                    'ip_address': client_ip,
                    'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                    'access_token_hash': access_hash,
                    'created_at': now().isoformat(),
                    'last_activity': now().isoformat(),
                }
                
                # Usar timeout corto para cache
                cache.set(
                    f"session:{session_id}", 
                    session_metadata, 
                    timeout=min(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds(), 7200)  # Max 2h
                )
                
                # Reset rate limiting
                cache.delete(f"login_attempts:{client_ip}")
                
                logger.info(f"Login completed for session {session_id} from IP {client_ip}")
                
            except Exception as e:
                logger.warning(f"Background login tasks error: {e}")
        
        # Ejecutar en thread separado
        thread = threading.Thread(target=background_tasks, daemon=True)
        thread.start()
    
    def set_auth_cookies_fast(self, response, access_token, refresh_token, session_id, access_exp, refresh_exp):
        """Configuración rápida de cookies"""
        cookie_config = {
            'httponly': True,
            'secure': True,
            'samesite': 'Strict',
            'domain': settings.SIMPLE_JWT.get('AUTH_COOKIE_DOMAIN')
        }
        
        # Access token
        response.set_cookie(
            key=settings.SIMPLE_JWT.get("AUTH_COOKIE", "access_token"),
            value=access_token,
            expires=access_exp,
            path=settings.SIMPLE_JWT.get("AUTH_COOKIE_PATH", "/"),
            **cookie_config
        )
        
        # Refresh token
        response.set_cookie(
            key=settings.SIMPLE_JWT.get("AUTH_COOKIE_REFRESH", "refresh_token"),
            value=refresh_token,
            expires=refresh_exp,
            path='/api/auth/refresh/',
            **cookie_config
        )
        
        # Session ID
        response.set_cookie(
            key='session_id',
            value=session_id,
            expires=refresh_exp,
            path='/',
            **cookie_config
        )
    
    def set_security_headers(self, response):
        """Headers de seguridad básicos"""
        headers = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
        for header, value in headers.items():
            response[header] = value
    
    def validate_login_data_fast(self, data):
        """Validaciones optimizadas de entrada"""
        if not data or not isinstance(data, dict):
            return False
        
        username = data.get('username', '')
        password = data.get('password', '')
        
        # Validaciones básicas rápidas
        if not username or not password or len(username) > 150 or len(password) > 128:
            return False
        
        # Detección rápida de patrones peligrosos
        if any(pattern in username.upper() for pattern in ['--', 'DROP', 'DELETE', 'UPDATE', 'INSERT']):
            return False
        
        return True
    
    def get_client_ip(self, request):
        """Obtiene IP real del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        try:
            ipaddress.ip_address(ip)
            return ip
        except ValueError:
            return '0.0.0.0'
    
    def check_rate_limit(self, ip):
        """Rate limiting optimizado"""
        key = f"login_attempts:{ip}"
        attempts = cache.get(key, 0)
        return attempts < getattr(settings, 'MAX_LOGIN_ATTEMPTS', 5)
    
    def increment_rate_limit(self, ip):
        """Incrementa contador de intentos fallidos"""
        key = f"login_attempts:{ip}"
        attempts = cache.get(key, 0)
        cache.set(key, attempts + 1, timeout=900)  # 15 minutos


@method_decorator([csrf_exempt, never_cache], name='dispatch')
class SecureTokenRefreshView(TokenRefreshView):
    """Vista optimizada para refresh de tokens"""
    
    def post(self, request, *args, **kwargs):
        start_time = time.time()
        
        try:
            client_ip = self.get_client_ip(request)
            
            # Validaciones básicas rápidas
            if not self.quick_validate_refresh(request, client_ip):
                return Response(
                    {"error": "Invalid refresh request"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Rate limiting
            if not self.check_refresh_rate_limit(client_ip):
                return Response(
                    {"error": "Too many refresh attempts"}, 
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            
            # Obtener refresh token
            refresh_token = self.get_refresh_token_fast(request)
            if not refresh_token:
                return Response(
                    {"error": "Refresh token not found"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Procesar request
            request.data._mutable = True if hasattr(request.data, '_mutable') else None
            request.data['refresh'] = refresh_token
            
            response = super().post(request, *args, **kwargs)
            
            if response.status_code == 200:
                self.handle_successful_refresh_optimized(request, response, client_ip)
            else:
                self.increment_refresh_rate_limit(client_ip)
            
            total_time = time.time() - start_time
            logger.info(f"Refresh processing time: {total_time:.3f}s")
            
            return response
            
        except Exception as e:
            security_logger.error(f"Refresh error: {str(e)}")
            return Response(
                {"error": "Internal server error"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def quick_validate_refresh(self, request, client_ip):
        """Validaciones rápidas del request"""
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        return len(user_agent) <= 500 and user_agent and 'bot' not in user_agent.lower()
    
    def get_refresh_token_fast(self, request):
        """Obtención rápida del refresh token"""
        token = request.COOKIES.get(
            settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token')
        )
        
        if token and len(token.split('.')) == 3:
            return token
        
        # Fallback a header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            if len(token.split('.')) == 3:
                return token
        
        return None
    
    def handle_successful_refresh_optimized(self, request, response, client_ip):
        """Manejo optimizado de refresh exitoso"""
        access_token = response.data.get('access')
        refresh_token = response.data.get('refresh')
        
        if access_token:
            access_exp = now() + settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
            
            # Configurar cookie de access token
            response.set_cookie(
                key=settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token'),
                value=access_token,
                expires=access_exp,
                httponly=True,
                secure=True,
                samesite='Strict',
                path=settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/'),
                domain=settings.SIMPLE_JWT.get('AUTH_COOKIE_DOMAIN')
            )
            
            # Si hay nuevo refresh token
            if refresh_token:
                refresh_exp = now() + settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']
                response.set_cookie(
                    key=settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token'),
                    value=refresh_token,
                    expires=refresh_exp,
                    httponly=True,
                    secure=True,
                    samesite='Strict',
                    path='/api/auth/',
                    domain=settings.SIMPLE_JWT.get('AUTH_COOKIE_DOMAIN')
                )
        
        # Headers y limpieza de response
        response['Cache-Control'] = 'no-store, no-cache, must-revalidate'
        response.data = {
            'message': 'Token refreshed successfully',
            'expires_in': settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()
        }
        
        # Actualizar sesión en background
        session_id = request.COOKIES.get('session_id')
        if session_id:
            def update_session():
                try:
                    session_data = cache.get(f"session:{session_id}", {})
                    session_data.update({
                        'last_refresh': now().isoformat(),
                        'last_activity': now().isoformat(),
                    })
                    cache.set(f"session:{session_id}", session_data, timeout=7200)
                except Exception as e:
                    logger.warning(f"Session update error: {e}")
            
            threading.Thread(target=update_session, daemon=True).start()
        
        # Reset rate limiting
        cache.delete(f"refresh_attempts:{client_ip}")
    
    def check_refresh_rate_limit(self, ip):
        """Rate limiting para refresh"""
        key = f"refresh_attempts:{ip}"
        attempts = cache.get(key, 0)
        return attempts < getattr(settings, 'MAX_REFRESH_ATTEMPTS', 10)
    
    def increment_refresh_rate_limit(self, ip):
        """Incrementa contador de refresh fallidos"""
        key = f"refresh_attempts:{ip}"
        attempts = cache.get(key, 0)
        cache.set(key, attempts + 1, timeout=600)
    
    def get_client_ip(self, request):
        """Obtiene IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        try:
            ipaddress.ip_address(ip)
            return ip
        except ValueError:
            return '0.0.0.0'


@method_decorator([csrf_exempt, never_cache], name='dispatch')
class SecureLogoutView(APIView):
    """Vista optimizada de logout con limpieza en background"""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        start_time = time.time()
        
        try:
            client_ip = self.get_client_ip(request)
            session_id = request.COOKIES.get('session_id')
            
            # Obtener tokens para limpieza posterior
            access_token = request.COOKIES.get(
                settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token')
            )
            refresh_token = request.COOKIES.get(
                settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token')
            )
            
            # Crear response inmediatamente
            response = Response(
                {
                    "message": "Logout successful",
                    "timestamp": now().isoformat()
                }, 
                status=status.HTTP_200_OK
            )
            
            # Limpiar cookies inmediatamente
            self.clear_auth_cookies_fast(response)
            
            # Headers de seguridad
            response['Cache-Control'] = 'no-store, no-cache, must-revalidate'
            response['Clear-Site-Data'] = '"cookies", "storage"'
            
            # Operaciones de limpieza en background
            def background_cleanup():
                cleanup_start = time.time()
                try:
                    # Blacklist de tokens en paralelo
                    with ThreadPoolExecutor(max_workers=2) as executor:
                        futures = []
                        
                        if refresh_token:
                            futures.append(executor.submit(self.blacklist_refresh_token, refresh_token))
                        
                        if access_token:
                            futures.append(executor.submit(self.blacklist_access_token, access_token))
                        
                        # Esperar máximo 1 segundo
                        for future in as_completed(futures, timeout=1.0):
                            try:
                                future.result()
                            except Exception as e:
                                logger.warning(f"Token blacklist error: {e}")
                    
                    # Limpieza de sesión
                    if session_id:
                        self.cleanup_session_fast(session_id)
                    
                    cleanup_time = time.time() - cleanup_start
                    logger.info(f"Background cleanup completed in {cleanup_time:.3f}s for session {session_id}")
                    
                except Exception as e:
                    logger.warning(f"Background cleanup error: {e}")
            
            # Ejecutar limpieza en background
            threading.Thread(target=background_cleanup, daemon=True).start()
            
            total_time = time.time() - start_time
            logger.info(f"Logout response time: {total_time:.3f}s (cleanup in background)")
            
            return response
            
        except Exception as e:
            security_logger.error(f"Logout error: {str(e)}")
            response = Response(
                {"message": "Logout completed"}, 
                status=status.HTTP_200_OK
            )
            self.clear_auth_cookies_fast(response)
            return response
    
    def blacklist_refresh_token(self, refresh_token):
        """Blacklist de refresh token optimizado"""
        try:
            with transaction.atomic():
                token = RefreshToken(refresh_token)
                token.blacklist()
            logger.info("Refresh token blacklisted")
        except Exception as e:
            logger.warning(f"Refresh token blacklist error: {e}")
    
    def blacklist_access_token(self, access_token):
        """Blacklist de access token optimizado"""
        try:
            untyped_token = UntypedToken(access_token)
            exp = untyped_token.get('exp')
            if exp:
                remaining_time = max(0, exp - int(time.time()))
                if remaining_time > 0:
                    token_hash = hashlib.sha256(access_token.encode()).hexdigest()
                    cache.set(
                        f"blacklist_access:{token_hash}", 
                        True, 
                        timeout=min(remaining_time, 3600)  # Max 1 hora
                    )
                    logger.info("Access token blacklisted")
        except (InvalidToken, TokenError):
            logger.warning("Invalid access token for blacklist")
        except Exception as e:
            logger.warning(f"Access token blacklist error: {e}")
    
    def cleanup_session_fast(self, session_id):
        """Limpieza rápida de sesión"""
        try:
            session_data = cache.get(f"session:{session_id}")
            if session_data:
                # Eliminar claves en batch si es posible
                keys_to_delete = [f"session:{session_id}"]
                
                if 'ip_address' in session_data:
                    ip = session_data['ip_address']
                    keys_to_delete.extend([
                        f"login_attempts:{ip}",
                        f"refresh_attempts:{ip}"
                    ])
                
                # Usar delete_many si está disponible
                if hasattr(cache, 'delete_many'):
                    cache.delete_many(keys_to_delete)
                else:
                    for key in keys_to_delete:
                        cache.delete(key)
                
                logger.info(f"Session {session_id} cleaned - {len(keys_to_delete)} keys")
                
        except Exception as e:
            logger.warning(f"Session cleanup error: {e}")
    
    def clear_auth_cookies_fast(self, response):
        """Limpieza rápida de cookies"""
        cookies_to_clear = [
            settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token'),
            settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token'),
            'session_id',
            'csrftoken'
        ]
        
        cookie_config = {
            'path': '/',
            'domain': settings.SIMPLE_JWT.get('AUTH_COOKIE_DOMAIN'),
            'samesite': settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Strict')
        }
        
        for cookie_name in cookies_to_clear:
            response.delete_cookie(key=cookie_name, **cookie_config)
    
    def get_client_ip(self, request):
        """Obtiene IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        try:
            ipaddress.ip_address(ip)
            return ip
        except ValueError:
            return '0.0.0.0'


class GlobalLogoutView(APIView):
    """Logout global optimizado"""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            user = request.user
            client_ip = self.get_client_ip(request)
            
            # Response inmediato
            response = Response(
                {
                    "message": "Global logout successful - all sessions terminated",
                    "timestamp": now().isoformat()
                },
                status=status.HTTP_200_OK
            )
            
            # Limpiar cookies locales
            SecureLogoutView().clear_auth_cookies_fast(response)
            
            # Limpieza global en background
            def global_cleanup():
                try:
                    from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
                    
                    tokens = OutstandingToken.objects.filter(user=user)
                    for token in tokens:
                        RefreshToken(token.token).blacklist()
                    
                    logger.info(f"Global logout completed for user {user.id}")
                    
                except Exception as e:
                    logger.warning(f"Global cleanup error: {e}")
            
            threading.Thread(target=global_cleanup, daemon=True).start()
            
            return response
            
        except Exception as e:
            security_logger.error(f"Global logout error: {str(e)}")
            return Response(
                {"message": "Global logout completed"}, 
                status=status.HTTP_200_OK
            )
    
    def get_client_ip(self, request):
        """Obtiene IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        try:
            ipaddress.ip_address(ip)
            return ip
        except ValueError:
            return '0.0.0.0'


class VerifyAuthView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({'status': 'authenticated'})


# Middleware optimizado
class SessionValidationMiddleware:
    """Middleware optimizado para validación de sesiones"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Validación ligera solo si es necesario
        if (hasattr(request, 'user') and 
            request.user.is_authenticated and 
            request.path.startswith('/api/') and
            request.method in ['POST', 'PUT', 'DELETE']):
            
            session_id = request.COOKIES.get('session_id')
            if session_id:
                self.quick_session_update(session_id)
        
        response = self.get_response(request)
        return response
    
    def quick_session_update(self, session_id):
        """Actualización rápida de última actividad"""
        try:
            # Solo actualizar timestamp, no validar todo
            session_key = f"session:{session_id}"
            session_data = cache.get(session_key)
            if session_data:
                session_data['last_activity'] = now().isoformat()
                cache.set(session_key, session_data, timeout=7200)  # 2h max
        except Exception:
            pass  # Fallar silenciosamente para no afectar performance