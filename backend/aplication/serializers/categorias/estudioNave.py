
from rest_framework import serializers
from aplication.models import CategoriaEstudioNave

class CategoriaEstudioNaveSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaEstudioNave
        fields = [
            'id',
            'nombre'
        ]