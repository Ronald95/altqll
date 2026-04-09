# crypto_utils.py
from cryptography.fernet import Fernet
import json

SECRET_KEY = b"tu_clave_32_bytes_base64=="  # genera con Fernet.generate_key()

def encrypt_cookies(cookies):
    f = Fernet(SECRET_KEY)
    data = json.dumps(cookies).encode()
    return f.encrypt(data)

def decrypt_cookies(encrypted_data):
    f = Fernet(SECRET_KEY)
    return json.loads(f.decrypt(encrypted_data))