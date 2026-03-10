from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from aplication.models import CategoriaCurso
from aplication.serializers.categorias.curso import CategoriaCursoSerializer

class CategoriaCursoViewSet(viewsets.ModelViewSet):
    queryset = CategoriaCurso.objects.all().order_by('nombre')
    serializer_class = CategoriaCursoSerializer
    permission_classes = [IsAuthenticated]