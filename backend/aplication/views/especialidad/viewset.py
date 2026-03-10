
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from aplication.models import Especialidad
from aplication.serializers.especialidad.especialidad import EspecialidadSerializer

class EspecialidadViewSet(viewsets.ModelViewSet):
    queryset = Especialidad.objects.all()
    serializer_class = EspecialidadSerializer
    permission_classes = [IsAuthenticated]