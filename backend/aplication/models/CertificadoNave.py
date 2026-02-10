from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator, FileExtensionValidator
from datetime import date
import uuid
from .Naves import Naves
from .CategoriaCertificadoNave import CategoriaCertificadoNave
from django.conf import settings

class CertificadoNave(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    fecha_emision = models.DateField(
        blank=True,
        null=True,
        validators=[
                MinValueValidator(limit_value=date.today().replace(year=date.today().year - 1), message='La fecha de vencimiento no puede ser anterior a 1 año de la fecha actual'),
            ],
        verbose_name='Fecha emision',
        help_text='Ingrese la fecha de emision')
    fecha_vigencia = models.DateField(
        blank=True,
        null=True,
        validators=[
                MinValueValidator(limit_value=date.today().replace(year=date.today().year - 1), message='La fecha de vencimiento no puede ser anterior a 1 año de la fecha actual'),
            ],
        verbose_name='Fecha expiracion',
        help_text='Ingrese la fecha de vencimiento')
    observacion = models.CharField(
        max_length=150,
        null=True,
        blank=True,
        default='',
        verbose_name='Observacion',
        help_text='Ingrese alguna observacion al certificado')
    archivo = models.FileField(
        upload_to='archivos/',
        blank=True,
        null=True,
        validators=[
            FileExtensionValidator(allowed_extensions=['pdf', 'png', 'jpg'])  # Permitir solo archivos PDF, PNG y JPG
        ])
    nave = models.ForeignKey(Naves, on_delete=models.CASCADE, related_name="certificados")
    categoria = models.ForeignKey(CategoriaCertificadoNave, on_delete=models.PROTECT)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,   
        on_delete=models.PROTECT,
        related_name="certificados_naves",
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        verbose_name = "Certificado de la nave"
        verbose_name_plural = "Certificados de las naves"
    def __str__(self):
        fecha_emision_str = self.fecha_emision.strftime("%d-%m-%Y") if self.fecha_emision else ""
        fecha_vigencia_str = self.fecha_vigencia.strftime("%d-%m-%Y") if self.fecha_vigencia else ""
        return f"{fecha_emision_str} - {fecha_vigencia_str} - {self.categoria.nombre} - {self.nave.nombre}"