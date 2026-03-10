from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError
from django.utils.timezone import now
from datetime import timedelta
import uuid

from aplication.models import CertificadoNave, Naves
from aplication.serializers.certificado.certificadoNave import CertificadoNaveSerializer


class CertificadoNaveViewSet(viewsets.ModelViewSet):
    queryset = CertificadoNave.objects.all()
    serializer_class = CertificadoNaveSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        queryset = CertificadoNave.objects.select_related("categoria", "nave")

        # Solo filtrar en list
        if self.action != "list":
            return queryset

        nave_id = self.request.query_params.get("nave")
        vigencia = self.request.query_params.get("vigencia")

        # Si no envía nave, no listar nada
        if not nave_id:
            return queryset.none()

        # Validar UUID
        try:
            nave_uuid = uuid.UUID(nave_id)
        except ValueError:
            raise ValidationError({"nave": "UUID inválido."})

        # Validar existencia de nave
        try:
            nave = Naves.objects.get(id=nave_uuid)
        except Naves.DoesNotExist:
            raise ValidationError({"nave": "La nave no existe."})

        queryset = queryset.filter(nave=nave)

        # 📅 Filtro por vigencia
        if vigencia:
            hoy = now().date()
            vigencia = vigencia.lower()

            if vigencia == "vencidos":
                queryset = queryset.filter(fecha_vigencia__lt=hoy)

            elif vigencia == "vigentes":
                queryset = queryset.filter(fecha_vigencia__gte=hoy)

            elif vigencia == "por_vencer":
                limite = hoy + timedelta(days=30)
                queryset = queryset.filter(
                    fecha_vigencia__gte=hoy,
                    fecha_vigencia__lte=limite
                )

            else:
                raise ValidationError({
                    "vigencia": "Valor inválido. Use: vencidos, vigentes o por_vencer."
                })

        return queryset
