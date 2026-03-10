from rest_framework import serializers
from aplication.models import Trabajador
from aplication.serializers.trabajador.list import TrabajadorListSerializer
from aplication.serializers.certificado.certificado import CertificadoSerializer
from aplication.serializers.curso.curso import CursoSerializer
from aplication.serializers.especialidad.especialidad import EspecialidadSerializer
from aplication.serializers.titulo.titulo import TituloSerializer
from aplication.serializers.permiso.permiso import PermisoSerializer

class TrabajadorDetailSerializer(serializers.ModelSerializer):
    certificados = CertificadoSerializer(many=True, read_only=True)
    cursos = CursoSerializer(many=True, read_only=True)
    especialidades = EspecialidadSerializer(many=True, read_only=True)
    titulos = TituloSerializer(many=True, read_only=True)
    permisos = PermisoSerializer(many=True, read_only=True)
        
    
    def get_titulo(self, obj):
        return obj.titulo_set.all().values_list('titulo', flat=True)

    class Meta:
        model = Trabajador
        fields = '__all__'
