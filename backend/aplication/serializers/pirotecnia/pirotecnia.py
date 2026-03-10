from rest_framework import serializers
from aplication.models import CategoriaPirotecnia, PirotecniaNave, Naves


class PirotecniaSerializer(serializers.ModelSerializer):
    # Campos legibles
    categoria_nombre = serializers.CharField(source="categoria.nombre", read_only=True)
    nave_nombre = serializers.CharField(source="nave.nombre", read_only=True)
    fecha = serializers.DateField(
        format="%Y-%m-%d",
        input_formats=["%Y-%m-%d"],
        allow_null=True,
        required=False
    )
    # Para crear/editar
    categoria = serializers.PrimaryKeyRelatedField(queryset=CategoriaPirotecnia.objects.all())
    nave = serializers.PrimaryKeyRelatedField(queryset=Naves.objects.all())

    class Meta:
        model = PirotecniaNave
        fields = [
            "id",
            "categoria",
            "categoria_nombre",
            "nave",
            "nave_nombre",
            "cantidad",
            "fecha",
            "observacion",
            "user",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["user", "created_at", "updated_at"]
