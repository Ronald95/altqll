import uuid
from django.db import models
from django.conf import settings
from .Trabajador import Trabajador
from .TipoMatricula import TipoMatricula

class MatriculaTrabajador(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trabajador = models.ForeignKey(
        Trabajador,
        on_delete=models.CASCADE,
        related_name='matriculas'
    )
    tipo = models.ForeignKey(
        TipoMatricula,
        on_delete=models.PROTECT,
        related_name='matriculas'
    )
    fecha = models.DateField(blank=True, null=True)
    observacion = models.TextField(blank=True, null=True)    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,   
        on_delete=models.PROTECT,
        related_name="matriculas"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.tipo.nombre} - {self.trabajador.nombre} - {self.fecha}"

