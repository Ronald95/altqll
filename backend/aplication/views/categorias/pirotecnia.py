from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from aplication.models import CategoriaPirotecnia
from aplication.serializers.categorias.pirotecnia import CategoriaPirotecniaSerializer

class CategoriaPirotecniaViewSet(viewsets.ModelViewSet):
    queryset = CategoriaPirotecnia.objects.all().order_by('nombre')
    serializer_class = CategoriaPirotecniaSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)