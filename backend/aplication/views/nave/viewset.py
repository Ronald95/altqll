from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from aplication.models import Naves
from aplication.serializers.nave import NaveSerializer

class NaveViewSet(viewsets.ModelViewSet):
    queryset = Naves.objects.select_related('categoria')
    serializer_class = NaveSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)