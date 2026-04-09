import asyncio
from socket import timeout
import aiohttp
import json
import os
import re
import random
from django.http import JsonResponse
from playwright.async_api import async_playwright
from aplication.services.session.cookie_manager import save_cookies, get_cookies


# ───────────────────────────
# URLs y credenciales Marimsys
# ───────────────────────────
MS_LOGIN_URL = "https://websat.marimsys.cl/Autentificacion/logIn"
MS_HOME_URL  = "https://websat.marimsys.cl/Home/Inicio?Tecnologia=VMS"
MS_API_URL   = "https://websat.marimsys.cl/Inf/Posiciones/PUBMarkersUltimasPosicionesV2"
MS_USER = "altamar"
MS_PASS = "naves"

MS_COOKIES = "ms_cookies.json"

# ───────────────────────────
# URLs y credenciales Cunlogan
# ───────────────────────────
CL_LOGIN_URL = "https://www.cunlogantrack.net/index.php"
CL_API_URL   = "https://www.cunlogantrack.net/controller/location.php"
CL_USER = "altamar"
CL_PASS = "alttrack"
CL_COOKIES = "cl_cookies.json"

# ───────────────────────────
# User Agents
# ───────────────────────────
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_3) AppleWebKit/537.36 Chrome/121.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
]

def get_random_ua():
    return random.choice(USER_AGENTS)


# ───────────────────────────
# LOGIN ASYNC MARIMSYS
# ───────────────────────────
async def login_marimsys(): 
    cookies = get_cookies(MS_COOKIES)
    
    if cookies: 
        print("tiene cookies")
        # Si las cookies existen, devolvemos también el UA guardado si lo tienes, 
        # o usamos uno fijo para evitar discrepancias.
        return cookies
    
    async with async_playwright() as p: 
        # Usamos un User-Agent fijo para que coincida siempre con las peticiones aiohttp
        user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        browser = await p.chromium.launch(headless=False) 
        context = await browser.new_context(user_agent=user_agent) 
        page = await context.new_page() 
        
        await page.goto(MS_LOGIN_URL) 
        await page.fill('input[name="Usuario"]', MS_USER) 
        await page.fill('input[name="Password"]', MS_PASS) 
        await page.click('button[type="submit"]') 
        
        # Esperar a que la URL cambie al Home para asegurar sesión activa
        await page.wait_for_url("**/Home/Inicio**", timeout=60000)
        await page.wait_for_load_state("networkidle")
        
        cookies = await context.cookies()
        await browser.close() 
        
        save_cookies(cookies, MS_COOKIES)
        return cookies

# ───────────────────────────
# OBTENER POSICIONES MARIMSYS (Corregido)
# ───────────────────────────
from yarl import URL 
async def obtener_posiciones_marimsys(cookies, retry=True): 
    print(f"DEBUG: [Marimsys] Iniciando función con {len(cookies) if cookies else 0} cookies")
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
            print(f"⚠️ Error al inyectar cookie {c.get('name')}: {e}")
        
    timeout = aiohttp.ClientTimeout(total=20)
    print("DEBUG: [Marimsys] Jar preparado. Intentando abrir sesión...")
    
    # Verificamos si el Jar realmente tiene las cookies cargadas
    print(f"DEBUG: [Marimsys] Cookies en el Jar: {[ck.key for ck in jar]}")

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
            print(f"📡 [Marimsys] Enviando POST a {MS_API_URL}...")
            async with session.post(MS_API_URL, json=payload, timeout=15) as resp:
                text = await resp.text()
                status = resp.status
                
                print(f"📊 [Marimsys] Status Code: {status}")
                print(f"📄 [Marimsys] Primeros 200 caracteres de respuesta: {text[:200]}")

                # Caso 1: Sesión expirada o redirección al login
                if status != 200 or "login" in text.lower() or "autentificacion" in text.lower():
                    print("⚠️ [Marimsys] Sesión inválida detectada (HTML de login recibido).")
                    if retry:
                        print("🔄 [Marimsys] Borrando cookies locales e intentando relogin...")
                        if os.path.exists(MS_COOKIES): os.remove(MS_COOKIES)
                        new_cookies = await login_marimsys() 
                        return await obtener_posiciones_marimsys(new_cookies, retry=False) 
                    return []

                # Caso 2: Respuesta vacía pero válida
                if not text.strip():
                    print("⚠️ [Marimsys] El servidor respondió con un texto vacío.")
                    return []

                try:
                    data = json.loads(text)
                    print(f"✅ [Marimsys] JSON cargado. Elementos recibidos: {len(data) if isinstance(data, list) else 'No es lista'}")
                except json.JSONDecodeError:
                    print("❌ [Marimsys] Error crítico: La respuesta no es un JSON válido.")
                    return []

                # Procesamiento (Parsing)
                resultado = []
                for b in data:
                    # Print para ver si hay barcos que no están en estado "Activado"
                    if b.get("estado") != "Activado":
                        # Descomenta esto si quieres ver barcos inactivos
                        # print(f"ℹ️ [Marimsys] Saltando {b.get('nombre')} por estado: {b.get('estado')}")
                        continue

                    lat_lng = b.get("latLng", [None, None])
                    info_html = b.get("data", "")
                    
                    vel = re.search(r"Velocidad \(Mn/H\):\s*([\d.]+)", info_html)
                    rum = re.search(r"Rumbo:\s*(\d+)", info_html)
                    fec = re.search(r"Fecha:\s*([\d/]+ [\d:]+)", info_html)

                    resultado.append({ 
                        "id": b.get("id"), 
                        "nombre": "Bza Corcovado II" if b.get("id") == "1486" else b.get("nombre"), 
                        "lat": lat_lng[0], "lon": lat_lng[1], 
                        "velocidad": float(vel.group(1)) if vel else 0, 
                        "rumbo": int(rum.group(1)) if rum else 0, 
                        "fecha_hora": fec.group(1) if fec else "", 
                        "fuente": "Marimsys" 
                    })
                
                print(f"🏁 [Marimsys] Procesamiento finalizado. Barcos válidos: {len(resultado)}")
                return resultado

        except Exception as e:
            print(f"❌ [Marimsys] Excepción durante la petición: {type(e).__name__}: {e}")
            return []

# ───────────────────────────
# OBTENER REPORTES MARIMSYS (Corregido)
# ───────────────────────────
async def obtener_reportes_marimsys(cookies, id_movil, fecha_inicio, fecha_fin, retry=True):
    if not cookies: return []

    jar = aiohttp.CookieJar(unsafe=True)
    for c in cookies:
        jar.update_cookies({c["name"]: c["value"]}, response_url=MS_API_URL)

    # El endpoint de reporte suele ser DISTINTO al de posiciones actuales
    # Asegúrate de que MS_API_REPORTE_URL sea:
    # https://websat.marimsys.cl/Inf/Posiciones/PUBMarkersUltimasPosicionesV2 (o el que corresponda a historial)
    
    # Formateo correcto: Marimsys espera DD/MM/YYYY HH:mm
    f_ini = datetime.strptime(fecha_inicio, "%Y-%m-%d").strftime("%d/%m/%Y 00:00")
    f_fin = datetime.strptime(fecha_fin, "%Y-%m-%d").strftime("%d/%m/%Y 23:59")

    payload = {
        "tecnologia": "VMS",
        "idMovil": str(id_movil),
        "fechaDesde": f_ini,
        "fechaHasta": f_fin,
        "calDis": True
    }

    async with aiohttp.ClientSession(cookie_jar=jar) as session:
        # Agregamos los mismos headers que en posiciones
        session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Content-Type": "application/json"
        })
        
        async with session.post(MS_API_URL, json=payload) as resp:
            text = await resp.text()
            if "login" in text.lower() and retry:
                if os.path.exists(MS_COOKIES): os.remove(MS_COOKIES)
                new_cookies = await login_marimsys()
                return await obtener_reportes_marimsys(new_cookies, id_movil, fecha_inicio, fecha_fin, False)
            
            try:
                raw_data = json.loads(text)
                # A veces el reporte viene en una lista directa o dentro de .data
                lista = raw_data.get("data", []) if isinstance(raw_data, dict) else raw_data
                # Reutilizamos la lógica de mapeo (puedes extraerla a una función aparte)
                return lista 
            except:
                return []
# ───────────────────────────
# LOGIN ASYNC CUNLOGAN
# ───────────────────────────
async def login_cunlogan(force_login=False):
    cookies = None
    if not force_login:
        cookies = get_cookies(CL_COOKIES)
        if cookies:
            try:
                test_data = await obtener_posiciones_cunlogan(cookies)
                if test_data:
                    return cookies
            except:
                print("⚠️ Cookies caducadas, forzando login")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(user_agent=get_random_ua())
        page = await context.new_page()
        await page.goto(CL_LOGIN_URL)
        await page.fill('input[name="user_temp"]', CL_USER)
        await page.fill('input[name="pass_temp"]', CL_PASS)
        await page.keyboard.press("Enter")
        await page.wait_for_url("**/cunlogan.php", timeout=60000)
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(2000)
        cookies = await context.cookies()
        save_cookies(cookies, CL_COOKIES)
        await browser.close()
        return cookies

# ───────────────────────────
# UTIL COORDS DMS → DECIMAL
# ───────────────────────────
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

# ───────────────────────────
# OBTENER POSICIONES CUNLOGAN
# ───────────────────────────
async def obtener_posiciones_cunlogan(cookies, retry=True):
    jar = aiohttp.CookieJar(unsafe=True)
    if cookies:
        for c in cookies:
            jar.update_cookies({c["name"]: c["value"]})

    payload = {"action": "tabladatos", "search": "simple", "period": "0"}

    async with aiohttp.ClientSession(cookie_jar=jar) as session:
        async with session.post(CL_API_URL, data=payload) as resp:
            text = await resp.text()
            if not text or "login" in text.lower() or "html" in text.lower():
                if retry:
                    if os.path.exists(CL_COOKIES):
                        os.remove(CL_COOKIES)
                    new_cookies = await login_cunlogan()
                    return await obtener_posiciones_cunlogan(new_cookies, retry=False)
                else:
                    return []
            try:
                data = json.loads(text)
            except:
                return []

    if not data or "location" not in data:
        return []

    excluir_ids = {"3549", "6710", "3097"}
    resultado = []

    for b in data.get("location", []):
        if not b:
            continue
        id_movil = str(b.get("id_movil"))
        if id_movil in excluir_ids:
            continue
        lat = dms_to_decimal(b.get("latitude", ""))
        lon = dms_to_decimal(b.get("longitude", ""))
        try:
            speed = float(str(b.get("speed", "0")).replace("kt", "").strip())
        except:
            speed = 0
        try:
            rumbo = float(b.get("heading", 0))
        except:
            rumbo = 0
        resultado.append({
            "id": id_movil,
            "nombre": b.get("name"),
            "lat": lat,
            "lon": lon,
            "velocidad": speed,
            "rumbo": rumbo,
            "fecha_hora": b.get("loc_date"),
            "puerto": b.get("port", ""),
            "delay_horas": float(b.get("location_hours_delay", 0)),
            "fuente": "Cunlogan"
        })
    return resultado

# ───────────────────────────
# OBTENER REPORTES MARIMSYS
# ───────────────────────────
async def obtener_reportes_marimsys(
    cookies,
    tecnologia="VMS",
    id_movil=1486,
    fecha_inicio=None,
    fecha_fin=None,
    calDis=True,
    retry=True
):
    """
    Obtiene reportes históricos con la misma lógica de reintento de Cunlogan.
    """
    jar = aiohttp.CookieJar(unsafe=True)
    if cookies:
        for c in cookies:
            jar.update_cookies({c["name"]: c["value"]})

    # Formateo de fechas para Marimsys (DD/MM/YYYY HH:mm)
    def format_ms_date(date_str, is_end=False):
        try:
            # Si viene YYYY-MM-DD lo pasamos a formato Marimsys
            dt = datetime.strptime(date_str, "%Y-%m-%d")
            suffix = " 23:59" if is_end else " 00:00"
            return dt.strftime("%d/%m/%Y") + suffix
        except:
            return date_str

    payload = {
        "tecnologia": tecnologia,
        "idMovil": str(id_movil) if id_movil else "",
        "fechaDesde": format_ms_date(fecha_inicio) if fecha_inicio else "",
        "fechaHasta": format_ms_date(fecha_fin, True) if fecha_fin else "",
        "calDis": calDis
    }

    print("Payload:", payload)
    async with aiohttp.ClientSession(cookie_jar=jar) as session:
        try:
            async with session.post(MS_API_URL, json=payload, timeout=30) as resp:
                text = await resp.text()
                
                # Detectar sesión expirada (Igual que en Cunlogan)
                if resp.status == 401 or "login" in text.lower() or "autentificacion" in text.lower():
                    if retry:
                        print("🔄 [Marimsys Report] Sesión caducada, reintentando login...")
                        new_cookies = await login_marimsys()
                        return await obtener_reportes_marimsys(
                            new_cookies, tecnologia, id_movil, fecha_inicio, fecha_fin, retry=False
                        )
                    return []

                data = json.loads(text)
                print("Data:", data)
                # Si Marimsys devuelve un dict con 'data', lo extraemos
                if isinstance(data, dict):
                    data = data.get("data", []) or data.get("location", [])

        except Exception as e:
            print(f"❌ Error en request Marimsys: {e}")
            return []

    # Procesamiento de datos (Parsing similar al de Cunlogan)
    resultado = []
    for b in data:
        try:
            latLng = b.get("latLng", [None, None])
            info_html = b.get("data", "")
            
            # Extraer info del HTML interno
            match_vel = re.search(r"Velocidad \(Mn/H\):\s*([\d.]+)", info_html)
            match_rumbo = re.search(r"Rumbo:\s*(\d+)", info_html)
            match_fecha = re.search(r"Fecha:\s*([\d/]+ [\d:]+)", info_html)

            resultado.append({
                "id": b.get("id"),
                "nombre": b.get("nombre") or f"Movil {b.get('id')}",
                "lat": latLng[0],
                "lon": latLng[1],
                "velocidad": float(match_vel.group(1)) if match_vel else 0,
                "rumbo": int(match_rumbo.group(1)) if match_rumbo else 0,
                "fecha_hora": match_fecha.group(1) if match_fecha else "",
                "fuente": "Marimsys"
            })
        except:
            continue

    return resultado

# ───────────────────────────
# VISTA REPORTE MARIMSYS
# ───────────────────────────
from datetime import datetime
async def reporte_marimsys_simplificado_view(request):
    """
    Endpoint para obtener reporte simplificado de navegación de Marimsys
    
    Parámetros GET:
        mobs: ID de la embarcación (ej: 1486)
        fecha_inicio: Fecha inicio (YYYY-MM-DD)
        fecha_fin: Fecha fin (YYYY-MM-DD)
    
    Ejemplo:
        /api/marimsys/reporte-simplificado/?mobs=1486&fecha_inicio=2026-03-01&fecha_fin=2026-03-07
    """
    print("\n🚀 Request Marimsys - Reporte Simplificado")

    try:
        # 1. Obtener parámetros de la request
        mobs = request.GET.get("mobs")
        fecha_inicio = request.GET.get("fecha_inicio")
        fecha_fin = request.GET.get("fecha_fin")
        
        print(f"📋 Parámetros Marimsys - mobs: {mobs}, inicio: {fecha_inicio}, fin: {fecha_fin}")
        
        # 2. Validar fechas (Formato YYYY-MM-DD)
        for nombre, valor in [("fecha_inicio", fecha_inicio), ("fecha_fin", fecha_fin)]:
            if valor:
                try:
                    datetime.strptime(valor, "%Y-%m-%d")
                except ValueError:
                    return JsonResponse({
                        "success": False,
                        "error": f"Formato de {nombre} inválido. Use YYYY-MM-DD"
                    }, status=400)

        # 3. Cargar cookies de Marimsys (Desde Supabase o Login)
        cookies = await cargar_cookies_marimsys()

        # 4. Obtener reporte usando la lógica asíncrona robusta
        # Esta función ya maneja internamente el relogin y el parsing de Marimsys
        resultado_data = await obtener_reportes_marimsys(
            cookies=cookies,
            id_movil=mobs,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin
        )

        # 5. Retornar respuesta exitosa
        return JsonResponse({
            "success": True,
            "count": len(resultado_data),
            "data": resultado_data
        })

    except Exception as e:
        print("❌ ERROR MARIMSYS VIEW:", str(e))
        import traceback
        traceback.print_exc()
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=500)


# ───────────────────────────
# VIEW UNIFICADA
# ───────────────────────────
async def posiciones_flota_view(request):
    try:
        print("\n🚀 NUEVA REQUEST FLOTA")

        ms_cookies, cl_cookies = await asyncio.gather(
            login_marimsys(),
            login_cunlogan(),
            return_exceptions=True
        )

        if isinstance(ms_cookies, Exception):
            print("❌ [Marimsys] Login falló:", ms_cookies)
            ms_cookies = None
        if isinstance(cl_cookies, Exception):
            print("❌ [Cunlogan] Login falló:", cl_cookies)
            cl_cookies = None

        ms_data, cl_data = await asyncio.gather(
            obtener_posiciones_marimsys(ms_cookies) if ms_cookies else asyncio.sleep(0, result=[]),
            obtener_posiciones_cunlogan(cl_cookies) if cl_cookies else asyncio.sleep(0, result=[]),
            return_exceptions=True
        )

        # AGREGA ESTO PARA DEBUG:
        if isinstance(ms_data, Exception):
            print(f"🚨 EXCEPCIÓN REAL EN MARIMSYS: {type(ms_data).__name__}: {ms_data}")
            import traceback
            # Esto te dirá la línea exacta donde muere
            traceback.print_tb(ms_data.__traceback__)
            ms_data = []

        if isinstance(ms_data, Exception):
            ms_data = []
        if isinstance(cl_data, Exception):
            cl_data = []

        todas_posiciones = ms_data + cl_data
        todas_posiciones = [
            d for d in todas_posiciones
            if d.get("lat") is not None and d.get("lon") is not None
        ]

        return JsonResponse({
            "success": True,
            "data": todas_posiciones
        })

    except Exception as e:
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=500)