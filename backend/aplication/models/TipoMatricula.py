import uuid
from django.db import models
from django.conf import settings

class TipoMatricula(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(
        max_length=150,
        null=False,
        blank=False,
        default='',
        verbose_name='Tipo matricula',
        help_text='Ingrese el tipo de matricula')
    descripcion = models.CharField(
        max_length=150,
        null=True,
        blank=True,
        default='',
        verbose_name='Descripcion del tipo de matricula',
        help_text='Ingrese descripcion del tipo de matricula')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,   
        on_delete=models.PROTECT,
        related_name="tipos_matriculas"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return self.nombre
    class Meta:
        verbose_name = "Tipo de matricula"
        verbose_name_plural = "Tipos de matriculas"
