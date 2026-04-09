from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from aplication.models import CategoriaEstudioNave
from aplication.serializers.categorias.estudioNave import CategoriaEstudioNaveSerializer

class CategoriaEstudioNaveViewSet(viewsets.ModelViewSet):
    queryset = CategoriaEstudioNave.objects.all().order_by('nombre')
    serializer_class = CategoriaEstudioNaveSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)