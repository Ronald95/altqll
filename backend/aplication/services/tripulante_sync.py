import requests
from datetime import datetime
from django.db import transaction
from aplication.models import (
    Trabajador,
    Certificado,
    Curso,
    Especialidad,
    CategoriaCertificado,
    CategoriaCurso,
    CategoriaEspecialidad
)


def as_list(value):
    """Convierte un objeto en lista, maneja dicts, listas y None o string vacío"""
    if not value or value == "":
        return []
    if isinstance(value, list):
        return value
    return [value]


def safe_get_dict(value):
    """Devuelve un dict si value es dict, sino un dict vacío"""
    if isinstance(value, dict):
        return value
    return {}


def safe_get_string(value):
    """Devuelve string limpio o None si es vacío, None o dict @nil"""
    if not value:
        return None
    if isinstance(value, dict) and value.get("@nil") == "true":
        return None
    if isinstance(value, str):
        return value.strip() or None
    return str(value)


def safe_parse_date(value):
    """Convierte string ISO a date o devuelve None"""
    if not value or not isinstance(value, str):
        return None
    try:
        return datetime.fromisoformat(value).date()
    except Exception:
        return None


def clean_rut(rut):
    """Quita puntos y guion de un RUT"""
    rut_str = safe_get_string(rut)
    if not rut_str:
        return None
    return rut_str.replace(".", "").replace("-", "").strip()


def parse_nombre_completo(nombre_completo):
    """Convierte "APELLIDOS, NOMBRES" -> "NOMBRES APELLIDOS"""
    if not nombre_completo or "," not in nombre_completo:
        return {
            "nombres": "",
            "apellidos": safe_get_string(nombre_completo),
            "nombre_formateado": safe_get_string(nombre_completo)
        }
    apellidos, nombres = nombre_completo.split(",", 1)
    return {
        "nombres": nombres.strip(),
        "apellidos": apellidos.strip(),
        "nombre_formateado": f"{nombres.strip()} {apellidos.strip()}"
    }


def sync_tripulante_por_rut(rut, token, user=None):
    """Sincroniza un tripulante desde la API externa y guarda en la base de datos."""
    API_URL = "https://orion.directemar.cl/endPointCtr/index.php/embarqueDesembarque/buscarDatosTripulante"
    rut_limpio = clean_rut(rut)
    if not rut_limpio:
        print(f"❌ RUT inválido: {rut}")
        return None

    try:
        response = requests.post(
            API_URL,
            json={"rut": rut_limpio},
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            timeout=15
        )
        data = response.json()
    except Exception as e:
        print(f"❌ Error con {rut_limpio}: {e}")
        return None

    t = safe_get_dict(data.get("tripulantes")).get("tripulante")
    if not t:
        print(f"❌ Tripulante no encontrado: {rut_limpio}")
        return None

    parsed = parse_nombre_completo(safe_get_string(t.get("nombre")))

    with transaction.atomic():
        # --------------------
        # Trabajador
        # --------------------
        try:
            trabajador_values = {
                "nombre": parsed["nombre_formateado"],
                "fecha_nacimiento": safe_parse_date(t.get("fechaNacimiento")),
                "telefono": safe_get_string(t.get("numeroContacto")),
                "correo": safe_get_string(t.get("mailTripulante"))
            }
            trabajador, _ = Trabajador.objects.update_or_create(
                rut=rut_limpio,
                defaults=trabajador_values
            )
        except Exception as e:
            print(f"❌ Error creando trabajador {rut_limpio}: {e}")
            return None

        # --------------------
        # Certificados
        # --------------------
        certificados_data = safe_get_dict(t.get("certificados"))
        codigos_certificados = set()
        for c in as_list(certificados_data.get("certificado")):
            if not isinstance(c, dict):
                continue
            codigo = safe_get_string(c.get("codigo"))
            if not codigo or codigo in codigos_certificados:
                continue
            codigos_certificados.add(codigo)

            categoria, _ = CategoriaCertificado.objects.get_or_create(
                codigo=codigo,
                defaults={"nombre": safe_get_string(c.get("nombre")), "user": user}
            )
            Certificado.objects.update_or_create(
                trabajador=trabajador,
                categoria=categoria,
                defaults={
                    "fecha_vigencia": safe_parse_date(c.get("fechaVigencia")),
                    "user": user
                }
            )

        # --------------------
        # Cursos
        # --------------------
        cursos_data = safe_get_dict(t.get("cursos"))
        codigos_cursos = set()
        for c in as_list(cursos_data.get("curso")):
            if not isinstance(c, dict):
                continue
            codigo = safe_get_string(c.get("cdcodigocurso"))
            if not codigo or codigo in codigos_cursos:
                continue
            codigos_cursos.add(codigo)

            categoria, _ = CategoriaCurso.objects.get_or_create(
                codigo=codigo,
                defaults={"nombre": safe_get_string(c.get("nombreCurso")), "user": user}
            )
            Curso.objects.update_or_create(
                trabajador=trabajador,
                categoria=categoria,
                defaults={
                    "estado": safe_get_string(c.get("estadoCurso")),
                    "fecha_vigencia": safe_parse_date(c.get("fechaVigenciaCurso")),
                    "user": user
                }
            )

        # --------------------
        # Especialidades
        # --------------------
        especialidades_data = safe_get_dict(t.get("especialidades"))
        codigos_especialidades = set()
        for e in as_list(especialidades_data.get("especialidad")):
            if not isinstance(e, dict):
                continue
            codigo = safe_get_string(e.get("codigo"))
            if not codigo or codigo in codigos_especialidades:
                continue
            codigos_especialidades.add(codigo)

            categoria, _ = CategoriaEspecialidad.objects.get_or_create(
                codigo=codigo,
                defaults={"nombre": safe_get_string(e.get("nombre")), "user": user}
            )
            Especialidad.objects.update_or_create(
                trabajador=trabajador,
                categoria=categoria,
                defaults={
                    "fecha_vigencia": safe_parse_date(e.get("fechaVigencia")),
                    "user": user
                }
            )

    print(f"✅ Tripulante procesado: {rut_limpio}")
    return trabajador
