import uuid
from django.db import models
from django.conf import settings

class CategoriaNave(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(
        max_length=150,
        null=False,
        blank=False,
        default='',
        verbose_name='Categoria de nave',
        help_text='Ingrese la categoria de nave')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,   
        on_delete=models.PROTECT,
        related_name="categorias_naves",
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return self.nombre
    class Meta:
        verbose_name = "Categoria de nave"
        verbose_name_plural = "Categorias de naves"
