import uuid
from django.db import models
from django.conf import settings
from aplication.models import Naves, CategoriaEstudioNave

class EstudioNave(models.Model):
    """
    Estudio asociado a una embarcación (por ejemplo, un manual o estudio).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nave = models.ForeignKey(Naves, on_delete=models.CASCADE, related_name="estudios")
    categoria = models.ForeignKey(CategoriaEstudioNave, on_delete=models.PROTECT, related_name="estudios")
    fecha_aprobacion = models.DateField(null=True, blank=True)
    observacion = models.TextField(blank=True, null=True)
    archivo_pdf = models.FileField(upload_to="documentos/", blank=True, null=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,   
        on_delete=models.PROTECT,
        related_name="estudios_naves",
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        verbose_name = "Estudio de nave"
        verbose_name_plural = "Estudios de naves"
    def __str__(self):
        return f"{self.categoria.nombre} - {self.nave.nombre}"