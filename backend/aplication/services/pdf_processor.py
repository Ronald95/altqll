# pdf_processor.py
import os
import uuid
from django.conf import settings
from django.http import JsonResponse
from pdf2image import convert_from_path
from pdf2image.exceptions import PDFInfoNotInstalledError
from PIL import ImageFilter
from fpdf import FPDF
from aplication.models import ProcessedPDF
from aplication.serializers import PDFUploadSerializer

# Servicio Supabase
from .supabase_client import upload_to_supabase, BUCKET_NAME


def procesar_pdf(request):
    """
    Procesa un PDF subido, aplica filtros y genera PDF final,
    lo sube a Supabase y guarda registro en la base de datos.
    """
    serializer = PDFUploadSerializer(data=request.data)
    if not serializer.is_valid():
        return JsonResponse(serializer.errors, status=400)

    archivo = serializer.validated_data['archivo']
    original_name = archivo.name

    # Carpeta temporal local
    temp_dir = settings.MEDIA_ROOT
    os.makedirs(temp_dir, exist_ok=True)
    temp_filename = os.path.join(temp_dir, f"temp_{uuid.uuid4().hex}_{original_name}")
    output_path = None  # Inicializar aquí

    # Guardar archivo temporal
    with open(temp_filename, 'wb') as f:
        for chunk in archivo.chunks():
            f.write(chunk)

    try:
        poppler_path = getattr(settings, "POPPLER_PATH", None)

        # Convertir PDF a imágenes
        try:
            images = convert_from_path(temp_filename, poppler_path=poppler_path)
        except PDFInfoNotInstalledError:
            return JsonResponse({
                "status": "error",
                "message": "Poppler no encontrado. Verifica POPPLER_PATH o el PATH del sistema."
            }, status=500)

        # Procesar imágenes
        processed_images = []
        for img in images:
            w, h = img.size
            if w > h:
                img = img.rotate(90, expand=True)
            
            # Convertir a RGB si es necesario (algunas imágenes pueden estar en modo RGBA o P)
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            img = img.filter(ImageFilter.GaussianBlur(1))
            temp_img_path = os.path.join(temp_dir, f"page_{uuid.uuid4().hex}.jpg")
            img.save(temp_img_path, 'JPEG', quality=85)
            processed_images.append(temp_img_path)

        # Crear PDF final usando FPDF
        base = os.path.splitext(original_name)[0]
        # Sanitizar el nombre del archivo (eliminar caracteres especiales)
        import re
        base = re.sub(r'[^\w\s-]', '', base).strip()
        output_filename = f"{base}_scan.pdf"
        output_path = os.path.join(temp_dir, output_filename)

        pdf = FPDF(unit='mm', format='A4')
        
        for img_path in processed_images:
            pdf.add_page()
            # Asegurarse de que la imagen se ajuste a la página A4 (210x297mm)
            pdf.image(img_path, x=0, y=0, w=210, h=297)

        # Guardar el PDF directamente
        pdf.output(output_path, 'F')

        # Limpiar imágenes temporales
        for img_path in processed_images:
            if os.path.exists(img_path):
                os.remove(img_path)

        # Verificar que el archivo PDF se creó correctamente
        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            return JsonResponse({
                "status": "error",
                "message": "Error al generar el PDF procesado"
            }, status=500)

        # Subir PDF final a Supabase y obtener URL pública
        file_url = upload_to_supabase(output_path, output_filename)
        file_size = os.path.getsize(output_path)

        # Guardar registro en DB
        ProcessedPDF.objects.create(
            user=request.user,
            original_name=original_name,
            output_name=output_filename,
            file_path=file_url,
            file_size=file_size
        )

    except Exception as e:
        return JsonResponse({
            "status": "error",
            "message": f"Error procesando PDF: {str(e)}"
        }, status=500)
        
    finally:
        # Limpiar archivos temporales
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
        if output_path and os.path.exists(output_path):
            os.remove(output_path)

    return JsonResponse({
        "status": "ok",
        "file": output_filename,
        "url": file_url,
        "size": file_size
    }, status=200)