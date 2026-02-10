# aplication/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TrabajadorViewSet, PDFViewSet, EspecialidadViewSet, EspecialidadImagenViewSet, CategoriaEspecialidadViewSet, CategoriaCertificadoViewSet, CategoriaCursoViewSet, CertificadoViewSet, CursoViewSet, DashboardNavesView, CategoriaNaveViewSet, CategoriaCertificadoNaveViewSet, NaveViewSet, RequisitoCertificadoNaveViewSet, CertificadoNaveViewSet, NavesAvanceViewSet

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
router.register(r'categorias-naves', CategoriaNaveViewSet)
router.register(r'categorias-certificados', CategoriaCertificadoNaveViewSet)
router.register(r'naves', NaveViewSet)
router.register(r'certificados-nave', CertificadoNaveViewSet)
router.register(r'requisitos-certificados', RequisitoCertificadoNaveViewSet)
router.register(r'naves-avance', NavesAvanceViewSet, basename='naves-avance')



urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/naves/',DashboardNavesView.as_view(),name='dashboard-naves'),
]
