from rest_framework import serializers
from aplication.models import CategoriaEstudioNave, EstudioNave, Naves
from aplication.serializers.categorias.estudioNave import CategoriaEstudioNaveSerializer
from aplication.serializers.detalleEstudio.detalleEstudio import DetalleEstudioSerializer


class EstudioNaveSerializer(serializers.ModelSerializer):
    categoria = CategoriaEstudioNaveSerializer(read_only=True)
    nave_nombre = serializers.CharField(source="nave.nombre", read_only=True)
    # Para escritura (POST/PUT)
    categoria_id = serializers.PrimaryKeyRelatedField(
        queryset=CategoriaEstudioNave.objects.all(),
        source="categoria",
        write_only=True
    )
    nave = serializers.PrimaryKeyRelatedField(queryset=Naves.objects.all())
    fecha_vigencia = serializers.DateField(
        format="%Y-%m-%d",
        input_formats=["%Y-%m-%d"],
        allow_null=True,
        required=False
    )
    detalles = DetalleEstudioSerializer(many=True, read_only=True)
    fecha_aprobacion = serializers.DateField(
        format="%Y-%m-%d",
        input_formats=["%Y-%m-%d"],
        allow_null=True,
        required=False
    )

    class Meta:
        model = EstudioNave
        fields = [
            "id",
            "categoria",
            "categoria_id",
            "nave",
            "detalles",
            "nave_nombre",
            "fecha_vigencia",
            "archivo_pdf",
            "fecha_aprobacion",
            "observacion",
            "user",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["user", "created_at", "updated_at"]
