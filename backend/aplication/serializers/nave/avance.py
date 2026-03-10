from rest_framework import serializers
from aplication.models import Naves, RequisitoCertificadoNave

class NavesAvanceSerializer(serializers.ModelSerializer):
    porcentaje_completado = serializers.SerializerMethodField()
    certificados = serializers.SerializerMethodField()

    class Meta:
        model = Naves
        fields = ['id', 'nombre', 'porcentaje_completado', 'certificados']

    def get_porcentaje_completado(self, obj):
        porcentajes = self.context.get('porcentajes', {})
        return porcentajes.get(obj.id, 0)
    
    def get_certificados(self, obj):
        # Lista con nombre del certificado y estado OK/PENDIENTE
        return RequisitoCertificadoNave.certificados_por_nave(obj)

