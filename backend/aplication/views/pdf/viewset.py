from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from aplication.models import ProcessedPDF
from aplication.serializers.pdf import ProcessedPDFSerializer
from aplication.services.pdf_processor import procesar_pdf
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import os

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