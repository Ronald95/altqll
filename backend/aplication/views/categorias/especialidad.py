from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from aplication.models import CategoriaEspecialidad
from aplication.serializers.categorias.especialidad import CategoriaEspecialidadSerializer

class CategoriaEspecialidadViewSet(viewsets.ModelViewSet):
    queryset = CategoriaEspecialidad.objects.all().order_by('nombre')
    serializer_class = CategoriaEspecialidadSerializer
    permission_classes = [IsAuthenticated]