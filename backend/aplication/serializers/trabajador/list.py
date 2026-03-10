from rest_framework import serializers
from aplication.models import Trabajador
from django.conf import settings

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