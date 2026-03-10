from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from aplication.models.PirotecniaNave import PirotecniaNave
from aplication.serializers.pirotecnia.pirotecnia import PirotecniaSerializer

class PirotecniaViewSet(viewsets.ModelViewSet):
    queryset = PirotecniaNave.objects.all()
    serializer_class = PirotecniaSerializer
    permission_classes = [IsAuthenticated]