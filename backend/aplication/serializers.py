from rest_framework import serializers
from aplication.models import Trabajador, Cargo, TipoMatricula, MatriculaTrabajador, MatriculaImagen

class CargoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cargo
        fields = ['id', 'nombre', 'user', 'created_at', 'updated_at']

class TrabajadorSerializer(serializers.ModelSerializer):
    # Lectura: devuelve el objeto Cargo completo
    cargo_data = CargoSerializer(source='cargo', read_only=True)

    # Escritura: solo se envía el ID del Cargo
    cargo = serializers.PrimaryKeyRelatedField(
        queryset=Cargo.objects.all(),
        write_only=True,
        allow_null=True,  # porque cargo puede ser null
        required=False
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
            'cargo',       # write_only
            'cargo_data',  # read_only
            'created_at',
            'updated_at',
        ]

class PDFUploadSerializer(serializers.Serializer):
    archivo = serializers.FileField()

    def validate_archivo(self, value):
        if value.content_type not in ["application/pdf"]:
            raise serializers.ValidationError("El archivo debe ser un PDF.")
        return value

class TipoMatriculaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoMatricula
        fields = ['id', 'nombre', 'user', 'created_at', 'updated_at']

class MatriculaTrabajadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatriculaTrabajador
        fields = ['id', 'trabajador', 'tipo', 'fecha', 'observacion', 'user', 'created_at', 'updated_at']

class MatriculaImagenSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatriculaImagen
        fields = ['id', 'matricula', 'imagen', 'user', 'created_at', 'updated_at']

