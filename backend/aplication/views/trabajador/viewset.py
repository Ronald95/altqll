# views/trabajador/viewset.py

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from aplication.models import Trabajador
from aplication.serializers.trabajador import (TrabajadorListSerializer,TrabajadorDetailSerializer)


class TrabajadorViewSet(viewsets.ModelViewSet):
    queryset = Trabajador.objects.all().order_by('nombre')
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TrabajadorDetailSerializer
        return TrabajadorListSerializer
