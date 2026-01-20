from django.db import models
from .Trabajador import Trabajador
from .CategoriaCertificado import CategoriaCertificado
import uuid
from django.conf import settings

class Certificado(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trabajador = models.ForeignKey(
        Trabajador,
        related_name="certificados",
        on_delete=models.CASCADE
    )
    categoria = models.ForeignKey(
        CategoriaCertificado,
        related_name="certificados",
        on_delete=models.CASCADE
    )
    fecha_vigencia = models.DateField(null=True, blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,   
        on_delete=models.PROTECT,
        related_name="certificados",
        null=True,
        blank=True
    )
    class Meta:
        unique_together = ("trabajador", "categoria")