import logging
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

logger = logging.getLogger('auth_audit')

# ------------------- LOGIN -------------------
class EnterpriseTokenObtainPairView(TokenObtainPairView):
    """
    Login con JWT por headers
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')
            user_id = response.user.id if hasattr(response, 'user') else None

            logger.info(f"Login successful: user={user_id}")

            response.data = {
                'access': access_token,
                'refresh': refresh_token,
                'message': 'Login successful'
            }
        return response


# ------------------- REFRESH -------------------
class EnterpriseTokenRefreshView(TokenRefreshView):
    permission_classes = [AllowAny]
    """
    Refresh token usando JSON
    """

    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {"error": "Refresh token required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        request.data['refresh'] = refresh_token
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            response.data = {
                'access': response.data.get('access'),
                'refresh': response.data.get('refresh'),
                'message': 'Token refreshed successfully'
            }
        return response


# ------------------- LOGOUT -------------------
class EnterpriseLogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if refresh_token:
            try:
                token_obj = RefreshToken(refresh_token)
                token_obj.blacklist()
                logger.info(f"Refresh token blacklisted")
            except Exception as e:
                logger.warning(f"Error blacklisting refresh token: {str(e)}")

        return Response({
            "success": True,
            "message": "Logout successful. Delete tokens in client."
        })


# ------------------- VERIFY -------------------
class VerifyAuthView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'status': 'authenticated',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        })


# ------------------- HOME -------------------
class Home(APIView):
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
        })
