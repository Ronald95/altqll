from rest_framework import serializers
from aplication.models import CategoriaCertificado

class CategoriaCertificadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaCertificado  
        fields = ['id', 'codigo', 'nombre', 'user']
