from tkinter import N
import uuid
from django.db import models
from django.conf import settings
from .EstudioNave import EstudioNave

class DetalleEstudio(models.Model):
    """
    Detalle de elementos que forman parte del documento técnico.
    Ej: 20 bins, 4 bateas de 20 tns c/u, 1 camión de gas, etc.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    estudio = models.ForeignKey(EstudioNave, on_delete=models.CASCADE, related_name="detalles", default="", null=True, blank=True)
    nombre = models.CharField(max_length=100)
    cantidad = models.PositiveIntegerField(default=1)
    descripcion = models.TextField(blank=True, null=True)
    peso_total_tons = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,   
        on_delete=models.PROTECT,
        related_name="detalles_estudios",
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.nombre} ({self.cantidad})"