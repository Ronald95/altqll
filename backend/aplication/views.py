from django.http import JsonResponse
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from aplication.models import Trabajador, Cargo
from aplication.serializers import TrabajadorSerializer, CargoSerializer

class CargoViewSet(viewsets.ModelViewSet):
    queryset = Cargo.objects.all().order_by('nombre')
    serializer_class = CargoSerializer
    #permission_classes = [IsAuthenticated]

class TrabajadorViewSet(viewsets.ModelViewSet):
    queryset = Trabajador.objects.all().order_by('nombre')
    serializer_class = TrabajadorSerializer
    #permission_classes = [IsAuthenticated]
