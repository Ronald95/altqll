from rest_framework import serializers
from aplication.models import Curso, CategoriaCurso, Trabajador
from aplication.serializers.categorias.curso import CategoriaCursoSerializer

class CursoSerializer(serializers.ModelSerializer):
    categoria = CategoriaCursoSerializer(read_only=True)
    trabajador = serializers.PrimaryKeyRelatedField(queryset=Trabajador.objects.all(), write_only=True)

    class Meta:
        model = Curso
        fields = ['id', 'trabajador', 'categoria', 'fecha_vigencia', 'user']
