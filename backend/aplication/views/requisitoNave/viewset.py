
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from aplication.models import RequisitoCertificadoNave
from aplication.serializers.requisitos import RequisitoCertificadoNaveSerializer

class RequisitoCertificadoNaveViewSet(viewsets.ModelViewSet):
    queryset = RequisitoCertificadoNave.objects.select_related(
        'categoria_certificado',
        'categoria_nave'
    ).prefetch_related('naves')

    serializer_class = RequisitoCertificadoNaveSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)