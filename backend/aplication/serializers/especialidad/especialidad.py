from rest_framework import serializers
from aplication.models import Especialidad, Trabajador
from aplication.serializers.categorias.especialidad import CategoriaEspecialidadSerializer


class EspecialidadSerializer(serializers.ModelSerializer):
    categoria = CategoriaEspecialidadSerializer(read_only=True)
    trabajador = serializers.PrimaryKeyRelatedField(
        queryset=Trabajador.objects.all(),  # Para create/update
        write_only=True                     # No se muestra en GET
    )
    class Meta:
        model = Especialidad
        fields = ['id', 'trabajador', 'categoria', 'fecha_vigencia', 'observacion', 'user']

