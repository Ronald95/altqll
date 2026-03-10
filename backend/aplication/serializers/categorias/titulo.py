from rest_framework import serializers
from aplication.models import CategoriaTitulo

class CategoriaTituloSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaTitulo
        fields = ['id', 'nombre']