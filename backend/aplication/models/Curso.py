

from django.db import models
from .Trabajador import Trabajador
from .CategoriaCurso import CategoriaCurso
import uuid
from django.conf import settings

class Curso(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trabajador = models.ForeignKey(
        Trabajador,
        related_name="cursos",
        on_delete=models.CASCADE
    )
    categoria = models.ForeignKey(
        CategoriaCurso,
        related_name="cursos",
        on_delete=models.CASCADE
    )
    estado = models.CharField(max_length=2)
    fecha_vigencia = models.DateField(null=True, blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,   
        on_delete=models.PROTECT,
        related_name="cursos",
        null=True,
        blank=True
    )

    class Meta:
        unique_together = ("trabajador", "categoria")
