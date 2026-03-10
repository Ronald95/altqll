from rest_framework import serializers
from aplication.models import Naves

class NaveDashboardSerializer(serializers.ModelSerializer):
    categoria = serializers.CharField(source='categoria.nombre')
    porcentaje_certificados = serializers.SerializerMethodField()

    class Meta:
        model = Naves
        fields = [
            'id',
            'nombre',
            'categoria',
            'porcentaje_certificados'
        ]

    def get_porcentaje_certificados(self, obj):
        return porcentaje_certificados_naves(obj)