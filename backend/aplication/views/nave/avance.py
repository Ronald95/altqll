
from rest_framework import viewsets
from rest_framework.response import Response
from aplication.models import Naves
from aplication.serializers.nave.avance import NavesAvanceSerializer
from aplication.models import RequisitoCertificadoNave
from aplication.serializers.requisitos import RequisitoCertificadoNaveSerializer


class NavesAvanceViewSet(viewsets.ViewSet):
    """
    API para obtener todas las naves con su porcentaje de certificados completados.
    """

    def list(self, request):
        naves = list(Naves.objects.all())
        # Calculamos los porcentajes para todas las naves en 2 queries
        porcentajes = RequisitoCertificadoNave.porcentaje_certificados_naves_optimizado(naves)

        serializer = NavesAvanceSerializer(naves, many=True, context={'porcentajes': porcentajes})
        return Response(serializer.data)
