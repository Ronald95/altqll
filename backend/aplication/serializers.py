from rest_framework import serializers
from aplication.models import Trabajador, Cargo

class CargoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cargo
        fields = ['id', 'nombre', 'user', 'created_at', 'updated_at']

class TrabajadorSerializer(serializers.ModelSerializer):
    cargo = CargoSerializer(many=True, read_only=True)
    cargo_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Cargo.objects.all(), write_only=True, source='cargo'
    )

    class Meta:
        model = Trabajador
        fields = [
            'id',
            'rut',
            'nombre',
            'residencia',
            'correo',
            'telefono',
            'estado',
            'cargo',
            'cargo_ids',
            'created_at',
            'updated_at',
        ]
