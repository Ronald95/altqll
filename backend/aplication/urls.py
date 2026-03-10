# aplication/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from aplication.views.trabajador.viewset import TrabajadorViewSet
from aplication.views.especialidad.viewset import EspecialidadViewSet
from aplication.views.pdf.viewset import PDFViewSet
from aplication.views.categorias.especialidad import CategoriaEspecialidadViewSet
from aplication.views.categorias.certificado import CategoriaCertificadoViewSet
from aplication.views.categorias.curso import CategoriaCursoViewSet
from aplication.views.requisitoNave.viewset import RequisitoCertificadoNaveViewSet
from aplication.views.imagenes.especialidad import EspecialidadImagenViewSet
from aplication.views.certificado.viewset import CertificadoViewSet
from aplication.views.nave.viewset import NaveViewSet
from aplication.views.nave.dashboard import DashboardNavesView
from aplication.views.nave.avance import NavesAvanceViewSet
from aplication.views.curso.viewset import CursoViewSet
from aplication.views.pdf.viewset import PDFViewSet
from aplication.views.certificadoNave.viewset import CertificadoNaveViewSet
from aplication.views.categorias.nave import CategoriaNaveViewSet
from aplication.views.categorias.certificadoNave import CategoriaCertificadoNaveViewSet
from aplication.views.pirotecnia.viewset import PirotecniaViewSet


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
router.register(r'pirotecnia', PirotecniaViewSet, basename='pirotecnia')



urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/naves/',DashboardNavesView.as_view(),name='dashboard-naves'),
]
