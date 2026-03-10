from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from aplication.models import CategoriaCertificado
from aplication.serializers.categorias import CategoriaCertificadoSerializer

class CategoriaCertificadoViewSet(viewsets.ModelViewSet):
    queryset = CategoriaCertificado.objects.all().order_by('nombre')
    serializer_class = CategoriaCertificadoSerializer
    permission_classes = [IsAuthenticated]