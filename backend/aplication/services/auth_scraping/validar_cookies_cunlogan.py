import aiohttp
import logging


# Logger
logger = logging.getLogger(__name__)


async def validar_cookies_cunlogan(cookies, api_url):
    jar = aiohttp.CookieJar(unsafe=True)

    for c in cookies:
        jar.update_cookies({c["name"]: c["value"]})

    payload = {
        "action": "tabladatos",
        "search": "simple",
        "period": "0"
    }

    try:
        async with aiohttp.ClientSession(cookie_jar=jar) as session:
            async with session.post(api_url, data=payload) as resp:
                text = await resp.text()

                # 🔴 detectar sesión inválida
                if not text or "login" in text.lower() or "html" in text.lower():
                    logger.error("❌ Cookies inválidas (redirige a login)")
                    return False
                logger.info("✅ Cookies válidas")
                return True

    except Exception as e:
        logger.error(f"❌ Error validando cookies: {e}")
        return False