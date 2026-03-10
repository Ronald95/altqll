from rest_framework import serializers
from aplication.models import CategoriaCurso

class CategoriaCursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaCurso
        fields = ['id', 'codigo', 'nombre', 'user']