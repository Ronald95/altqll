from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from aplication.models import EspecialidadImagen 
from aplication.serializers.especialidad.imagenes import EspecialidadImagenSerializer


class EspecialidadImagenViewSet(viewsets.ModelViewSet):
    queryset = EspecialidadImagen.objects.all()
    serializer_class = EspecialidadImagenSerializer
    permission_classes = [IsAuthenticated]

