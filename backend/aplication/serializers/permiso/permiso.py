from rest_framework import serializers
from aplication.models import Permiso, Trabajador
from aplication.serializers.categorias.permiso import CategoriaPermisoSerializer


class PermisoSerializer(serializers.ModelSerializer):
    categoria = CategoriaPermisoSerializer(read_only=True)
    trabajador = serializers.PrimaryKeyRelatedField(
        queryset=Trabajador.objects.all(),  # Para create/update
        write_only=True                     # No se muestra en GET
    )
    class Meta:
        model = Permiso
        fields = ['id', 'trabajador', 'categoria', 'fecha_vigencia', 'user']
