# cookies_supabase.py
import os
import json
from aplication.services.supabase_client import supabase, BUCKET_COOKIES, fernet
import logging


# Logger
logger = logging.getLogger(__name__)
COOKIES_BUCKET = BUCKET_COOKIES

def save_cookies(cookies, filename="cookies.json"):
    """
    Guarda cookies en Supabase Storage como JSON cifrado.
    :param cookies: lista de dicts de cookies
    :param filename: nombre del archivo en el bucket
    :return: URL pública del archivo
    """
    try:
        # convertir a JSON bytes
        data_bytes = json.dumps(cookies).encode("utf-8")
        # cifrar
        data_encrypted = fernet.encrypt(data_bytes)
        
        # subir a Supabase
        supabase.storage.from_(COOKIES_BUCKET).upload(
            filename,
            data_encrypted,
            {
                "content-type": "application/octet-stream",  # binario cifrado
                "cache-control": "3600",
                "upsert": "true"
            }
        )
        
        logger.info(f"✅ Cookies cifradas guardadas en Supabase: {filename}")
        
        # devolver URL pública
        url = supabase.storage.from_(COOKIES_BUCKET).get_public_url(filename)
        return url

    except Exception as e:
        logger.error(f"❌ Error guardando cookies: {e}")
        return None


def get_cookies(filename="cookies.json"):
    """
    Lee cookies cifradas desde Supabase Storage y las desencripta.
    :param filename: nombre del archivo en el bucket
    :return: lista de cookies o None si no existe
    """
    try:
        # descargar contenido
        resp = supabase.storage.from_(COOKIES_BUCKET).download(filename)
        if resp is None:
            logger.warning(f"⚠️ Cookies no encontradas: {filename}")
            return None

        # desencriptar
        data_bytes = fernet.decrypt(resp)
        cookies = json.loads(data_bytes)
        logger.info(f"✅ Cookies cargadas y desencriptadas: {filename}")
        return cookies

    except Exception as e:
        logger.error(f"❌ Error leyendo/desencriptando cookies: {e}")
        return None