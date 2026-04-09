from django.http import JsonResponse
from aplication.services.tracking_service import obtener_posiciones_marimsys, obtener_posiciones_cunlogan
from aplication.services.auth_scraping.cunlogan import login_cunlogan
from aplication.services.auth_scraping.marimsys import login_marimsys
import asyncio

async def posat_naves(request):
    """
    Vista asíncrona que consolida posiciones de naves desde Marimsys y Cunlogan.
    """
    try:
        print("\n🚀POSAT")
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