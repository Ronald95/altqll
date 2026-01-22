from django.urls import path
from authentication.views import (
    EnterpriseTokenObtainPairView,
    EnterpriseTokenRefreshView,
    EnterpriseLogoutView,
    EnterpriseGlobalLogoutView,
    VerifyAuthView,
    Home
)

# authentication/urls.py
urlpatterns = [
    path('login/', EnterpriseTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', EnterpriseTokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', EnterpriseLogoutView.as_view(), name='logout'),
    path('logout/global/', EnterpriseGlobalLogoutView.as_view(), name='global_logout'),
    path('token/verify/', VerifyAuthView.as_view(), name='token_verify'),
    path('home/', Home.as_view(), name='home'),
]