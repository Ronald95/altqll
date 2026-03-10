from rest_framework import serializers
from aplication.models import CategoriaPermiso

class CategoriaPermisoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaPermiso
        fields = ['id', 'nombre']