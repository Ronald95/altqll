
from rest_framework import serializers
from aplication.models import CategoriaPirotecnia

class CategoriaPirotecniaSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaPirotecnia
        fields = [
            'id',
            'nombre'
        ]