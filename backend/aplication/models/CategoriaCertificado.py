

from django.db import models
import uuid
from django.conf import settings


class CategoriaCertificado(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    codigo = models.CharField(max_length=10)
    nombre = models.CharField(max_length=255)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,   
        on_delete=models.PROTECT,
        related_name="categorias_certificado",
        null=True,
        blank=True
    )
    class Meta:
        unique_together = ("codigo", "nombre")
    def __str__(self):
        return self.nombre