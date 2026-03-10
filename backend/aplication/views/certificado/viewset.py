from aplication.models.Certificado import Certificado
from aplication.serializers.certificado.certificado import CertificadoSerializer
from aplication.models.CertificadoImagen import CertificadoImagen
from aplication.serializers.certificado.imagen import CertificadoImagenSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
from rest_framework import viewsets

class CertificadoViewSet(viewsets.ModelViewSet):
    queryset = Certificado.objects.all().select_related('categoria', 'user')
    serializer_class = CertificadoSerializer
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtrar por trabajador si se proporciona
        trabajador_id = self.request.query_params.get('trabajador')
        if trabajador_id:
            queryset = queryset.filter(trabajador_id=trabajador_id)
            
        return queryset
    
    def perform_create(self, serializer):
        with transaction.atomic():
            serializer.save()
    
    def perform_update(self, serializer):
        with transaction.atomic():
            serializer.save()
    
    # Los actions para manejo individual de imágenes son opcionales
    # pero útiles si quieres operaciones específicas
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def agregar_imagen(self, request, pk=None):
        """Agregar o reemplazar una imagen específica (endpoint opcional)"""
        certificado = self.get_object()
        tipo = request.data.get('tipo')
        imagen_file = request.FILES.get('imagen')
        
        if not tipo or not imagen_file:
            return Response(
                {'error': 'Se requieren tipo e imagen'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if tipo not in ['frontal', 'trasera', 'extra']:
            return Response(
                {'error': 'Tipo inválido. Use: frontal, trasera o extra'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            imagen, created = CertificadoImagen.objects.get_or_create(
                certificado=certificado,
                tipo=tipo,
                defaults={'imagen': imagen_file}
            )
            
            if not created:
                imagen.imagen = imagen_file
                imagen.save()
        
        serializer = CertificadoImagenSerializer(imagen)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['delete'])
    def eliminar_imagen(self, request, pk=None):
        """Eliminar una imagen específica (endpoint opcional)"""
        certificado = self.get_object()
        tipo = request.query_params.get('tipo')
        
        if not tipo:
            return Response(
                {'error': 'Se requiere el tipo de imagen'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                imagen = certificado.imagenes_certificado.get(tipo=tipo)
                imagen.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except CertificadoImagen.DoesNotExist:
            return Response(
                {'error': 'Imagen no encontrada'}, 
                status=status.HTTP_404_NOT_FOUND
            )
