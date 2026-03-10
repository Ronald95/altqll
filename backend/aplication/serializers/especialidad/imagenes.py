
from rest_framework import serializers
from aplication.models import EspecialidadImagen

class EspecialidadImagenSerializer(serializers.ModelSerializer):
    class Meta:
        model = EspecialidadImagen
        fields = ['id', 'especialidad', 'imagen', 'user']
