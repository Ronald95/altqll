from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from aplication.models import Trabajador, Especialidad, EspecialidadImagen, CategoriaEspecialidad, CategoriaCertificado, CategoriaCurso, Certificado, Curso, ProcessedPDF, CertificadoImagen
from aplication.serializers import TrabajadorListSerializer, TrabajadorDetailSerializer, PDFUploadSerializer, EspecialidadSerializer, EspecialidadImagenSerializer, CategoriaEspecialidadSerializer, CategoriaCertificadoSerializer, CategoriaCursoSerializer, CertificadoSerializer, CursoSerializer, ProcessedPDFSerializer, CertificadoImagenSerializer, CertificadoImagen
from rest_framework.views import APIView
from django.http import JsonResponse
from rest_framework import status
from django.conf import settings
import os
import uuid
from pdf2image import convert_from_path
from PIL import Image, ImageFilter
from fpdf import FPDF
from rest_framework.parsers import MultiPartParser, FormParser
import requests
import json
import re
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from django.views.decorators.http import require_GET, require_POST
from rest_framework.response import Response
from rest_framework.decorators import action
from aplication.services.pdf_processor import procesar_pdf
from django.db import transaction




class TrabajadorViewSet(viewsets.ModelViewSet):
    queryset = Trabajador.objects.all().order_by('nombre')
    permission_classes = [IsAuthenticated]
    def get_serializer_class(self):
        if self.action == 'retrieve':  # detalle completo
            return TrabajadorDetailSerializer
        return TrabajadorListSerializer  # lista básica

    
class CategoriaEspecialidadViewSet(viewsets.ModelViewSet):
    queryset = CategoriaEspecialidad.objects.all().order_by('nombre')
    serializer_class = CategoriaEspecialidadSerializer
    permission_classes = [IsAuthenticated]

class CategoriaCertificadoViewSet(viewsets.ModelViewSet):
    queryset = CategoriaCertificado.objects.all().order_by('nombre')
    serializer_class = CategoriaCertificadoSerializer
    permission_classes = [IsAuthenticated]

class CategoriaCursoViewSet(viewsets.ModelViewSet):
    queryset = CategoriaCurso.objects.all().order_by('nombre')
    serializer_class = CategoriaCursoSerializer
    permission_classes = [IsAuthenticated]

class EspecialidadImagenViewSet(viewsets.ModelViewSet):
    queryset = EspecialidadImagen.objects.all()
    serializer_class = EspecialidadImagenSerializer
    permission_classes = [IsAuthenticated]

class CertificadoImagenViewSet(viewsets.ModelViewSet):
    queryset = CertificadoImagen.objects.all()
    serializer_class = CertificadoImagenSerializer
    permission_classes = [IsAuthenticated]
    
class EspecialidadViewSet(viewsets.ModelViewSet):
    queryset = Especialidad.objects.all()
    serializer_class = EspecialidadSerializer
    permission_classes = [IsAuthenticated]


# views.py - versión simplificada
class CertificadoViewSet(viewsets.ModelViewSet):
    queryset = Certificado.objects.all().select_related('categoria', 'user')
    serializer_class = CertificadoSerializer
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtrar por trabajador si se proporciona
        trabajador_id = self.request.query_params.get('trabajador')
        if trabajador_id:
            queryset = queryset.filter(trabajador_id=trabajador_id)
            
        return queryset
    
    def perform_create(self, serializer):
        with transaction.atomic():
            serializer.save()
    
    def perform_update(self, serializer):
        with transaction.atomic():
            serializer.save()
    
    # Los actions para manejo individual de imágenes son opcionales
    # pero útiles si quieres operaciones específicas
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def agregar_imagen(self, request, pk=None):
        """Agregar o reemplazar una imagen específica (endpoint opcional)"""
        certificado = self.get_object()
        tipo = request.data.get('tipo')
        imagen_file = request.FILES.get('imagen')
        
        if not tipo or not imagen_file:
            return Response(
                {'error': 'Se requieren tipo e imagen'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if tipo not in ['frontal', 'trasera', 'extra']:
            return Response(
                {'error': 'Tipo inválido. Use: frontal, trasera o extra'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            imagen, created = CertificadoImagen.objects.get_or_create(
                certificado=certificado,
                tipo=tipo,
                defaults={'imagen': imagen_file}
            )
            
            if not created:
                imagen.imagen = imagen_file
                imagen.save()
        
        serializer = CertificadoImagenSerializer(imagen)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['delete'])
    def eliminar_imagen(self, request, pk=None):
        """Eliminar una imagen específica (endpoint opcional)"""
        certificado = self.get_object()
        tipo = request.query_params.get('tipo')
        
        if not tipo:
            return Response(
                {'error': 'Se requiere el tipo de imagen'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                imagen = certificado.imagenes_certificado.get(tipo=tipo)
                imagen.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except CertificadoImagen.DoesNotExist:
            return Response(
                {'error': 'Imagen no encontrada'}, 
                status=status.HTTP_404_NOT_FOUND
            )

            
class CursoViewSet(viewsets.ModelViewSet):
    queryset = Curso.objects.all()
    serializer_class = CursoSerializer
    permission_classes = [IsAuthenticated]
# ================================
# Vista para procesar PDF
# ================================
class PDFViewSet(viewsets.ModelViewSet):
    """
    API para procesar PDFs y listar/eliminar los existentes
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ProcessedPDFSerializer
    queryset = ProcessedPDF.objects.all()

    def get_queryset(self):
        # Solo los PDFs del usuario autenticado
        return ProcessedPDF.objects.filter(user=self.request.user).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        """
        POST → Procesar PDF
        """
        # Llamamos a tu función que procesa el PDF y devuelve JsonResponse
        result = procesar_pdf(request)
        return result

    def destroy(self, request, *args, **kwargs):
        """
        DELETE → Eliminar PDF
        """
        pdf = self.get_object()

        if pdf.user != request.user:
            return Response({"detail": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

        # Eliminar archivo físico
        file_path = pdf.file_path.replace(request.build_absolute_uri(settings.MEDIA_URL), settings.MEDIA_ROOT + "/")
        if os.path.exists(file_path):
            os.remove(file_path)

        pdf.delete()
        return Response({"status": "ok"}, status=status.HTTP_200_OK)


@csrf_exempt
def descargar_pdf(request, codigo):
    # Token de Directemar (puede venir del frontend o guardarse en backend)
    token = request.headers.get("Authorization")
    if not token:
        return HttpResponse("Falta token", status=401)

    url = f"https://recaudaciones.directemar.cl/api/ordenesingreso/detalle/{codigo}"
    # Petición al servidor externo
    response = requests.get(url, headers={"Authorization": token})
    if response.status_code == 200:
        return HttpResponse(
            response.content,
            content_type="application/pdf",
        )
    else:
        return HttpResponse(
            f"Error {response.status_code}: {response.text}",
            status=response.status_code
        )


@require_POST
def buscar_tripulante(request):
    try:
        # Parsear JSON del body
        data = json.loads(request.body)
        rut = data.get("rut")
        token = data.get("token")

        if not rut or not token:
            return JsonResponse({"error": "Se requiere 'rut' y 'token'"}, status=400)

        # Llamada a la API externa
        url = "https://orion.directemar.cl/endPointCtr/index.php/embarqueDesembarque/buscarDatosTripulante"
        response = requests.post(
            url,
            json={"rut": rut},
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            timeout=15
        )

        # Verificar si devuelve JSON válido
        try:
            return JsonResponse(response.json(), safe=False, status=response.status_code)
        except ValueError:
            # No era JSON, devolver error legible
            return JsonResponse(
                {"error": "Sesión expirada o inválida. Por favor vuelva a iniciar sesión."},
                status=401
            )

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def buscar_nave(request):
    if not request.body:
        return JsonResponse({"error": "El cuerpo de la solicitud está vacío"}, status=400)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido"}, status=400)

    token_usuario = data.get("token")
    rut_usuario = data.get("armador")

    # Endpoint remoto
    url = "https://orion.directemar.cl/endPointCtr/index.php/nave/buscarNave"

    try:
        response = requests.post(
            url,
            json={
                "search": "",
                "mayor": 0,
                "armador": rut_usuario,
                "navegando": 0,
                "pais": "CL"
            },
            headers={
                "Authorization": f"Bearer {token_usuario}",
                "Content-Type": "application/json",
            },
            timeout=10
        )
       # Verificar si devuelve JSON válido
        try:
            return JsonResponse(response.json(), safe=False, status=response.status_code)
        except ValueError:
            # No era JSON, devolver error legible
            return JsonResponse(
                {"error": "Sesión expirada o inválida. Por favor vuelva a iniciar sesión."},
                status=401
            )
    except requests.exceptions.RequestException as e:
        return JsonResponse({"error": str(e)}, status=500)



@csrf_exempt
@require_POST
def buscar_inspecciones(request):
    if not request.body:
        return JsonResponse(
            {"error": "El cuerpo de la solicitud está vacío"},
            status=400
        )

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse(
            {"error": "JSON inválido"},
            status=400
        )

    token_usuario = data.get("token")
    id_movil = data.get("idMovil")

    if not token_usuario or not id_movil:
        return JsonResponse(
            {"error": "Faltan parámetros obligatorios (token, idMovil)"},
            status=400
        )

    # Endpoint remoto Directemar
    url = (
        "https://orion.directemar.cl/endPointCtr/index.php/ZarpeRecalada/buscarInspecciones"
    )

    try:
        response = requests.post(
            url,
            json={
                "idMovil": id_movil
            },
            headers={
                "Authorization": f"Bearer {token_usuario}",
                "Content-Type": "application/json",
            },
            timeout=10
        )

        # Intentar devolver JSON válido
        try:
            return JsonResponse(
                response.json(),
                safe=False,
                status=response.status_code
            )
        except ValueError:
            # Token vencido o respuesta HTML
            return JsonResponse(
                {
                    "error": (
                        "Sesión expirada o inválida. "
                        "Por favor vuelva a iniciar sesión."
                    )
                },
                status=401
            )

    except requests.exceptions.Timeout:
        return JsonResponse(
            {"error": "Tiempo de espera agotado con Directemar"},
            status=504
        )

    except requests.exceptions.RequestException as e:
        return JsonResponse(
            {"error": str(e)},
            status=500
        )


@csrf_exempt
@require_POST
def certificados_persona(request):
    """
    Recibe un RUT y token, consulta Directemar y devuelve
    datos del certificado en JSON limpio.
    """
    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({"error": "JSON inválido"}, status=400)

    rut = data.get("rut")
    token = data.get("token")

    if not rut or not token:
        return JsonResponse({"error": "Faltan parámetros rut o token"}, status=400)

    url = "https://serviciosonline.directemar.cl/certificados/ReporteUsuario/getCertificado"

    try:
        response = requests.post(
            url,
            json={"RutParam": rut, "TipoCertificado": 1},
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )

        if response.status_code != 200:
            return JsonResponse({"error": "Error al obtener certificado"}, status=response.status_code)

        result = response.json()
        html = result.get("getView", "")

        if not html:
            return JsonResponse({"error": "Certificado vacío"}, status=404)

        # Extraer campos usando regex
        nombre = re.search(r"<strong>Nombre<\/strong>\s*<\/td>\s*<td>\s*(.*?)\s*<\/td>", html, re.S)
        rut_extr = re.search(r"<strong>Rut<\/strong>\s*<\/td>\s*<td>\s*(.*?)\s*<\/td>", html, re.S)
        telefono = re.search(r"<strong>Tel[eé]fono<\/strong>\s*<\/td>\s*<td>\s*(.*?)\s*<\/td>", html, re.S)
        direccion = re.search(r"<strong>Direcci[oó]n<\/strong>\s*<\/td>\s*<td>\s*(.*?)\s*<\/td>", html, re.S)
        titulos = re.findall(r"<input type=\"radio\" .*? value=\"(.*?)\"", html, re.S)

        data_json = {
            "nombre": nombre.group(1).strip() if nombre else "",
            "rut": rut_extr.group(1).strip() if rut_extr else "",
            "telefono": telefono.group(1).strip() if telefono else "",
            "direccion": direccion.group(1).strip() if direccion else "",
            "titulos": titulos
        }

        return JsonResponse(data_json)

    except requests.exceptions.RequestException as e:
        return JsonResponse({"error": str(e)}, status=500)