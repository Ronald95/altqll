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
MS_HOME_URL = "https://websat.marimsys.cl/Home/Inicio?Tecnologia=VMS"
MS_API_URL = "https://websat.marimsys.cl/Inf/Posiciones/PUBMarkersUltimasPosicionesV2"
MS_USER = "altamar"
MS_PASS = ""

MS_COOKIES = "ms_cookies.json"

# ───────────────────────────
# URLs y credenciales Cunlogan
# ───────────────────────────
CL_LOGIN_URL = "https://www.cunlogantrack.net/index.php"
CL_API_URL = "https://www.cunlogantrack.net/controller/location.php"
CL_USER = "altamar"
CL_PASS = ""
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
    print(f"🔍 Cookies existentes encontradas: {len(cookies) if cookies else 0}")
    
    if cookies: 
        print("✅ Usando cookies guardadas")
        # Mostrar detalles de las cookies
        for c in cookies:
            print(f"   🍪 {c.get('name')}: {c.get('value')[:20]}... (domain: {c.get('domain')})")
        return cookies
    
    print("🌐 Iniciando login con Playwright...")
    async with async_playwright() as p: 
        browser = await p.chromium.launch(headless=True) 
        context = await browser.new_context() 
        page = await context.new_page() 
        
        print(f"📍 Navegando a: {MS_LOGIN_URL}")
        await page.goto(MS_LOGIN_URL) 
        
        print("📝 Llenando formulario de login...")
        await page.fill('input[name="Usuario"]', MS_USER) 
        await page.fill('input[name="Password"]', MS_PASS) 
        
        print("🔘 Haciendo click en submit...")
        await page.click('button[type="submit"]') 
        await page.wait_for_load_state("networkidle")
        
        print(f"🏠 Navegando a home: {MS_HOME_URL}")
        await page.goto(MS_HOME_URL) 
        
        cookies = await context.cookies()
        print(f"🍪 Cookies obtenidas después del login: {len(cookies)}")
        for c in cookies:
            print(f"   🍪 {c.get('name')}: {c.get('value')[:20]}... (domain: {c.get('domain')})")
        
        await browser.close() 
        save_cookies(cookies, MS_COOKIES)
        print(f"💾 Cookies guardadas en: {MS_COOKIES}")
        
        return cookies

# ───────────────────────────
# OBTENER POSICIONES MARIMSYS
# ───────────────────────────
async def obtener_posiciones_marimsys(cookies, retry=True): 
    print(f"\n{'='*50}")
    print(f"🚢 OBTENER POSICIONES MARIMSYS")
    print(f"{'='*50}")
    print(f"🍪 Cookies recibidas: {len(cookies) if cookies else 0}")
    
    # Verificar que las cookies tengan el formato correcto
    if cookies:
        print("📋 Detalles de cookies:")
        for c in cookies:
            print(f"   - name: {c.get('name')}, domain: {c.get('domain')}, path: {c.get('path')}")
    
    jar = aiohttp.CookieJar(unsafe=True)
    
    # Verificar el dominio de la API
    from urllib.parse import urlparse
    api_domain = urlparse(MS_API_URL).netloc
    print(f"🌐 Dominio de la API: {api_domain}")
    
    if cookies:
        for c in cookies:
            # Asegurarse de que las cookies tengan el dominio correcto
            cookie_dict = {c["name"]: c["value"]}
            
            # Crear SimpleCookie para aiohttp
            from http.cookies import SimpleCookie
            simple_cookie = SimpleCookie()
            simple_cookie[c["name"]] = c["value"]
            
            # Agregar la cookie con el dominio correcto
            jar.update_cookies(cookie_dict, response_url=MS_API_URL)
            
        print(f"✅ CookieJar actualizado con {len(cookies)} cookies")
    
    headers = { 
        "X-Requested-With": "XMLHttpRequest", 
        "Referer": MS_HOME_URL, 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", 
        "Content-Type": "application/json",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "es-ES,es;q=0.9",
        "Origin": MS_HOME_URL.rsplit('/', 1)[0]  # Obtener el origen base
    } 
    
    payload = { 
        "id": "", 
        "filtro": "", 
        "tecnologia": "ALL", 
        "medir": True, 
        "filtrarSinPosicion": True 
    }
    
    print(f"📡 URL de API: {MS_API_URL}")
    print(f"📦 Payload: {payload}")
    print(f"📋 Headers enviados:")
    for key, value in headers.items():
        print(f"   {key}: {value}")
    
    async with aiohttp.ClientSession(cookie_jar=jar, headers=headers) as session:
        # Verificar las cookies que se van a enviar
        print("\n🍪 Cookies en el jar antes del request:")
        for cookie in jar:
            print(f"   {cookie.key}={cookie.value[:20]}... (domain: {cookie['domain']})")
        
        print("\n🔄 Haciendo POST request...")
        async with session.post(MS_API_URL, json=payload) as resp:
            print(f"📊 Status Code: {resp.status}")
            print(f"📋 Response Headers: {dict(resp.headers)}")
            
            # Verificar si hay Set-Cookie en la respuesta
            if 'Set-Cookie' in resp.headers:
                print(f"🍪 Server envió Set-Cookie: {resp.headers['Set-Cookie']}")
            
            text = await resp.text()
            print(f"📄 Response length: {len(text)} caracteres")
            print(f"📄 Respuesta completa:\n{text}")
            
            if "login" in text.lower() or ("html" in text.lower() and len(text) > 100): 
                print("⚠️ Respuesta contiene 'login' o 'html' - sesión expirada")
                if retry:
                    if os.path.exists(MS_COOKIES): 
                        os.remove(MS_COOKIES)
                        print(f"🗑️ Archivo de cookies eliminado: {MS_COOKIES}")
                    print("🔄 Haciendo relogin...")
                    new_cookies = await login_marimsys() 
                    return await obtener_posiciones_marimsys(new_cookies, retry=False) 
                else: 
                    raise Exception("Sesión Marimsys expirada después de relogin")
            
            try:
                data = json.loads(text)
                print(f"✅ JSON parseado correctamente")
                print(f"📊 Cantidad de elementos en respuesta: {len(data) if isinstance(data, list) else 'No es lista'}")
                
                # Si el array está vacío, forzar relogin
                if isinstance(data, list) and len(data) == 0 and retry:
                    print("⚠️ Respuesta vacía - posible sesión expirada. Forzando relogin...")
                    if os.path.exists(MS_COOKIES):
                        os.remove(MS_COOKIES)
                    new_cookies = await login_marimsys()
                    return await obtener_posiciones_marimsys(new_cookies, retry=False)
                    
            except json.JSONDecodeError as e:
                print(f"❌ Error al parsear JSON: {e}")
                print(f"📄 Respuesta completa:\n{text}")
                raise
    
    resultado = []
    elementos_activados = 0
    
    for i, b in enumerate(data):
        estado = b.get("estado")
        if estado == "Activado":
            elementos_activados += 1
            
            if b.get("id") == "1486": 
                b["nombre"] = "Bza Corcovado II"
                print(f"🔄 Renombrado ID 1486 a 'Bza Corcovado II'")
            
            lat, lon = b.get("latLng", [None, None]) 
            info_html = b.get("data", "")
            
            print(f"\n--- Barco {i+1} ---")
            print(f"  ID: {b.get('id')}")
            print(f"  Nombre: {b.get('nombre')}")
            print(f"  Lat/Lon: {lat}, {lon}")
            
            match_rumbo = re.search(r"Rumbo:\s*(\d+)", info_html) 
            rumbo = int(match_rumbo.group(1)) if match_rumbo else 0
            
            match_vel = re.search(r"Velocidad \(Mn/H\):\s*([\d.]+)", info_html) 
            velocidad = float(match_vel.group(1)) if match_vel else 0
            
            match_fecha = re.search(r"Fecha:\s*([\d/]+ [\d:]+)", info_html) 
            fecha_hora = match_fecha.group(1) if match_fecha else ""
            
            print(f"  Velocidad: {velocidad}")
            print(f"  Rumbo: {rumbo}")
            print(f"  Fecha/Hora: {fecha_hora}")
            
            resultado.append({ 
                "id": b.get("id"), 
                "nombre": b.get("nombre"), 
                "lat": lat, 
                "lon": lon, 
                "velocidad": velocidad, 
                "rumbo": rumbo, 
                "fecha_hora": fecha_hora, 
                "fuente": "Marimsys" 
            })
    
    print(f"\n{'='*50}")
    print(f"📊 RESUMEN:")
    print(f"  Total elementos en data: {len(data)}")
    print(f"  Elementos con estado 'Activado': {elementos_activados}")
    print(f"  Barcos agregados al resultado: {len(resultado)}")
    print(f"{'='*50}\n")
    
    return resultado
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
