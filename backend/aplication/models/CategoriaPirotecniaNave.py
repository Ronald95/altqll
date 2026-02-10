import uuid
from django.db import models
from django.contrib.auth.models import User


class CategoriaPirotecniaNave(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(
        max_length=150,
        null=False,
        blank=False,
        default='',
        verbose_name='Categoria de bengala',
        help_text='Ingrese la categoria de bengala (por ejemplo: Bengala de fuego, Bengala de humo)')
    descripcion = models.CharField(
        max_length=150,
        null=True,
        blank=True,
        default='',
        verbose_name='Descripcion de la categoria de bengala',
        help_text='Ingrese descripcion de la categoria de bengala')
    user = models.ForeignKey(User, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return self.nombre