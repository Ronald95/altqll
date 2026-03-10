from rest_framework import serializers
from aplication.models import CategoriaEspecialidad

class CategoriaEspecialidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaEspecialidad
        fields = ['id', 'codigo', 'nombre', 'user']