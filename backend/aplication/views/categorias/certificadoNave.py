from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from aplication.models import CategoriaCertificadoNave
from aplication.serializers.categorias.certificadoNave import CategoriaCertificadoNaveSerializer

class CategoriaCertificadoNaveViewSet(viewsets.ModelViewSet):
    queryset = CategoriaCertificadoNave.objects.all().order_by('nombre')
    serializer_class = CategoriaCertificadoNaveSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)