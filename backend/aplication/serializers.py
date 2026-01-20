from rest_framework import serializers
from aplication.models import Trabajador, CategoriaCertificado, CategoriaEspecialidad, Especialidad, EspecialidadImagen, CategoriaCurso, Certificado, Curso



class PDFUploadSerializer(serializers.Serializer):
    archivo = serializers.FileField()

    def validate_archivo(self, value):
        if value.content_type not in ["application/pdf"]:
            raise serializers.ValidationError("El archivo debe ser un PDF.")
        return value

class CategoriaEspecialidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaEspecialidad
        fields = ['id', 'codigo', 'nombre', 'user']

class CategoriaCertificadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaCertificado  
        fields = ['id', 'codigo', 'nombre', 'user']

class CategoriaCursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaCurso
        fields = ['id', 'codigo', 'nombre', 'user']

class EspecialidadSerializer(serializers.ModelSerializer):
    categoria = CategoriaEspecialidadSerializer(read_only=True)
    trabajador = serializers.PrimaryKeyRelatedField(
        queryset=Trabajador.objects.all(),  # Para create/update
        write_only=True                     # No se muestra en GET
    )
    class Meta:
        model = Especialidad
        fields = ['id', 'trabajador', 'categoria', 'fecha_vigencia', 'observacion', 'user']

class EspecialidadImagenSerializer(serializers.ModelSerializer):
    class Meta:
        model = EspecialidadImagen
        fields = ['id', 'especialidad', 'imagen', 'user']

class CertificadoSerializer(serializers.ModelSerializer):
    categoria = CategoriaCertificadoSerializer(read_only=True)
    trabajador = serializers.PrimaryKeyRelatedField(
        queryset=Trabajador.objects.all(),  # Para create/update
        write_only=True                     # No se muestra en GET
    )
    class Meta:
        model = Certificado
        fields = ['id', 'trabajador', 'categoria', 'fecha_vigencia', 'user']

class CursoSerializer(serializers.ModelSerializer):
    categoria = CategoriaCursoSerializer(read_only=True)
    trabajador = serializers.PrimaryKeyRelatedField(
        queryset=Trabajador.objects.all(),  # Para create/update
        write_only=True                     # No se muestra en GET
    )
    class Meta:
        model = Curso
        fields = ['id', 'trabajador', 'categoria', 'fecha_vigencia', 'user']



class TrabajadorListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trabajador
        # Solo campos básicos
        fields = ['id', 'rut', 'nombre', 'fecha_nacimiento', 'correo', 'telefono', 'estado']

class TrabajadorDetailSerializer(serializers.ModelSerializer):
    certificados = CertificadoSerializer(many=True, read_only=True)
    cursos = CursoSerializer(many=True, read_only=True)
    especialidades = EspecialidadSerializer(many=True, read_only=True)

    class Meta:
        model = Trabajador
        fields = '__all__'

