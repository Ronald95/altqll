from rest_framework import serializers
from aplication.models import DetalleEstudio

class DetalleEstudioSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetalleEstudio
        fields = ["id", "nombre", "cantidad", "descripcion", "peso_total_tons"]

