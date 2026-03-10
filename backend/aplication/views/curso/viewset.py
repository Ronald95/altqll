
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from aplication.models import Curso
from aplication.serializers.curso.curso import CursoSerializer

class CursoViewSet(viewsets.ModelViewSet):
    queryset = Curso.objects.all()
    serializer_class = CursoSerializer
    permission_classes = [IsAuthenticated]