from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from datetime import date
import uuid
from .Naves import Naves
from .CategoriaPirotecnia import CategoriaPirotecnia
from django.conf import settings


class PirotecniaNave(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cantidad = models.IntegerField(
        null=False,
        blank=False,
        validators=[
            MinValueValidator(1, message='El cantidad debe ser mayor que %(limit_value)s.'),
            MaxValueValidator(20, message='La cantidad debe ser menor o igual a 20.')
        ],
        verbose_name='Cantidad de bengala',
        help_text='Ingrese la cantidad de bengala')
    fecha_vigencia = models.DateField(
       blank=False,
            null=False,
        validators=[
                MinValueValidator(limit_value=date.today().replace(year=date.today().year - 3), message='La fecha de vencimiento no puede ser anterior a 3 años de la fecha actual'),
                MaxValueValidator(limit_value=date.today().replace(year=date.today().year + 10), message='La fecha de vencimiento no puede ser posterior a 10 años a partir de la fecha actual.')
            ],
        verbose_name='Fecha expiracion',
        help_text='Ingrese la fecha de expiracion de la bengala',
        )
    observacion = models.CharField(
        max_length=150,
        null=True,
        blank=True,
        default='',
        verbose_name='Observacion de la bengala',
        help_text='Ingrese observacion de la bengala')
    categoria = models.ForeignKey(CategoriaPirotecnia, on_delete=models.PROTECT)
    nave = models.ForeignKey(Naves, on_delete=models.CASCADE, related_name="pirotecnias")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,   
        on_delete=models.PROTECT,
        related_name="pirotecnias",
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return f"{self.fecha_vigencia.strftime('%d-%m-%Y')} - {self.cantidad} de {self.categoria.nombre} - {self.nave.nombre}"

