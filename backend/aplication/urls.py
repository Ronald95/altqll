# aplication/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TrabajadorViewSet, CargoViewSet, PDFProcessView 

# Routers para ViewSets
router = DefaultRouter()
router.register(r'cargos', CargoViewSet, basename='cargos')
router.register(r'trabajadores', TrabajadorViewSet, basename='trabajadores')

urlpatterns = [
    path('', include(router.urls)),
    path('procesar-pdf/', PDFProcessView.as_view(), name='procesar_pdf'),
]
