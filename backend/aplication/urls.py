# aplication/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TrabajadorViewSet, PDFViewSet, EspecialidadViewSet, EspecialidadImagenViewSet, CategoriaEspecialidadViewSet, CategoriaCertificadoViewSet, CategoriaCursoViewSet, CertificadoViewSet, CursoViewSet

# Routers para ViewSets
router = DefaultRouter()
router.register(r'trabajadores', TrabajadorViewSet, basename='trabajadores')
router.register(r'especialidades', EspecialidadViewSet, basename='especialidades')
router.register(r'especialidad_imagen', EspecialidadImagenViewSet, basename='especialidad_imagen')
router.register(r'categorias_especialidad', CategoriaEspecialidadViewSet, basename='categorias_especialidad')
router.register(r'categorias_certificado', CategoriaCertificadoViewSet, basename='categorias_certificado')
router.register(r'categorias_curso', CategoriaCursoViewSet, basename='categorias_curso')
router.register(r'certificados', CertificadoViewSet, basename='certificados')
router.register(r'cursos', CursoViewSet, basename='cursos')
router.register(r'procesar-pdf', PDFViewSet, basename='procesar-pdf')

urlpatterns = [
    path('', include(router.urls)),
]
