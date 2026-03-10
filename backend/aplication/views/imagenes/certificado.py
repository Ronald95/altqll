from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from aplication.models import CertificadoImagen
from aplication.serializers.certificado.imagen import CertificadoImagenSerializer

class CertificadoImagenViewSet(viewsets.ModelViewSet):
    queryset = CertificadoImagen.objects.all()
    serializer_class = CertificadoImagenSerializer
    permission_classes = [IsAuthenticated]
