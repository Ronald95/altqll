from rest_framework import serializers
from aplication.models import Naves

class NaveSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(
        source='categoria.nombre',
        read_only=True
    )

    class Meta:
        model = Naves
        fields = [
            'id',
            'nombre',
            'sllamada',
            'matricula',
            'eslora',
            'manga',
            'puntal',
            'trg',
            'tminima',
            'tmaxima',
            'pasajeros',
            'actividad',
            'imagen',
            'categoria',
            'categoria_nombre',
            'created_at',
            'updated_at'
        ]
