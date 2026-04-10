from playwright.async_api import async_playwright
from aplication.services.session.cookie_manager import save_cookies, get_cookies
from aplication.services.auth_scraping.validar_cookies_cunlogan import validar_cookies_cunlogan
import random

import logging


# Logger
logger = logging.getLogger(__name__)

LOGIN_URL = "https://www.cunlogantrack.net/index.php"
CL_API_URL   = "https://www.cunlogantrack.net/controller/location.php"
CL_COOKIES = "cl_cookies.json"
USER = "altamar"
PASS = "alttrack"

USER_AGENTS = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_3) AppleWebKit/537.36 Chrome/121.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
    ]

async def get_random_ua():
    return random.choice(USER_AGENTS)

async def login_cunlogan(force_login=True):
    cookies = None
    if not force_login:
        cookies = get_cookies(CL_COOKIES)
        if cookies:
            logger.info("🔍 Validando cookies Cunlogan...")
            is_valid = await validar_cookies_cunlogan(cookies, CL_API_URL)
            if is_valid:
                logger.info("✅ Cookies vigentes")
                return cookies
            else:
                logger.warning("⚠️ Cookies expiradas, se hará login")

    logger.info("🌐 Iniciando login Cunlogan...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
            ]
        )
        context = await browser.new_context(
            user_agent=await get_random_ua(),
            viewport={"width": 1366, "height": 768},
            locale="es-CL",
        )
        page = await context.new_page()
        await page.goto(LOGIN_URL)
        await page.fill('input[name="user_temp"]', USER)
        await page.fill('input[name="pass_temp"]', PASS)
        await page.keyboard.press("Enter")

        await page.wait_for_url("**/cunlogan.php", timeout=60000)
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(2000)

        cookies = await context.cookies()
        save_cookies(cookies, CL_COOKIES)
        await browser.close()
        logger.info("✅ Login Cunlogan OK")
        return cookies