from rest_framework import serializers
from aplication.models import Trabajador, CategoriaCertificado, CategoriaEspecialidad, Especialidad, EspecialidadImagen, CategoriaCurso, Certificado, Curso, ProcessedPDF, CertificadoImagen
from django.conf import settings


class PDFUploadSerializer(serializers.Serializer):
    archivo = serializers.FileField()

    def validate_archivo(self, value):
        if value.content_type not in ["application/pdf"]:
            raise serializers.ValidationError("El archivo debe ser un PDF.")
        return value

class ProcessedPDFSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcessedPDF
        fields = ["id", "original_name", "output_name", "file_path", "file_size", "created_at"]


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


# serializers.py
class CertificadoSerializer(serializers.ModelSerializer):
    categoria = CategoriaCertificadoSerializer(read_only=True)
    imagenes = CertificadoImagenSerializer(
        source="imagenes_certificado",
        many=True,
        read_only=True
    )
    
    categoria_id = serializers.UUIDField(write_only=True)
    trabajador = serializers.PrimaryKeyRelatedField(
        queryset=Trabajador.objects.all(),
        write_only=True
    )
    
    # Campos para recibir nuevas imágenes
    foto_frontal = serializers.ImageField(write_only=True, required=False, allow_null=True)
    foto_trasera = serializers.ImageField(write_only=True, required=False, allow_null=True)
    foto_extra = serializers.ImageField(write_only=True, required=False, allow_null=True)
    
    # Campos para flags de eliminación/mantenimiento
    eliminar_frontal = serializers.BooleanField(write_only=True, required=False, default=False)
    eliminar_trasera = serializers.BooleanField(write_only=True, required=False, default=False)
    eliminar_extra = serializers.BooleanField(write_only=True, required=False, default=False)
    
    mantener_frontal = serializers.BooleanField(write_only=True, required=False, default=False)
    mantener_trasera = serializers.BooleanField(write_only=True, required=False, default=False)
    mantener_extra = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = Certificado
        fields = [
            "id",
            "trabajador",
            "categoria",
            "categoria_id",
            "fecha_vigencia",
            "imagenes",
            "user",
            # Campos para imágenes
            "foto_frontal",
            "foto_trasera",
            "foto_extra",
            # Campos para flags
            "eliminar_frontal",
            "eliminar_trasera",
            "eliminar_extra",
            "mantener_frontal",
            "mantener_trasera",
            "mantener_extra",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]

    def create(self, validated_data):
        # Extraer imágenes y flags
        foto_frontal = validated_data.pop('foto_frontal', None)
        foto_trasera = validated_data.pop('foto_trasera', None)
        foto_extra = validated_data.pop('foto_extra', None)
        
        # No necesitamos flags de eliminación/mantenimiento en creación
        validated_data.pop('eliminar_frontal', False)
        validated_data.pop('eliminar_trasera', False)
        validated_data.pop('eliminar_extra', False)
        validated_data.pop('mantener_frontal', False)
        validated_data.pop('mantener_trasera', False)
        validated_data.pop('mantener_extra', False)
        
        # Manejar categoria_id
        categoria_id = validated_data.pop("categoria_id")
        validated_data["categoria_id"] = categoria_id
        
        # Asignar usuario actual
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['user'] = request.user
        
        # Crear el certificado
        certificado = super().create(validated_data)
        
        # Crear las imágenes asociadas
        self._manejar_imagenes(certificado, 'create', {
            'frontal': foto_frontal,
            'trasera': foto_trasera,
            'extra': foto_extra,
        })
        
        return certificado

    def update(self, instance, validated_data):
        # Extraer imágenes y flags
        foto_frontal = validated_data.pop('foto_frontal', None)
        foto_trasera = validated_data.pop('foto_trasera', None)
        foto_extra = validated_data.pop('foto_extra', None)
        
        # Extraer flags
        eliminar_frontal = validated_data.pop('eliminar_frontal', False)
        eliminar_trasera = validated_data.pop('eliminar_trasera', False)
        eliminar_extra = validated_data.pop('eliminar_extra', False)
        
        mantener_frontal = validated_data.pop('mantener_frontal', False)
        mantener_trasera = validated_data.pop('mantener_trasera', False)
        mantener_extra = validated_data.pop('mantener_extra', False)
        
        # Manejar categoria_id
        categoria_id = validated_data.pop("categoria_id", None)
        if categoria_id:
            validated_data["categoria_id"] = categoria_id
        
        # Actualizar el certificado
        certificado = super().update(instance, validated_data)
        
        # Manejar imágenes según flags
        self._manejar_imagenes(certificado, 'update', {
            'frontal': {
                'nueva': foto_frontal,
                'eliminar': eliminar_frontal,
                'mantener': mantener_frontal
            },
            'trasera': {
                'nueva': foto_trasera,
                'eliminar': eliminar_trasera,
                'mantener': mantener_trasera
            },
            'extra': {
                'nueva': foto_extra,
                'eliminar': eliminar_extra,
                'mantener': mantener_extra
            }
        })
        
        return certificado

    def _manejar_imagenes(self, certificado, accion, imagenes_info):
        """Manejar lógica de imágenes según la acción"""
        for tipo, info in imagenes_info.items():
            imagen_existente = certificado.imagenes_certificado.filter(tipo=tipo).first()
            
            if accion == 'create':
                # Para creación, solo crear si hay imagen
                if info:  # info es directamente la imagen en creación
                    orden = certificado.imagenes_certificado.count() + 1
                    CertificadoImagen.objects.create(
                        certificado=certificado,
                        imagen=info,
                        tipo=tipo,
                        orden=orden
                    )
                    
            elif accion == 'update':
                # Para actualización, lógica más compleja
                
                # 1. Si se marca para eliminar
                if info.get('eliminar') and imagen_existente:
                    imagen_existente.delete()
                    continue
                
                # 2. Si se envía una nueva imagen
                if info.get('nueva'):
                    if imagen_existente:
                        # Actualizar imagen existente
                        imagen_existente.imagen = info['nueva']
                        imagen_existente.save()
                    else:
                        # Crear nueva imagen
                        orden = certificado.imagenes_certificado.count() + 1
                        CertificadoImagen.objects.create(
                            certificado=certificado,
                            imagen=info['nueva'],
                            tipo=tipo,
                            orden=orden
                        )
                
                # 3. Si se marca para mantener (no hacer nada, ya existe)
                # elif info.get('mantener') and imagen_existente:
                #    pass  # No hacer nada, la imagen ya existe
                
                # 4. Si no hay imagen, no se envía nueva, y no se marca mantener/eliminar
                #    No hacer nada
    

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
    
    def get_fields(self, *args, **kwargs):
        fields = super().get_fields(*args, **kwargs)
        # Si no estamos en DEBUG (producción), eliminamos correo y teléfono
        if not settings.DEBUG:
            fields.pop('correo', None)
            fields.pop('telefono', None)
        return fields

class TrabajadorDetailSerializer(serializers.ModelSerializer):
    certificados = CertificadoSerializer(many=True, read_only=True)
    cursos = CursoSerializer(many=True, read_only=True)
    especialidades = EspecialidadSerializer(many=True, read_only=True)

    class Meta:
        model = Trabajador
        fields = '__all__'

