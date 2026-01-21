CUSTOM_SERIALIZER = ''
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.utils.timezone import now

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer personalizado con claims adicionales de seguridad"""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Claims personalizados para auditoría
        token['username'] = user.username
        token['email'] = user.email
        token['is_staff'] = user.is_staff
        token['last_login'] = user.last_login.isoformat() if user.last_login else None
        
        # Claims de seguridad
        token['iat'] = int(now().timestamp())  # Issued at
        token['auth_time'] = int(now().timestamp())  # Authentication time
        
        return token
    
    def validate(self, attrs):
        # Validaciones adicionales antes de autenticación
        username = attrs.get('username')
        password = attrs.get('password')
        
        # Validar formato de username
        if not self.is_valid_username(username):
            raise serializers.ValidationError('Invalid username format')
        
        # Validar longitud de password
        if len(password) > 128:
            raise serializers.ValidationError('Password too long')
        
        return super().validate(attrs)
    
    def is_valid_username(self, username):
        """Validar formato de username"""
        import re
        
        if not username or len(username) < 3 or len(username) > 150:
            return False
        
        # Permitir solo caracteres alfanuméricos, guiones y underscores
        pattern = r'^[a-zA-Z0-9_-]+$'
        return bool(re.match(pattern, username))