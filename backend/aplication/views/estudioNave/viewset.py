from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from aplication.models import EstudioNave, Naves
from aplication.serializers.estudioNave.estudionave import EstudioNaveSerializer
import uuid


class EstudioNaveViewSet(viewsets.ModelViewSet):
    queryset = EstudioNave.objects.all()
    serializer_class = EstudioNaveSerializer

    # ---------------------------------------
    # GET con ?nave=
    # ---------------------------------------
    def get_queryset(self):
        nave_id = self.request.query_params.get("nave")

        if not nave_id:
            return EstudioNave.objects.none()

        # Validar UUID
        try:
            uuid.UUID(nave_id)
        except ValueError:
            raise ValidationError({"nave": "UUID inválido."})

        # Validar que exista la nave
        try:
            nave = Naves.objects.get(id=nave_id)
        except Naves.DoesNotExist:
            raise ValidationError({"nave": "La nave no existe."})

        queryset = EstudioNave.objects.filter(nave=nave)
        return queryset

    # ---------------------------------------
    # CREATE directo con serializer
    # ---------------------------------------
    def create(self, request, *args, **kwargs):
        serializer = EstudioNaveSerializer(
            data=request.data,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        estudio = serializer.save(user=request.user)  # Asignar usuario
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # ---------------------------------------
    # UPDATE directo con serializer
    # ---------------------------------------
    def update(self, request, *args, **kwargs):
        estudio = self.get_object()
        serializer = EstudioNaveSerializer(
            estudio,
            data=request.data,
            partial=True,  # permite actualizaciones parciales
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        estudio = serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)