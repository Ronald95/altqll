from rest_framework import serializers
from aplication.models import ProcessedPDF

class PDFUploadSerializer(serializers.Serializer):
    archivo = serializers.FileField()

    def validate_archivo(self, value):
        if value.content_type not in ["application/pdf"]:
            raise serializers.ValidationError("El archivo debe ser un PDF.")
        return value

class ProcessedPDFSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcessedPDF
        fields = ["id", "original_name", "output_name", "file_path", "file_size", "created_at"]
