import uuid
from django.db import models
from django.conf import settings



class CategoriaCertificadoNave(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(
        max_length=150,
        null=False,
        blank=False,
        default='',
        verbose_name='Categoria de certificado',
        help_text='Ingrese la categoria de certificado')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,   
        on_delete=models.PROTECT,
        related_name="categorias_certificados",
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return self.nombre