
import uuid
from django.db import models
from .Certificado import Certificado
from django.conf import settings
import uuid


class CertificadoImagen(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    certificado = models.ForeignKey(
        Certificado,
        related_name="imagenes_certificado",
        on_delete=models.CASCADE
    )
    imagen = models.ImageField(
        upload_to="certificados/imagenes/"
    )
    tipo = models.CharField(
        max_length=30,
        choices=[
            ("frontal", "Frontal"),
            ("trasera", "Trasera"),
            ("extra", "Extra"),
        ]
    )
    orden = models.PositiveIntegerField(default=0)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,   
        on_delete=models.PROTECT,
        related_name="imagenes_certificado",
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return self.tipo
    class Meta:
        verbose_name = "Imagen de certificado"
        verbose_name_plural = "Imágenes de certificados"
