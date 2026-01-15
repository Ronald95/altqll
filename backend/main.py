import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

try:
    connection = psycopg2.connect(
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_DATABASE"),
        sslmode='require'  # importante para Supabase
    )
    cursor = connection.cursor()
    cursor.execute("SELECT NOW();")
    print("Current Time:", cursor.fetchone())
    cursor.close()
    connection.close()
except Exception as e:
    print("Error:", e)
