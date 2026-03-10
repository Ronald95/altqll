from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from aplication.models import CategoriaNave
from aplication.serializers.categorias.nave import CategoriaNaveSerializer

class CategoriaNaveViewSet(viewsets.ModelViewSet):
    queryset = CategoriaNave.objects.all().order_by('nombre')
    serializer_class = CategoriaNaveSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)