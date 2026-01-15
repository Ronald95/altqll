from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TrabajadorViewSet, CargoViewSet

router = DefaultRouter()
router.register(r'cargos', CargoViewSet, basename='cargos')
router.register(r'trabajadores', TrabajadorViewSet, basename='trabajadores')

urlpatterns = [
    path('', include(router.urls)),
]
