from django.urls import path, include
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import never_cache
from django.utils.decorators import method_decorator
from .views import (
    SecureTokenObtainPairView, 
    SecureTokenRefreshView, 
    SecureLogoutView,
    GlobalLogoutView,
    Home,
    VerifyAuthView
)

# authentication/urls.py
urlpatterns = [
    path('home/', Home.as_view(), name='home'),
    path('login/', SecureTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', SecureTokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', SecureLogoutView.as_view(), name='logout'),
    path('logout/global/', GlobalLogoutView.as_view(), name='global_logout'),
    path('token/verify-auth/', VerifyAuthView.as_view(), name='token_verify'),
    #path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    #path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    
    #path('token/blacklist/', TokenBlacklistView.as_view(), name='token_blacklist'),
    #path('logout/', LogoutView.as_view(), name='logout'),
]