
# middleware.py - Middleware para validación y blacklist de tokens

import logging
import hashlib
from django.core.cache import cache
from django.conf import settings
from django.http import JsonResponse
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

logger = logging.getLogger('security')

class TokenBlacklistMiddleware:
    """Middleware para verificar tokens blacklisted"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Verificar blacklist antes de procesar request
        if self.should_check_token(request):
            if not self.validate_access_token(request):
                return JsonResponse(
                    {'error': 'Token has been invalidated'}, 
                    status=401
                )
        
        response = self.get_response(request)
        return response
    
    def should_check_token(self, request):
        """Determina si debe verificar el token"""
        # Solo verificar en endpoints protegidos
        protected_paths = ['/api/', '/admin/']  # Ajustar según tus rutas
        return any(request.path.startswith(path) for path in protected_paths)
    
    def validate_access_token(self, request):
        """Valida que el access token no esté en blacklist"""
        try:
            # Obtener token de cookie o header
            access_token = request.COOKIES.get(
                settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token')
            )
            
            if not access_token:
                # Intentar obtener del header Authorization
                auth_header = request.META.get('HTTP_AUTHORIZATION', '')
                if auth_header.startswith('Bearer '):
                    access_token = auth_header.split(' ')[1]
            
            if not access_token:
                return True  # No hay token, dejar que otros middleware manejen
            
            # Verificar si está en blacklist
            token_hash = hashlib.sha256(access_token.encode()).hexdigest()
            is_blacklisted = cache.get(f"blacklist_access:{token_hash}")
            
            if is_blacklisted:
                logger.warning(f"Blacklisted token attempt from IP: {self.get_client_ip(request)}")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating token: {str(e)}")
            return True  # En caso de error, permitir que continúe
    
    def get_client_ip(self, request):
        """Obtiene IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SessionSecurityMiddleware:
    """Middleware adicional para seguridad de sesiones"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Validaciones de seguridad adicionales
        self.add_security_headers(request)
        
        response = self.get_response(request)
        
        # Agregar headers de seguridad al response
        self.enhance_response_security(response)
        
        return response
    
    def add_security_headers(self, request):
        """Agrega validaciones de seguridad al request"""
        # Validar tamaño de cookies para prevenir ataques
        if hasattr(request, 'COOKIES'):
            total_cookie_size = sum(len(k) + len(v) for k, v in request.COOKIES.items())
            if total_cookie_size > 4096:  # 4KB límite típico
                logger.warning(f"Oversized cookies from IP: {self.get_client_ip(request)}")
        
        # Validar User-Agent para detectar bots maliciosos
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        if self.is_suspicious_user_agent(user_agent):
            logger.warning(f"Suspicious User-Agent: {user_agent[:100]}")
    
    def enhance_response_security(self, response):
        """Mejora la seguridad del response"""
        # Headers de seguridad comunes
        security_headers = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
        }
        
        for header, value in security_headers.items():
            if header not in response:
                response[header] = value
        
        # Cache control para endpoints sensibles
        if hasattr(response, 'url') and '/api/auth/' in str(response.url):
            response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
            response['Pragma'] = 'no-cache'
    
    def is_suspicious_user_agent(self, user_agent):
        """Detecta User-Agents sospechosos"""
        if not user_agent or len(user_agent) < 10:
            return True
        
        suspicious_patterns = [
            'sqlmap', 'nmap', 'masscan', 'nessus', 'nikto',
            'dirb', 'dirbuster', 'gobuster', 'wfuzz',
            'burp', 'owasp'
        ]
        
        user_agent_lower = user_agent.lower()
        return any(pattern in user_agent_lower for pattern in suspicious_patterns)
    
    def get_client_ip(self, request):
        """Obtiene IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


# Funciones utilitarias para usar en views
class TokenSecurityUtils:
    """Utilidades de seguridad para tokens"""
    
    @staticmethod
    def is_token_compromised(token, user_id=None):
        """Verifica si un token puede estar comprometido"""
        try:
            # Decodificar token para obtener información
            decoded_token = UntypedToken(token)
            
            # Verificar edad del token
            issued_at = decoded_token.get('iat')
            current_time = decoded_token.current_time
            
            if current_time - issued_at > 3600:  # Más de 1 hora
                return True
            
            # Verificar otros indicadores de compromiso
            # (implementar según necesidades)
            
            return False
            
        except (InvalidToken, TokenError):
            return True
    
    @staticmethod
    def log_token_usage(token_type, action, user_id=None, ip_address=None):
        """Registra uso de tokens para auditoría"""
        logger.info(f"Token {action}: type={token_type}, user={user_id}, ip={ip_address}")
    
    @staticmethod
    def generate_csrf_token():
        """Genera token CSRF adicional para protección extra"""
        import secrets
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def validate_request_fingerprint(request, stored_fingerprint):
        """Valida fingerprint del request contra el almacenado"""
        current_fingerprint = TokenSecurityUtils.generate_request_fingerprint(request)
        return current_fingerprint == stored_fingerprint
    
    @staticmethod
    def generate_request_fingerprint(request):
        """Genera fingerprint único del request"""
        import hashlib
        
        components = [
            request.META.get('HTTP_USER_AGENT', ''),
            request.META.get('HTTP_ACCEPT_LANGUAGE', ''),
            request.META.get('HTTP_ACCEPT_ENCODING', ''),
            # No incluir IP para usuarios móviles
        ]
        
        fingerprint_string = '|'.join(components)
        return hashlib.sha256(fingerprint_string.encode()).hexdigest()[:16]




#class JWTAuthMiddleware:
#    def __init__(self, get_response):
#        self.get_response = get_response

#    def __call__(self, request):
#        token = request.COOKIES.get('access_token')
#        if token:
#            request.META['HTTP_AUTHORIZATION'] = f'Bearer {token}'
#        return self.get_response(request)
