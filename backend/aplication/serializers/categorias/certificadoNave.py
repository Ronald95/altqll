
from rest_framework import serializers
from aplication.models import CategoriaCertificadoNave

class CategoriaCertificadoNaveSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaCertificadoNave
        fields = [
            'id',
            'nombre'
        ]