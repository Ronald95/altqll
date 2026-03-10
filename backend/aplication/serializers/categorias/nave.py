
from rest_framework import serializers
from aplication.models import CategoriaNave

class CategoriaNaveSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaNave
        fields = [
            'id',
            'nombre',
            'created_at',
            'updated_at'
        ]