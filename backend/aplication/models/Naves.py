
from django.db import models
import uuid

from .CategoriaNave import CategoriaNave
from django.core.validators import MinValueValidator, MaxValueValidator
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
from django.conf import settings

class Naves(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(
        max_length=150,
        null=False,
        blank=False,
        unique=True,
        default='',
        verbose_name='Nombre',
        help_text='Ingrese el nombre')
    sllamada = models.CharField(
        max_length=17,
        null=False,
        blank=False,
        unique=True,
        verbose_name='Señal de llamada',
        help_text='Ingrese la señal de llamada')
    matricula = models.CharField(
        max_length=17,
        null=False,
        blank=False,
        unique=True,
        verbose_name='Matricula',
        help_text='Ingrese la matricula')
    eslora = models.FloatField(
        null=False,
        blank=False,
        verbose_name='Eslora',
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        help_text='Ingrese la eslora')
    manga = models.FloatField(
        null=False,
        blank=False,
        verbose_name='Manga',
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        help_text='Ingrese la manga')
    puntal = models.FloatField(
        null=False,
        blank=False,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        verbose_name='Puntal',
        help_text='Ingrese el puntal')
    trg = models.FloatField(
        null=False,
        blank=False,
        validators=[MinValueValidator(1), MaxValueValidator(1000)],
        verbose_name='Trg',
        help_text='Ingrese el trg')
    tminima = models.IntegerField(
        null=False,
        blank=False,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        verbose_name='Dotacion minima',
        help_text='Ingrese la dotacion minima')
    tmaxima = models.IntegerField(
        null=False,
        blank=False,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        verbose_name='Cap. max de personas',
        help_text='Ingrese la capacidad maxima de personas')
    pasajeros = models.IntegerField(
        null=False,
        blank=False,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        verbose_name='Cap. de pasajeros',
        help_text='Ingrese la capacidad de pasajeros')
    actividad = models.CharField(
        max_length=150,
        null=False,
        blank=False,
        verbose_name='Actividad de la nave',
        help_text='Ingrese la actividad de la nave.',
        error_messages={
        'required': 'El campo %(field_label)s es obligatorio y no puede contener solo espacios en blanco.'})
    imagen = models.ImageField(upload_to='archivos/', height_field=None, blank=True, null=True, width_field=None, max_length=100)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,   
        on_delete=models.PROTECT,
        related_name="naves",
        null=True,
        blank=True
    )
    categoria = models.ForeignKey(CategoriaNave, on_delete=models.PROTECT,related_name="naves")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        verbose_name = "Nave"
        verbose_name_plural = "Naves"

    def save(self, *args, **kwargs):
        # Si hay imagen, comprimirla antes de guardar
        if self.imagen:
            self.imagen.seek(0)  # Asegurar el inicio

            img = Image.open(self.imagen)

            # Convertir PNG, RGBA → JPG
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            # Redimensionar si es muy grande
            max_size = (1200, 1200)
            img.thumbnail(max_size)

            # Comprimir
            output = BytesIO()
            img.save(output, format="JPEG", quality=60, optimize=True)

            output.seek(0)
            # Reemplazar archivo por la versión comprimida
            self.imagen = ContentFile(output.read(), f"{self.imagen.name}.jpg")

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nombre} - {self.id}"