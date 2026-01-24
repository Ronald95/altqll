from django.db import models
from django.conf import settings

class ProcessedPDF(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,   
        on_delete=models.PROTECT,
        related_name="processed_pdfs",
        null=True,
        blank=True
    )

    original_name = models.CharField(max_length=255)
    output_name = models.CharField(max_length=255)

    file_size = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        help_text="Peso del archivo en bytes"
    )
    file_path = models.TextField(
        help_text="Ruta o URL donde quedó almacenado el archivo"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.output_name}"
