# tracking_service.py
import asyncio
import os
import re
import json
import aiohttp
from aplication.utils.dms_to_decimal import dms_to_decimal
from aplication.services.auth_scraping.cunlogan import login_cunlogan
from aplication.services.auth_scraping.marimsys import login_marimsys
from yarl import URL 
from datetime import timedelta
from datetime import datetime
from aplication.utils.haversine_km import haversine_km
import logging


# Logger
logger = logging.getLogger(__name__)

# Constantes de URLs y cookies
MS_HOME_URL  = "https://websat.marimsys.cl/Home/Inicio?Tecnologia=VMS"
MS_API_URL   = "https://websat.marimsys.cl/Inf/Posiciones/PUBMarkersUltimasPosicionesV2"
MS_COOKIES = "ms_cookies.json"

CL_API_URL   = "https://www.cunlogantrack.net/controller/location.php"
CL_COOKIES = "cl_cookies.json"

# ──────────────────────────────
# Marimsys
# ──────────────────────────────
async def obtener_posiciones_marimsys(cookies, retry=True): 
    logger.info(f"DEBUG: [Marimsys] Iniciando función con {len(cookies) if cookies else 0} cookies")
    if not cookies:
        return []
    
    # 1. Configurar el Jar de forma estricta para el dominio
    jar = aiohttp.CookieJar(unsafe=True)
    target_url = URL(MS_API_URL)
    for c in cookies:
        try:
            # Ahora pasamos el objeto URL, no el string
            jar.update_cookies({c["name"]: c["value"]}, response_url=target_url)
        except Exception as e:
            logger.warning(f"⚠️ Error al inyectar cookie {c.get('name')}: {e}")
        
    timeout = aiohttp.ClientTimeout(total=20)
    logger.info("DEBUG: [Marimsys] Jar preparado. Intentando abrir sesión...")
    
    # Verificamos si el Jar realmente tiene las cookies cargadas
    logger.info(f"DEBUG: [Marimsys] Cookies en el Jar: {[ck.key for ck in jar]}")

    headers = { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "es-ES,es;q=0.9",
        "Content-Type": "application/json; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest", 
        "Origin": "https://websat.marimsys.cl",
        "Referer": MS_HOME_URL, 
        "Connection": "keep-alive"
    } 
    
    payload = { 
        "id": "", "filtro": "", "tecnologia": "ALL", 
        "medir": True, "filtrarSinPosicion": True 
    }
    
    async with aiohttp.ClientSession(cookie_jar=jar, headers=headers) as session:
        try:
            logger.info(f"📡 [Marimsys] Enviando POST a {MS_API_URL}...")
            async with session.post(MS_API_URL, json=payload, timeout=15) as resp:
                text = await resp.text()
                status = resp.status
                
                logger.info(f"📊 [Marimsys] Status Code: {status}")
                logger.info(f"📄 [Marimsys] Primeros 200 caracteres de respuesta: {text[:200]}")

                # Caso 1: Sesión expirada o redirección al login
                if status != 200 or "login" in text.lower() or "autentificacion" in text.lower():
                    logger.warning("⚠️ [Marimsys] Sesión inválida detectada (HTML de login recibido).")
                    if retry:
                        logger.info("🔄 [Marimsys] Borrando cookies locales e intentando relogin...")
                        if os.path.exists(MS_COOKIES): os.remove(MS_COOKIES)
                        new_cookies = await login_marimsys() 
                        return await obtener_posiciones_marimsys(new_cookies, retry=False) 
                    return []

                # Caso 2: Respuesta vacía pero válida
                if not text.strip():
                    logger.warning("⚠️ [Marimsys] El servidor respondió con un texto vacío.")
                    return []

                try:
                    data = json.loads(text)
                    logger.info(f"✅ [Marimsys] JSON cargado. Elementos recibidos: {len(data) if isinstance(data, list) else 'No es lista'}")
                except json.JSONDecodeError:
                    logger.error("❌ [Marimsys] Error crítico: La respuesta no es un JSON válido.")
                    return []

                # Procesamiento (Parsing)
                resultado = []
                for b in data:                    
                    if b.get("estado") != "Activado":
                        continue

                    lat_lng = b.get("latLng", [None, None])
                    info_html = b.get("data", "")
                    
                    vel = re.search(r"Velocidad \(Mn/H\):\s*([\d.]+)", info_html)
                    rum = re.search(r"Rumbo:\s*(\d+)", info_html)
                    fec = re.search(r"Fecha:\s*([\d/]+ [\d:]+)", info_html)

                    resultado.append({ 
                        "id": b.get("id"), 
                        "nombre": "Corcovado II" if b.get("id") == "1486" else b.get("nombre"), 
                        "lat": lat_lng[0], "lon": lat_lng[1], 
                        "velocidad": float(vel.group(1)) if vel else 0, 
                        "rumbo": int(rum.group(1)) if rum else 0, 
                        "fecha_hora": fec.group(1) if fec else "", 
                        "fuente": "Marimsys" 
                    })
                
                logger.info(f"🏁 [Marimsys] Procesamiento finalizado. Barcos válidos: {len(resultado)}")
                return resultado

        except Exception as e:
            logger.error(f"❌ [Marimsys] Excepción durante la petición: {type(e).__name__}: {e}")
            return []



async def obtener_reporte_horas_marimsys(id_movil=None, fecha_inicio=None, fecha_fin=None):
    try:
        cookies = await login_marimsys()

        jar = aiohttp.CookieJar(unsafe=True)
        for c in cookies:
            jar.update_cookies({c["name"]: c["value"]})

        # 🔥 Parseo de fechas
        start_date = datetime.strptime(fecha_inicio, "%Y-%m-%d")
        start_date = start_date.replace(hour=0, minute=0, second=0)

        end_date = datetime.strptime(fecha_fin, "%Y-%m-%d")
        end_date = end_date.replace(hour=23, minute=59, second=59)

        logger.info(f"📅 Marimsys desde {start_date} hasta {end_date}")

        # 🔥 Formato requerido por Marimsys
        fecha_desde = start_date.strftime("%d/%m/%Y %H:%M")
        fecha_hasta = end_date.strftime("%d/%m/%Y %H:%M")

        params = {
            "tecnologia": "VMS",
            "idMovil": id_movil,
            "fechaDesde": fecha_desde,
            "fechaHasta": fecha_hasta,
            "calDis": "true"
        }

        url = "https://websat.marimsys.cl/Inf/Posiciones/ListarPosiciones"

        async with aiohttp.ClientSession(cookie_jar=jar) as session:
            async with session.get(url, params=params) as resp:
                if resp.status != 200:
                    logger.error(f"❌ Error HTTP {resp.status}")
                    return {"success": False, "error": f"HTTP {resp.status}"}

                data = await resp.json(content_type=None)

        logger.info(f"📡 Marimsys registros crudos: {len(data)}")

        # 🔥 Normalizar al formato Cunlogan
        posiciones = []

        for b in data:
            try:
                fecha_obj = datetime.strptime(
                    b.get("FechaReporte"), "%Y-%m-%dT%H:%M:%SZ"
                )
            except:
                fecha_obj = None

            posiciones.append({
                "id": b.get("IDReporte"),
                "id_movil": b.get("IDMovil"),
                "nombre": b.get("DescripcionMovil"),
                "lat": b.get("Latitud"),
                "lon": b.get("Longitud"),
                "velocidad": float(b.get("Velocidad", 0)),
                "rumbo": float(b.get("Rumbo", 0)),
                "fecha_hora": b.get("FechaReporte"),
                "fecha_obj": fecha_obj,
                "puerto": None,
                "delay_horas": float(b.get("LatenciaTotalMin", 0)) / 60.0,
            })

        # 🔥 Ordenar igual que Cunlogan
        posiciones.sort(key=lambda x: x.get("fecha_obj") or datetime.min)

        logger.info(f"📡 Marimsys limpio: {len(posiciones)} posiciones")

        # 🔥 Reutilizar tu lógica existente (clave 🔥)
        reporte = calcular_reporte_simplificado(
            posiciones,
            velocidad_minima=1.0,
            fecha_inicio=start_date.date(),
            fecha_fin=end_date.date()
        )

        # 🔥 Metadatos iguales
        reporte["periodo"] = {
            "inicio": start_date.strftime("%Y-%m-%d"),
            "fin": end_date.strftime("%Y-%m-%d"),
            "dias_totales": (end_date - start_date).days + 1
        }

        reporte["id_movil"] = id_movil

        if posiciones:
            reporte["nombre_embarcacion"] = posiciones[0].get("nombre")

        return {
            "success": True,
            "data": reporte
        }

    except Exception as e:
        logger.error("❌ ERROR Marimsys:", str(e))
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }


async def fetch_chunk(session, semaphore, start, end, mobs):
    payload = {
        "sort": "loc_date",
        "dir": "ASC",  # 🔥 clave
        "action": "tabladatos",
        "search": "avanzada",
        "period": "0",
        "mobs": mobs,
        "start_r": start.strftime("%Y-%m-%dT%H:%M:%S"),
        "end_r": end.strftime("%Y-%m-%dT%H:%M:%S"),
        "points": "0",
        "layer": "yes",
    }

    async with semaphore:
        try:
            async with session.post(CL_API_URL, data=payload, timeout=aiohttp.ClientTimeout(total=30)) as r:
                if r.status != 200:
                    logger.warning(f"⚠️ HTTP {r.status} para {start} → {end}")
                    return []

                data = await r.json(content_type=None)
                return data.get("location", [])

        except Exception as e:
            logger.error(f"❌ Error chunk {start}: {e}")
            return []



# ──────────────────────────────
# Cunlogan
# ──────────────────────────────
async def obtener_posiciones_cunlogan(cookies, mobs=None, start_date=None, end_date=None):
    jar = aiohttp.CookieJar(unsafe=True)
    for c in cookies:
        jar.update_cookies({c["name"]: c["value"]})

    semaphore = asyncio.Semaphore(3)

    async with aiohttp.ClientSession(cookie_jar=jar) as session:
        tareas = []
        current = start_date

        # 🔥 dividir en bloques de 6 horas
        while current < end_date:
            chunk_end = min(current + timedelta(hours=6), end_date)
            tareas.append(fetch_chunk(session, semaphore, current, chunk_end, mobs))
            current = chunk_end

        resultados = await asyncio.gather(*tareas)

    # 🔥 unir resultados
    data_total = []
    for chunk in resultados:
        data_total.extend(chunk)

    logger.info(f"📡 Total registros crudos: {len(data_total)}")

    resultado = []

    for b in data_total:
        lat = dms_to_decimal(b.get("latitude", ""))
        lon = dms_to_decimal(b.get("longitude", ""))

        # velocidad
        speed_str = str(b.get("speed", "0")).replace("kt", "").strip()
        try:
            speed = float(speed_str)
        except:
            speed = 0.0

        # 🔥 parse robusto
        loc_date_str = b.get("loc_date", "")
        loc_date = None

        for fmt in [
            "%d/%m/%Y %H:%M:%S",
            "%d/%m/%Y %H:%M",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%dT%H:%M:%S",
        ]:
            try:
                loc_date = datetime.strptime(loc_date_str, fmt)
                break
            except:
                continue

        resultado.append({
            "id": b.get("id"),
            "id_movil": b.get("id_movil"),
            "nombre": b.get("name"),
            "lat": lat,
            "lon": lon,
            "velocidad": speed,
            "rumbo": float(b.get("heading", 0)),
            "fecha_hora": loc_date_str,
            "fecha_obj": loc_date,
            "puerto": b.get("port"),
            "delay_horas": float(b.get("location_hours_delay", 0)),
        })

    # 🔥 eliminar duplicados (muy importante)
    resultado_unico = {}
    for r in resultado:
        key = (r["lat"], r["lon"], r["fecha_hora"])
        resultado_unico[key] = r

    resultado = list(resultado_unico.values())

    # ordenar
    resultado.sort(key=lambda x: x.get("fecha_obj") or datetime.min)

    logger.info(f"📡 Cunlogan limpio: {len(resultado)} posiciones")

    # debug días reales
    fechas = [p["fecha_obj"] for p in resultado if p["fecha_obj"]]
    if fechas:
        logger.info(f"📅 Días reales: {sorted(set([f.date() for f in fechas]))}")

    return resultado

async def obtener_reporte_simplificado(mobs=None, fecha_inicio=None, fecha_fin=None):
    """
    Obtiene reporte simplificado de navegación
    Args:
        mobs: ID del móvil/embarcación (opcional)
        fecha_inicio: Fecha inicio (string "YYYY-MM-DD")
        fecha_fin: Fecha fin (string "YYYY-MM-DD")
    Returns:
        Diccionario con reporte simplificado
    """
    try:
        # Login y obtener cookies
        cookies = await login_cunlogan()
        # Parsear fechas
        start_date = None
        end_date = None
        if fecha_inicio:
            start_date = datetime.strptime(fecha_inicio, "%Y-%m-%d")
            start_date = start_date.replace(hour=0, minute=0, second=0)
            logger.info(f"📅 Fecha inicio parseada: {start_date}")
        if fecha_fin:
            end_date = datetime.strptime(fecha_fin, "%Y-%m-%d")
            end_date = end_date.replace(hour=23, minute=59, second=59)
            logger.info(f"📅 Fecha fin parseada: {end_date}")
        # Si no hay fechas, usar últimos 7 días
        if not start_date and not end_date:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=7)
            start_date = start_date.replace(hour=0, minute=0, second=0)
            logger.info(f"📅 Usando últimos 7 días: {start_date} hasta {end_date}")
        logger.info(f"📅 Buscando desde {start_date} hasta {end_date}")
        # Obtener posiciones
        posiciones = await obtener_posiciones_cunlogan(
            cookies=cookies,
            mobs=mobs,
            start_date=start_date,
            end_date=end_date
        )
        logger.info(f"📊 Total posiciones obtenidas: {len(posiciones)}")
        # Calcular reporte simplificado
        reporte = calcular_reporte_simplificado(
            posiciones,
            velocidad_minima=1.0,
            fecha_inicio=start_date.date(),
            fecha_fin=end_date.date()
        )
        logger.info(f"📊 Días con navegación en reporte: {len(reporte.get('dias', []))}")
        logger.info(f"⏱️ Total minutos navegados: {reporte.get('minutos_navegacion', 0)} ({reporte.get('horas_navegacion', 0)} horas)")
        # Agregar metadatos
        reporte["periodo"] = {
            "inicio": start_date.strftime("%Y-%m-%d"),
            "fin": end_date.strftime("%Y-%m-%d"),
            "dias_totales": (end_date - start_date).days + 1
        }
        if mobs:
            reporte["id_movil"] = mobs
        # Obtener nombre de la embarcación si hay posiciones
        if posiciones:
            reporte["nombre_embarcacion"] = posiciones[0].get("nombre")
        return {
            "success": True,
            "data": reporte
        }
    except Exception as e:
        logger.error("❌ ERROR en reporte simplificado:", str(e))
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }

def calcular_reporte_simplificado(posiciones, velocidad_minima=1.0, fecha_inicio=None, fecha_fin=None):
    """
    Reporte simplificado con tiempo real de navegación basado en distancia recorrida
    """
    if not posiciones:
        return {
            "total_posiciones": 0, 
            "posiciones_navegando": 0, 
            "dias": [], 
            "minutos_navegacion": 0,
            "horas_navegacion": 0,
            "distancia_km": 0,
            "millas_recorridas": 0
        }

    # Ordenar por fecha
    posiciones.sort(key=lambda x: x.get("fecha_obj") or datetime.min)

    reportes_por_dia = {}
    total_navegacion_minutos = 0

    for i, p in enumerate(posiciones):
        fecha_obj = p.get("fecha_obj")
        if not fecha_obj:
            continue

        dia = fecha_obj.date()

        if dia not in reportes_por_dia:
            reportes_por_dia[dia] = []

        # Inicializamos valores por defecto
        distancia_km = 0.0
        minutos_navegados = 0.0
        velocidad_navegacion_kt = 0.0

        # Si hay una posición anterior
        if i > 0:
            p_prev = posiciones[i - 1]
            fecha_prev = p_prev.get("fecha_obj")
            
            VEL_MIN = 0.5          # nudos (ajustable)
            DIST_MIN_KM = 0.05     # ~50 metros

            if fecha_prev:
                distancia_km = haversine_km(
                    p_prev.get("lat"), p_prev.get("lon"),
                    p.get("lat"), p.get("lon")
                )

                vel1 = p_prev.get("velocidad", 0)
                vel2 = p.get("velocidad", 0)

                # 🔥 Determinar si navegó y calcular velocidad efectiva
                if distancia_km >= DIST_MIN_KM:
                    # Caso 1: Partió durante el intervalo (velocidad inicial baja, final alta)
                    if vel1 < VEL_MIN and vel2 >= VEL_MIN:
                        velocidad_navegacion_kt = vel2
                    
                    # Caso 2: Se detuvo durante el intervalo (velocidad inicial alta, final baja)
                    elif vel1 >= VEL_MIN and vel2 < VEL_MIN:
                        velocidad_navegacion_kt = vel1
                    
                    # Caso 3: Navegó todo el intervalo (ambas velocidades altas)
                    elif vel1 >= VEL_MIN and vel2 >= VEL_MIN:
                        velocidad_navegacion_kt = (vel1 + vel2) / 2
                    
                    # Caso 4: Ambas velocidades bajas pero hubo movimiento significativo
                    else:
                        # Calcular velocidad real desde distancia/tiempo
                        delta_seconds = (fecha_obj - fecha_prev).total_seconds()
                        if delta_seconds > 0:
                            velocidad_kmh = (distancia_km / delta_seconds) * 3600
                            velocidad_navegacion_kt = velocidad_kmh / 1.852
                        else:
                            velocidad_navegacion_kt = 0

                    # 🔥 Calcular minutos navegados basado en distancia y velocidad
                    if velocidad_navegacion_kt >= VEL_MIN:
                        velocidad_kmh = velocidad_navegacion_kt * 1.852
                        tiempo_horas = distancia_km / velocidad_kmh
                        minutos_navegados = round(tiempo_horas * 60, 2)
                    else:
                        minutos_navegados = 0.0

        # Agregar al reporte solo si hay navegación > 0
        if minutos_navegados > 0:
            total_navegacion_minutos += minutos_navegados
            millas_nauticas = distancia_km * 0.539957
            reportes_por_dia[dia].append({
                "hora": fecha_obj.strftime("%H:%M:%S"),
                "velocidad": p.get("velocidad"),
                "rumbo": p.get("rumbo"),
                "lat": p.get("lat"),
                "lon": p.get("lon"),
                "puerto": p.get("puerto"),
                "distancia_km": distancia_km,
                "millas_nauticas_recorridas": round(millas_nauticas, 3),
                "minutos_navegados": minutos_navegados,
                "velocidad_navegacion_kt": round(velocidad_navegacion_kt, 2)
            })

    dias_completos = []
    current = fecha_inicio
    end = fecha_fin

    while current <= end:
        dias_completos.append(current)
        current += timedelta(days=1)

    # Crear lista de días ordenada
    dias = []
    for dia in dias_completos:
        reportes_dia = reportes_por_dia.get(dia, [])

        minutos_navegados_dia = sum(r["minutos_navegados"] for r in reportes_dia)
        horas_navegadas = round(minutos_navegados_dia / 60, 2)
        
        # 🔥 Calcular distancia total del día
        distancia_total_km = sum(r["distancia_km"] for r in reportes_dia)
        millas_recorridas = round(distancia_total_km * 0.539957, 2)  # km a millas náuticas

        if reportes_dia:
            velocidades = [r["velocidad"] for r in reportes_dia]
            velocidad_promedio = sum(velocidades) / len(velocidades)
            velocidad_maxima = max(velocidades)
            velocidad_minima_dia = min(velocidades)
        else:
            # 🔥 Día sin navegación
            velocidad_promedio = 0
            velocidad_maxima = 0
            velocidad_minima_dia = 0

        dias_semana_es = {
            "Monday": "Lunes",
            "Tuesday": "Martes",
            "Wednesday": "Miércoles",
            "Thursday": "Jueves",
            "Friday": "Viernes",
            "Saturday": "Sábado",
            "Sunday": "Domingo"
        }

        dias.append({
            "fecha": dia.strftime("%Y-%m-%d"),
            "fecha_display": dia.strftime("%d/%m/%Y"),
            "dia_semana": dias_semana_es.get(dia.strftime("%A"), dia.strftime("%A")),
            "total_reportes": len(reportes_dia),  # será 0 si no hay
            "minutos_navegados": round(minutos_navegados_dia, 2),  # 🔥 nuevo campo
            "horas_navegadas": horas_navegadas,
            "distancia_km": round(distancia_total_km, 2),  # 🔥 nuevo
            "millas_recorridas": millas_recorridas,  # 🔥 nuevo
            "velocidad_promedio": round(velocidad_promedio, 1),
            "velocidad_maxima": round(velocidad_maxima, 1),
            "velocidad_minima": round(velocidad_minima_dia, 1),
            "reportes": reportes_dia  # lista vacía si no hay
        })

    # 🔥 Calcular distancia total global
    distancia_total_km = sum(d["distancia_km"] for d in dias)
    millas_recorridas_total = round(distancia_total_km * 0.539957, 2)  # km a millas náuticas

    return {
        "total_posiciones": len(posiciones),
        "posiciones_navegando": sum(len(r["reportes"]) for r in dias),
        "minutos_navegacion": round(total_navegacion_minutos, 2),  # 🔥 nuevo campo global
        "horas_navegacion": round(total_navegacion_minutos / 60, 2),  # 🔥 adicional
        "distancia_km": round(distancia_total_km, 2),  # 🔥 nuevo
        "millas_recorridas": millas_recorridas_total,  # 🔥 nuevo
        "dias": dias
    }