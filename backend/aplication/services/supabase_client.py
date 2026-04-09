# supabase_client.py
import os
from supabase import create_client
from django.conf import settings
from cryptography.fernet import Fernet

SUPABASE_URL = getattr(settings, "SUPABASE_URL")
SUPABASE_KEY = getattr(settings, "SUPABASE_KEY")
SUPABASE_BUCKET = os.environ.get("SUPABASE_BUCKET", "cookies")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("⚠️ SUPABASE_URL o SUPABASE_KEY no están configuradas en settings.py")

# Clave secreta para cifrar cookies
SECRET_KEY = os.environ.get("COOKIE_SECRET_KEY")  # debe generarse con Fernet.generate_key()
if not SECRET_KEY:
    raise Exception("❌ COOKIE_SECRET_KEY no configurada en variables de entorno")

fernet = Fernet(SECRET_KEY.encode())
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


# BUCKETS
BUCKET_PDFS = "pdfs"
BUCKET_COOKIES = "cookies"


def upload_to_supabase(file_path, custom_filename=None, bucket_name=BUCKET_PDFS, content_type="application/pdf"):
    """
    Sube un archivo binario a Supabase Storage y devuelve URL pública.
    
    :param file_path: ruta local del archivo
    :param custom_filename: nombre del archivo en Supabase
    :param bucket_name: bucket donde guardar
    :param content_type: tipo de contenido (por defecto PDF)
    """
    filename = custom_filename or os.path.basename(file_path)

    # Leer archivo en modo binario
    with open(file_path, "rb") as f:
        data = f.read()

    try:
        supabase.storage.from_(bucket_name).upload(
            filename,
            data,
            {
                "content-type": content_type,
                "cache-control": "3600",
                "upsert": "true"
            }
        )
        print(f"✅ Archivo subido: {filename} en bucket {bucket_name}")
        
    except Exception as e:
        print(f"❌ Error subiendo archivo: {e}")
        raise Exception(f"Error subiendo archivo a Supabase: {e}")

    # Obtener URL pública
    file_url = supabase.storage.from_(bucket_name).get_public_url(filename)
    return file_url