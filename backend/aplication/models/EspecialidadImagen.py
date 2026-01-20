
import uuid
from django.db import models
from .Especialidad import Especialidad
from django.conf import settings
import uuid


class EspecialidadImagen(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    especialidad = models.ForeignKey(
        Especialidad,
        related_name="imagenes_especialidad",
        on_delete=models.CASCADE
    )

    imagen = models.ImageField(
        upload_to="especialidades/imagenes/"
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
        related_name="imagenes_especialidad",
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return self.tipo
    class Meta:
        verbose_name = "Imagen de especialidad"
        verbose_name_plural = "Imágenes de especialidades"
