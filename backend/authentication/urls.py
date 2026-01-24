from django.urls import path
from authentication.views import (
    EnterpriseTokenObtainPairView,
    EnterpriseTokenRefreshView,
    EnterpriseLogoutView,
    VerifyAuthView,
    Home
)

urlpatterns = [
    path('login/', EnterpriseTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', EnterpriseTokenRefreshView.as_view(), name='refresh'),
    path('logout/', EnterpriseLogoutView.as_view(), name='logout'),
    path('token/verify/', VerifyAuthView.as_view(), name='verify'),
    path('home/', Home.as_view(), name='home'),
]
