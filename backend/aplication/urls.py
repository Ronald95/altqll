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
from aplication.views.categorias.pirotecnia import CategoriaPirotecniaViewSet
from aplication.views.estudioNave.viewset import EstudioNaveViewSet
from aplication.views.categorias.estudioNave import CategoriaEstudioNaveViewSet
from aplication.views.scraping.get_token import getTokenDirectemarView
from aplication.views.scraping.cunlogan import posiciones_cunlogan_view, reporte_horas_navegadas_view
from aplication.views.scraping.flota import posiciones_flota_view, reporte_marimsys_simplificado_view
from aplication.views.sueldos import comparar_sueldos_view
from aplication.views.scraping.posiciones import posat_naves
from aplication.views.scraping.reporte_posat import reporte_posat_view







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
router.register(r'categorias_pirotecnia', CategoriaPirotecniaViewSet, basename='categorias_pirotecnia')
router.register(r'estudio_nave', EstudioNaveViewSet, basename='estudio_nave')
router.register(r'categorias_estudio_nave', CategoriaEstudioNaveViewSet, basename='categorias_estudio_nave')


urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/naves/',DashboardNavesView.as_view(),name='dashboard-naves'),
    path('tokenDirectemar/', getTokenDirectemarView.as_view(), name='get_token_directemar'),
    path("posiciones_cunlogan/", posiciones_cunlogan_view, name="posiciones_cunlogan"),
    path("posiciones_flota/", posiciones_flota_view, name="posiciones_flota"),
    path("comparar-sueldos/", comparar_sueldos_view, name="comparar-sueldos"),
    # Reporte horas navegadas
    path('cunlogan/reporte-horas/', reporte_horas_navegadas_view),
    # Reporte horas navegadas marimsys
    path('marimsys/reporte/', reporte_marimsys_simplificado_view, name='marimsys_reporte'),
    path('posat_naves/', posat_naves, name='posat_naves'),
    path('posat/reporte/', reporte_posat_view, name='reporte_posat_view'),
]
