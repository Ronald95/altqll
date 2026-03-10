
from rest_framework import serializers
from aplication.models import CertificadoImagen

class CertificadoImagenSerializer(serializers.ModelSerializer):
    class Meta:
        model = CertificadoImagen
        fields = [
            "id",
            "certificado",
            "imagen",
            "tipo",
            "orden",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "certificado"]