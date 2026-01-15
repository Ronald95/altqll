from django.db import models
import uuid
from .Cargo import Cargo

class Trabajador(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
    ]
    rut = models.CharField("RUT", max_length=12, unique=True,blank=True, null=True)
    cargo = models.ManyToManyField(Cargo, related_name="trabajadores", blank=True)    
    nombre = models.CharField("Nombre completo", max_length=255)
    residencia = models.CharField("Lugar de residencia", max_length=255, blank=True, null=True)
    correo = models.EmailField("Correo electrónico", blank=True, null=True)
    telefono = models.CharField("Teléfono", max_length=20, blank=True, null=True)
    estado = models.CharField("Estado", max_length=10, choices=ESTADO_CHOICES, default='activo')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nombre} ({self.rut})"