# app/views_cunlogan.py - Versión actualizada con cálculo basado en distancia

import asyncio
import aiohttp
import json
import os
import re
from datetime import datetime, timedelta
from django.http import JsonResponse
from playwright.async_api import async_playwright
from math import radians, sin, cos, sqrt, atan2
from aplication.cookies_supabase import guardar_cookies, leer_cookies


LOGIN_URL = "https://www.cunlogantrack.net/index.php"
API_URL   = "https://www.cunlogantrack.net/controller/location.php"

USER = "altamar"
PASS = "alttrack"

# ─────────────────────────────────────────────
# LOGIN
# ─────────────────────────────────────────────
async def login_cunlogan():
    cookies = leer_cookies("cl_cookies.json")
    if cookies:
        print("✅ Usando cookies Cunlogan desde Supabase")
        return cookies

    print("🔐 Login Cunlogan...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        await page.goto(LOGIN_URL)
        await page.fill('input[name="user_temp"]', USER)
        await page.fill('input[name="pass_temp"]', PASS)
        await page.keyboard.press("Enter")
        await page.wait_for_url("**/cunlogan.php", timeout=15000)

        cookies = await context.cookies()
        await browser.close()

        # Guardar en Supabase
        guardar_cookies(cookies)
        return cookies


# ─────────────────────────────────────────────
# CONVERTIR COORDENADAS (DMS → DECIMAL)
# ─────────────────────────────────────────────
def dms_to_decimal(coord):
    try:
        match = re.match(r"(\d+)º\s*(\d+)'[\s]*(\d+(?:\.\d+)?)''\s*([NSEO])", coord)
        if not match:
            return None

        grados, minutos, segundos, direccion = match.groups()
        decimal = float(grados) + float(minutos)/60 + float(segundos)/3600

        if direccion in ["S", "O"]:
            decimal *= -1

        return round(decimal, 6)
    except:
        return None

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
            async with session.post(API_URL, data=payload, timeout=aiohttp.ClientTimeout(total=30)) as r:
                if r.status != 200:
                    print(f"⚠️ HTTP {r.status} para {start} → {end}")
                    return []

                data = await r.json(content_type=None)
                return data.get("location", [])

        except Exception as e:
            print(f"❌ Error chunk {start}: {e}")
            return []


# ─────────────────────────────────────────────
# OBTENER POSICIONES
# ─────────────────────────────────────────────
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

    print(f"📡 Total registros crudos: {len(data_total)}")

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

    print(f"📡 Cunlogan limpio: {len(resultado)} posiciones")

    # debug días reales
    fechas = [p["fecha_obj"] for p in resultado if p["fecha_obj"]]
    if fechas:
        print("📅 Días reales:", sorted(set([f.date() for f in fechas])))

    return resultado



# ─────────────────────────────────────────────
# Haversine para calcular distancia entre dos coordenadas
# ─────────────────────────────────────────────
import math
def haversine_km(lat1, lon1, lat2, lon2):
    """
    Calcula distancia en km entre dos coordenadas
    """
    if None in [lat1, lon1, lat2, lon2]:
        return 0.0

    # Convertir a radianes
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    r = 6371  # radio Tierra km
    return round(c * r, 3)

# ─────────────────────────────────────────────
# REPORTE SIMPLIFICADO - BASADO EN DISTANCIA RECORRIDA
# ─────────────────────────────────────────────
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
            reportes_por_dia[dia].append({
                "hora": fecha_obj.strftime("%H:%M:%S"),
                "velocidad": p.get("velocidad"),
                "rumbo": p.get("rumbo"),
                "lat": p.get("lat"),
                "lon": p.get("lon"),
                "puerto": p.get("puerto"),
                "distancia_km": distancia_km,
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


# ─────────────────────────────────────────────
# VIEW DJANGO - POSICIONES ACTUALES
# ─────────────────────────────────────────────
async def posiciones_cunlogan_view(request):
    print("\n🚀 Request Cunlogan - Posiciones actuales")

    try:
        cookies = await login_cunlogan()
        data = await obtener_posiciones_cunlogan(cookies)

        # Filtrar solo recientes (< 24h)
        data_filtrada = [
            d for d in data if d["delay_horas"] <= 24
        ]

        return JsonResponse({
            "success": True,
            "data": data_filtrada
        })

    except Exception as e:
        print("❌ ERROR:", str(e))
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=500)

# OBTENER REPORTE SIMPLIFICADO
# ─────────────────────────────────────────────

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
            print(f"📅 Fecha inicio parseada: {start_date}")
        if fecha_fin:
            end_date = datetime.strptime(fecha_fin, "%Y-%m-%d")
            end_date = end_date.replace(hour=23, minute=59, second=59)
            print(f"📅 Fecha fin parseada: {end_date}")
        # Si no hay fechas, usar últimos 7 días
        if not start_date and not end_date:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=7)
            start_date = start_date.replace(hour=0, minute=0, second=0)
            print(f"📅 Usando últimos 7 días: {start_date} hasta {end_date}")
        print(f"📅 Buscando desde {start_date} hasta {end_date}")
        # Obtener posiciones
        posiciones = await obtener_posiciones_cunlogan(
            cookies=cookies,
            mobs=mobs,
            start_date=start_date,
            end_date=end_date
        )
        print(f"📊 Total posiciones obtenidas: {len(posiciones)}")
        # Calcular reporte simplificado
        reporte = calcular_reporte_simplificado(
            posiciones,
            velocidad_minima=1.0,
            fecha_inicio=start_date.date(),
            fecha_fin=end_date.date()
        )
        print(f"📊 Días con navegación en reporte: {len(reporte.get('dias', []))}")
        print(f"⏱️ Total minutos navegados: {reporte.get('minutos_navegacion', 0)} ({reporte.get('horas_navegacion', 0)} horas)")
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
        print("❌ ERROR en reporte simplificado:", str(e))
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }




# ─────────────────────────────────────────────
# VIEW DJANGO - REPORTE SIMPLIFICADO
# ─────────────────────────────────────────────
async def reporte_horas_navegadas_view(request):
    """
    Endpoint para obtener reporte simplificado de navegación
    
    Parámetros GET:
        mobs: ID de la embarcación (opcional)
        fecha_inicio: Fecha inicio (YYYY-MM-DD)
        fecha_fin: Fecha fin (YYYY-MM-DD)
    
    Ejemplo:
        /api/cunlogan/reporte-simplificado/?mobs=2809&fecha_inicio=2026-03-01&fecha_fin=2026-03-07
    """
    print("\n🚀 Request Cunlogan - Reporte Simplificado")

    try:
        # Obtener parámetros de la request
        mobs = request.GET.get("mobs")
        fecha_inicio = request.GET.get("fecha_inicio")
        fecha_fin = request.GET.get("fecha_fin")
        
        print(f"📋 Parámetros - mobs: {mobs}, inicio: {fecha_inicio}, fin: {fecha_fin}")
        
        # Validar fechas
        if fecha_inicio:
            try:
                datetime.strptime(fecha_inicio, "%Y-%m-%d")
            except ValueError:
                return JsonResponse({
                    "success": False,
                    "error": "Formato de fecha_inicio inválido. Use YYYY-MM-DD"
                }, status=400)
        
        if fecha_fin:
            try:
                datetime.strptime(fecha_fin, "%Y-%m-%d")
            except ValueError:
                return JsonResponse({
                    "success": False,
                    "error": "Formato de fecha_fin inválido. Use YYYY-MM-DD"
                }, status=400)
        
        # Obtener reporte simplificado
        resultado = await obtener_reporte_simplificado(
            mobs=mobs,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin
        )
        
        return JsonResponse(resultado)

    except Exception as e:
        print("❌ ERROR:", str(e))
        import traceback
        traceback.print_exc()
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=500)