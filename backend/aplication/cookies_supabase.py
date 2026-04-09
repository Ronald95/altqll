# cookies_supabase.py
import json
from aplication.services.supabase_client import supabase, fernet, BUCKET_COOKIES

def guardar_cookies(cookies, filename="cookies.json"):
    """
    Guarda cookies en Supabase cifradas.
    """
    try:
        # convertir a JSON y cifrar
        json_bytes = json.dumps(cookies).encode("utf-8")
        encrypted = fernet.encrypt(json_bytes)
        
        supabase.storage.from_(BUCKET_COOKIES).upload(
            filename,
            encrypted,
            {
                "content-type": "application/octet-stream",
                "cache-control": "3600",
                "upsert": "true"
            }
        )
        print(f"✅ Cookies guardadas en Supabase: {filename}")
    except Exception as e:
        print(f"❌ Error guardando cookies: {e}")

def leer_cookies(filename="cookies.json"):
    """
    Lee cookies desde Supabase y las descifra.
    """
    try:
        resp = supabase.storage.from_(BUCKET_COOKIES).download(filename)
        if not resp:
            return None
        decrypted = fernet.decrypt(resp)
        cookies = json.loads(decrypted)
        print(f"✅ Cookies cargadas y desencriptadas: {filename}")
        return cookies
    except Exception as e:
        print(f"⚠️ Cookies no encontradas o error: {e}")
        return None
