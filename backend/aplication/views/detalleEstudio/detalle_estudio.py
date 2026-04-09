from rest_framework import viewsets
from aplication.models import DetalleEstudio
from aplication.serializers.detalleEstudio.detalleEstudio import DetalleEstudioSerializer

class DetalleEstudioViewSet(viewsets.ModelViewSet):
    queryset = DetalleEstudio.objects.all()
    serializer_class = DetalleEstudioSerializer
