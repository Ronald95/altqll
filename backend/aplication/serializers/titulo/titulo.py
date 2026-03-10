from rest_framework import serializers
from aplication.models import Titulo, CategoriaTitulo, Trabajador
from aplication.serializers.categorias.titulo import CategoriaTituloSerializer

class TituloSerializer(serializers.ModelSerializer):
    categoria = CategoriaTituloSerializer(read_only=True)
    trabajador = serializers.PrimaryKeyRelatedField(
        queryset=Trabajador.objects.all(),  # Para create/update
        write_only=True                     # No se muestra en GET
    )
    class Meta:
        model = Titulo
        fields = ['id', 'trabajador', 'categoria', 'fecha_vigencia', 'user']