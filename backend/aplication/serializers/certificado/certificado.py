from rest_framework import serializers
from aplication.models import Certificado, CertificadoImagen, CategoriaCertificado, Trabajador
from aplication.serializers.categorias.certificado import CategoriaCertificadoSerializer
from aplication.serializers.certificado.imagen import CertificadoImagenSerializer


class CertificadoSerializer(serializers.ModelSerializer):
    categoria = CategoriaCertificadoSerializer(read_only=True)
    imagenes = CertificadoImagenSerializer(source="imagenes_certificado", many=True, read_only=True)
    categoria_id = serializers.UUIDField(write_only=True)
    trabajador = serializers.PrimaryKeyRelatedField(queryset=Trabajador.objects.all(), write_only=True)

    # Campos opcionales para imágenes y flags
    foto_frontal = serializers.ImageField(write_only=True, required=False, allow_null=True)
    foto_trasera = serializers.ImageField(write_only=True, required=False, allow_null=True)
    foto_extra = serializers.ImageField(write_only=True, required=False, allow_null=True)
    eliminar_frontal = serializers.BooleanField(write_only=True, required=False, default=False)
    eliminar_trasera = serializers.BooleanField(write_only=True, required=False, default=False)
    eliminar_extra = serializers.BooleanField(write_only=True, required=False, default=False)
    mantener_frontal = serializers.BooleanField(write_only=True, required=False, default=False)
    mantener_trasera = serializers.BooleanField(write_only=True, required=False, default=False)
    mantener_extra = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = Certificado
        fields = [
            "id", "trabajador", "categoria", "categoria_id", "fecha_vigencia",
            "imagenes", "user",
            "foto_frontal", "foto_trasera", "foto_extra",
            "eliminar_frontal", "eliminar_trasera", "eliminar_extra",
            "mantener_frontal", "mantener_trasera", "mantener_extra",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]

    # Aquí irían los métodos create, update y _manejar_imagenes tal como los tienes
