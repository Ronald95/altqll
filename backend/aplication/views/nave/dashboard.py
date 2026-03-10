from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from aplication.models import Naves
from aplication.views.requisitoNave.viewset import RequisitoCertificadoNave
from aplication.views.nave.avance import NavesAvanceSerializer

class DashboardNavesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        naves = Naves.objects.select_related('categoria')
        porcentajes = RequisitoCertificadoNave.porcentaje_certificados_naves(naves)

        serializer = NavesAvanceSerializer(
            naves,
            many=True,
            context={
                'request': request,
                'porcentajes': porcentajes
            }
        )

        return Response(serializer.data)
