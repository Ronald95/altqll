

from django.db import models
from .Trabajador import Trabajador
from .CategoriaEspecialidad import CategoriaEspecialidad
from django.conf import settings
import uuid

class Especialidad(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trabajador = models.ForeignKey(
        Trabajador,
        related_name="especialidades",
        on_delete=models.CASCADE
    )
    categoria = models.ForeignKey(
        CategoriaEspecialidad,
        related_name="especialidades",
        on_delete=models.CASCADE
    )
    fecha_vigencia = models.DateField(null=True, blank=True)
    observacion = models.TextField(blank=True, null=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,   
        on_delete=models.PROTECT,
        related_name="especialidades",
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        unique_together = ("trabajador", "categoria")
    def __str__(self):
        return f"{self.trabajador} - {self.categoria}"