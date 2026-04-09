from rest_framework import serializers
from aplication.models import CertificadoNave, CategoriaCertificadoNave, Naves
from aplication.serializers.categorias.certificadoNave import CategoriaCertificadoNaveSerializer


class CertificadoNaveSerializer(serializers.ModelSerializer):
    # 🔹 SOLO LECTURA (GET)
    categoria = CategoriaCertificadoNaveSerializer(read_only=True)

    # 🔹 SOLO ESCRITURA (POST / PUT)
    categoria_id = serializers.PrimaryKeyRelatedField(
        source="categoria",
        queryset=CategoriaCertificadoNave.objects.all(),
        write_only=True
    )
    nave_id = serializers.PrimaryKeyRelatedField(
        source="nave",
        queryset=Naves.objects.all(),
        write_only=True
    )

    fecha_emision = serializers.DateField(
        format="%Y-%m-%d",
        input_formats=["%Y-%m-%d"],
        required=False,
        allow_null=True
    )

    fecha_vigencia = serializers.DateField(
        format="%Y-%m-%d",
        input_formats=["%Y-%m-%d"],
        required=False,
        allow_null=True
    )

    class Meta:
        model = CertificadoNave
        fields = [
            "id",
            "nave_id",
            "fecha_emision",
            "categoria",
            "categoria_id",
            "fecha_vigencia",
            "observacion",
            "archivo"
        ]
        read_only_fields = ["created_at", "updated_at"]