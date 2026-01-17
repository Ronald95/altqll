# aplication/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TrabajadorViewSet, CargoViewSet, PDFProcessView, TipoMatriculaViewSet, MatriculaViewSet, MatriculaImagenViewSet

# Routers para ViewSets
router = DefaultRouter()
router.register(r'cargos', CargoViewSet, basename='cargos')
router.register(r'trabajadores', TrabajadorViewSet, basename='trabajadores')
router.register(r'tipo_matricula', TipoMatriculaViewSet, basename='tipo_matricula')
router.register(r'matricula_trabajador', MatriculaViewSet, basename='matricula_trabajador')
router.register(r'matricula_imagen', MatriculaImagenViewSet, basename='matricula_imagen')

urlpatterns = [
    path('', include(router.urls)),
    path('procesar-pdf/', PDFProcessView.as_view(), name='procesar_pdf'),
]
