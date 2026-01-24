from django.contrib import admin
from aplication.models import ProcessedPDF

# Register your models here.
@admin.register(ProcessedPDF)
class ProcessedPDFAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "original_name",
        "output_name",
        "file_size",
        "file_path",
        "created_at",
    )
    list_filter = ("created_at", "user")
    search_fields = ("original_name", "output_name", "user__username")
    ordering = ("-created_at",)