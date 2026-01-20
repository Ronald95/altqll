from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from aplication.models import Trabajador, Especialidad, EspecialidadImagen, CategoriaEspecialidad, CategoriaCertificado, CategoriaCurso, Certificado, Curso
from aplication.serializers import TrabajadorListSerializer, TrabajadorDetailSerializer, PDFUploadSerializer, EspecialidadSerializer, EspecialidadImagenSerializer, CategoriaEspecialidadSerializer, CategoriaCertificadoSerializer, CategoriaCursoSerializer, CertificadoSerializer, CursoSerializer
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

class TrabajadorViewSet(viewsets.ModelViewSet):
    queryset = Trabajador.objects.all().order_by('nombre')

    def get_serializer_class(self):
        if self.action == 'retrieve':  # detalle completo
            return TrabajadorDetailSerializer
        return TrabajadorListSerializer  # lista básica

    
class CategoriaEspecialidadViewSet(viewsets.ModelViewSet):
    queryset = CategoriaEspecialidad.objects.all().order_by('nombre')
    serializer_class = CategoriaEspecialidadSerializer
    #permission_classes = [IsAuthenticated]

class CategoriaCertificadoViewSet(viewsets.ModelViewSet):
    queryset = CategoriaCertificado.objects.all().order_by('nombre')
    serializer_class = CategoriaCertificadoSerializer
    #permission_classes = [IsAuthenticated]

class CategoriaCursoViewSet(viewsets.ModelViewSet):
    queryset = CategoriaCurso.objects.all().order_by('nombre')
    serializer_class = CategoriaCursoSerializer
    #permission_classes = [IsAuthenticated]

class EspecialidadImagenViewSet(viewsets.ModelViewSet):
    queryset = EspecialidadImagen.objects.all()
    serializer_class = EspecialidadImagenSerializer
    #permission_classes = [IsAuthenticated]
    
class EspecialidadViewSet(viewsets.ModelViewSet):
    queryset = Especialidad.objects.all()
    serializer_class = EspecialidadSerializer
    #permission_classes = [IsAuthenticated]


class CertificadoViewSet(viewsets.ModelViewSet):
    queryset = Certificado.objects.all()
    serializer_class = CertificadoSerializer
    #permission_classes = [IsAuthenticated]
class CursoViewSet(viewsets.ModelViewSet):
    queryset = Curso.objects.all()
    serializer_class = CursoSerializer
    #permission_classes = [IsAuthenticated]
# ================================
# Vista para procesar PDF
# ================================
class PDFProcessView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = PDFUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        archivo = serializer.validated_data['archivo']
        original_name = archivo.name

        # Carpeta media
        media_dir = settings.MEDIA_ROOT
        os.makedirs(media_dir, exist_ok=True)

        # Archivo temporal
        temp_filename = os.path.join(media_dir, f"temp_{uuid.uuid4().hex}_{original_name}")
        with open(temp_filename, 'wb') as f:
            for chunk in archivo.chunks():
                f.write(chunk)

        try:
            # Convertir PDF a imágenes (Poppler requerido)
            images = convert_from_path(temp_filename, poppler_path=settings.POPPLER_PATH)

            processed_images = []
            for i, img in enumerate(images, start=1):
                w, h = img.size
                if w > h:  # rotar horizontal
                    img = img.rotate(90, expand=True)

                img = img.filter(ImageFilter.GaussianBlur(1))
                temp_img_path = os.path.join(media_dir, f"page_{uuid.uuid4().hex}.jpg")
                img.save(temp_img_path)
                processed_images.append(temp_img_path)

            # PDF final
            base = os.path.splitext(original_name)[0]
            output_filename = f"{base}_scan.pdf"
            output_path = os.path.join(media_dir, output_filename)

            pdf = FPDF()
            for img_path in processed_images:
                pdf.add_page()
                pdf.image(img_path, 0, 0, 210, 297)
            pdf.output(output_path)

            # limpiar imágenes temporales
            for img_path in processed_images:
                os.remove(img_path)

        finally:
            if os.path.exists(temp_filename):
                os.remove(temp_filename)

        # URL pública accesible desde frontend
        file_url = request.build_absolute_uri(f"{settings.MEDIA_URL}{output_filename}")

        return JsonResponse({"status": "ok", "file": output_filename, "url": file_url}, status=status.HTTP_200_OK)





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