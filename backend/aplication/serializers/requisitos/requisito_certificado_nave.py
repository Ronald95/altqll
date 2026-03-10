from rest_framework import serializers
from aplication.models import RequisitoCertificadoNave, CertificadoNave

class RequisitoCertificadoNaveSerializer(serializers.ModelSerializer):
    categoria_certificado_nombre = serializers.CharField(
        source='categoria_certificado.nombre',
        read_only=True
    )
    categoria_nave_nombre = serializers.CharField(
        source='categoria_nave.nombre',
        read_only=True
    )

    class Meta:
        model = RequisitoCertificadoNave
        fields = [
            'id',
            'categoria_certificado',
            'categoria_certificado_nombre',
            'categoria_nave',
            'categoria_nave_nombre',
            'obligatorio',
            'aplica_a_todas',
            'naves',
            'created_at',
            'updated_at'
        ]
