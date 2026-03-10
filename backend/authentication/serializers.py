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
        # Validaciones antes de autenticación
        username = attrs.get('username')
        password = attrs.get('password')
        
        if not self.is_valid_username(username):
            raise serializers.ValidationError('Invalid username format')
        if len(password) > 128:
            raise serializers.ValidationError('Password too long')
        
        # Ejecuta la validación original (autenticación)
        data = super().validate(attrs)
        
        # Agregar info de usuario + permisos + grupos
        user = self.user
        permissions = list(user.get_all_permissions())  # permisos directos + por grupos
        groups = list(user.groups.values_list('name', flat=True))
        
        data['user'] = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': getattr(user, 'first_name', ''),
            'last_name': getattr(user, 'last_name', ''),
            'permissions': permissions,
            'groups': groups
        }
        
        return data
    
    def is_valid_username(self, username):
        """Validar formato de username"""
        import re
        if not username or len(username) < 3 or len(username) > 150:
            return False
        pattern = r'^[a-zA-Z0-9_-]+$'
        return bool(re.match(pattern, username))