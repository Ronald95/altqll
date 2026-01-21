# authentication/authentication.py
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings

class JWTCookieAuthentication(JWTAuthentication):
    def authenticate(self, request):
        raw_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE'])

        if raw_token is None:
            print("No JWT token found in cookies.")
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
            print("Validated JWT token:", validated_token)
            user = self.get_user(validated_token)
            return (user, validated_token)
        except Exception:
            return None
