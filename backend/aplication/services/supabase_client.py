# supabase_client.py
import os
from supabase import create_client
from django.conf import settings

SUPABASE_URL = getattr(settings, "SUPABASE_URL")
SUPABASE_KEY = getattr(settings, "SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("⚠️ SUPABASE_URL o SUPABASE_KEY no están configuradas en settings.py")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
BUCKET_NAME = "pdfs"


def upload_to_supabase(file_path, custom_filename=None, bucket_name=BUCKET_NAME):
    """
    Sube un archivo binario a Supabase Storage y devuelve URL pública.
    """
    if custom_filename:
        filename = custom_filename
    else:
        filename = os.path.basename(file_path)

    # Leer archivo en modo binario
    with open(file_path, "rb") as f:
        data = f.read()

    try:
        # Intentar subir el archivo
        response = supabase.storage.from_(bucket_name).upload(
            filename,
            data,
            {
                "content-type": "application/pdf",
                "cache-control": "3600",
                "upsert": "true"
            }
        )
        print(f"✅ Archivo subido: {filename}")
        
    except Exception as e:
        print(f"❌ Error subiendo archivo: {e}")
        raise Exception(f"Error subiendo archivo a Supabase: {e}")

    # Obtener URL pública
    file_url = supabase.storage.from_(bucket_name).get_public_url(filename)
    
    return file_url