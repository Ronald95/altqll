
import uuid
from django.db import models
from .MatriculaTrabajador import MatriculaTrabajador
from django.conf import settings



class MatriculaImagen(models.Model):
    matricula = models.ForeignKey(
        MatriculaTrabajador,
        related_name="imagenes",
        on_delete=models.CASCADE
    )

    imagen = models.ImageField(
        upload_to="matriculas/imagenes/"
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
        related_name="imagenes_matriculas"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return self.tipo
    class Meta:
        verbose_name = "Imagen de matrícula"
        verbose_name_plural = "Imágenes de matrículas"
