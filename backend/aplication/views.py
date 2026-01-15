from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from aplication.models import Trabajador, Cargo
from aplication.serializers import TrabajadorSerializer, CargoSerializer, PDFUploadSerializer
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


class CargoViewSet(viewsets.ModelViewSet):
    queryset = Cargo.objects.all().order_by('nombre')
    serializer_class = CargoSerializer
    #permission_classes = [IsAuthenticated]

class TrabajadorViewSet(viewsets.ModelViewSet):
    queryset = Trabajador.objects.all().order_by('nombre')
    serializer_class = TrabajadorSerializer
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