import logging
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from django.contrib.auth import get_user_model

logger = logging.getLogger('auth_audit')
User = get_user_model()

# ------------------- SERIALIZER PERSONALIZADO -------------------
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializer personalizado para incluir info adicional del usuario
    """
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Agregar información del usuario
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
        }
        
        return data


# ------------------- LOGIN -------------------
class EnterpriseTokenObtainPairView(TokenObtainPairView):
    """
    Login con JWT por headers
    """
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            
            if response.status_code == 200:
                user_data = response.data.get('user', {})
                user_id = user_data.get('id')
                
                logger.info(f"Login successful: user_id={user_id}, username={user_data.get('username')}")
                
                # Restructurar respuesta
                response.data = {
                    'access': response.data.get('access'),
                    'refresh': response.data.get('refresh'),
                    'user': user_data,
                    'message': 'Login successful'
                }
            
            return response
            
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return Response(
                {"error": "Authentication failed", "detail": str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )


# ------------------- REFRESH -------------------
class EnterpriseTokenRefreshView(TokenRefreshView):
    """
    Refresh token usando JSON body
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get('refresh')
        
        if not refresh_token:
            logger.warning("Refresh attempt without token")
            return Response(
                {"error": "Refresh token required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            response = super().post(request, *args, **kwargs)
            
            if response.status_code == 200:
                logger.info("Token refreshed successfully")
                
                # Restructurar respuesta
                response.data = {
                    'access': response.data.get('access'),
                    'refresh': response.data.get('refresh'),
                    'message': 'Token refreshed successfully'
                }
            
            return response
            
        except TokenError as e:
            logger.error(f"Invalid token: {str(e)}")
            return Response(
                {"error": "Token is invalid or expired", "detail": str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            logger.error(f"Token refresh error: {str(e)}")
            return Response(
                {"error": "Token refresh failed", "detail": str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )


# ------------------- LOGOUT -------------------
class EnterpriseLogoutView(APIView):
    """
    Logout endpoint que invalida el refresh token
    """
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        
        if not refresh_token:
            logger.warning("Logout attempt without refresh token")
            return Response({
                "success": True,
                "message": "No token to blacklist. Delete tokens in client."
            }, status=status.HTTP_200_OK)
        
        try:
            token_obj = RefreshToken(refresh_token)
            token_obj.blacklist()
            logger.info("Refresh token blacklisted successfully")
            
            return Response({
                "success": True,
                "message": "Logout successful. Token invalidated."
            }, status=status.HTTP_200_OK)
            
        except TokenError as e:
            logger.warning(f"Invalid token on logout: {str(e)}")
            return Response({
                "success": True,
                "message": "Logout processed. Token was invalid or already blacklisted."
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.warning(f"Error blacklisting refresh token: {str(e)}")
            return Response({
                "success": True,
                "message": "Logout processed. Delete tokens in client.",
                "warning": "Token could not be blacklisted"
            }, status=status.HTTP_200_OK)


# ------------------- VERIFY -------------------
class VerifyAuthView(APIView):
    """
    Verifica si el token de acceso es válido
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        logger.info(f"Auth verified for user_id={user.id}")
        
        return Response({
            'authenticated': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': getattr(user, 'first_name', ''),
                'last_name': getattr(user, 'last_name', ''),
            }
        }, status=status.HTTP_200_OK)


# ------------------- HOME -------------------
class Home(APIView):
    """
    Endpoint protegido de ejemplo
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        return Response({
            'message': f'Welcome {user.username}',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': getattr(user, 'first_name', ''),
                'last_name': getattr(user, 'last_name', ''),
            }
        }, status=status.HTTP_200_OK)