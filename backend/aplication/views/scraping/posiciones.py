from django.http import JsonResponse
from aplication.services.tracking_service import (
    obtener_posiciones_marimsys,
    obtener_posiciones_cunlogan
)
from aplication.services.auth_scraping.cunlogan import login_cunlogan
from aplication.services.auth_scraping.marimsys import login_marimsys
import asyncio
import logging

# Logger
logger = logging.getLogger(__name__)


async def posat_naves(request):
    """
    Vista asíncrona que consolida posiciones de naves desde Marimsys y Cunlogan.
    """
    try:
        logger.info("🚀 POSAT iniciado")

        # 🔐 LOGIN
        ms_cookies, cl_cookies = await asyncio.gather(
            login_marimsys(),
            login_cunlogan(),
            return_exceptions=True
        )

        # Validación cookies Marimsys
        if isinstance(ms_cookies, Exception):
            logger.error(f"❌ [Marimsys] Login falló: {ms_cookies}")
            logger.exception("Detalle excepción Marimsys", exc_info=ms_cookies)
            ms_cookies = None
        else:
            logger.info("✅ [Marimsys] Cookies obtenidas")

        # Validación cookies Cunlogan
        if isinstance(cl_cookies, Exception):
            logger.error(f"❌ [Cunlogan] Login falló: {cl_cookies}")
            logger.exception("Detalle excepción Cunlogan", exc_info=cl_cookies)
            cl_cookies = None
        else:
            logger.info("✅ [Cunlogan] Cookies obtenidas")

        # 📡 OBTENER DATOS
        ms_data, cl_data = await asyncio.gather(
            obtener_posiciones_marimsys(ms_cookies) if ms_cookies else asyncio.sleep(0, result=[]),
            obtener_posiciones_cunlogan(cl_cookies) if cl_cookies else asyncio.sleep(0, result=[]),
            return_exceptions=True
        )

        # 🔍 Debug Marimsys
        if isinstance(ms_data, Exception):
            logger.error(f"🚨 Error en Marimsys: {type(ms_data).__name__}: {ms_data}")
            logger.exception("Traceback Marimsys", exc_info=ms_data)
            ms_data = []
        else:
            logger.info(f"📍 Marimsys retornó {len(ms_data)} registros")

        # 🔍 Debug Cunlogan
        if isinstance(cl_data, Exception):
            logger.error(f"🚨 Error en Cunlogan: {type(cl_data).__name__}: {cl_data}")
            logger.exception("Traceback Cunlogan", exc_info=cl_data)
            cl_data = []
        else:
            logger.info(f"📍 Cunlogan retornó {len(cl_data)} registros")

        # 🔗 Unificar datos
        todas_posiciones = ms_data + cl_data

        # 🧹 Filtrar datos inválidos
        todas_posiciones = [
            d for d in todas_posiciones
            if d.get("lat") is not None and d.get("lon") is not None
        ]

        logger.info(f"✅ Total posiciones válidas: {len(todas_posiciones)}")

        return JsonResponse({
            "success": True,
            "data": todas_posiciones
        })

    except Exception as e:
        logger.exception(f"🔥 Error crítico en posat_naves: {e}")
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=500)