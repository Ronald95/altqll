import random
from playwright.async_api import async_playwright
from aplication.services.session.cookie_manager import save_cookies, get_cookies
import logging


# Logger
logger = logging.getLogger(__name__)


MS_LOGIN_URL = "https://websat.marimsys.cl/Autentificacion/logIn"
MS_HOME_URL  = "https://websat.marimsys.cl/Home/Inicio?Tecnologia=VMS"

MS_USER = "altamar"
MS_PASS = "naves"
MS_COOKIES= "ms_cookies.json"


USER_AGENTS = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_3) AppleWebKit/537.36 Chrome/121.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
    ]

async def get_random_ua():
    return random.choice(USER_AGENTS)

# ───────────────────────────
# LOGIN
# ───────────────────────────
async def login_marimsys(): 
    cookies = get_cookies(MS_COOKIES)
    if cookies: 
        return cookies
    
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
        await page.goto(MS_LOGIN_URL) 
        await page.fill('input[name="Usuario"]', MS_USER) 
        await page.fill('input[name="Password"]', MS_PASS) 
        await page.click('button[type="submit"]') 
        
        # Esperar a que cargue el dashboard para asegurar la cookie de sesión
        try:
            await page.wait_for_url("**/Home/Inicio**", timeout=15000)
            await page.wait_for_load_state("networkidle")
        except:
            logger.warning("⚠️ Timeout esperando redirección post-login")

        cookies = await context.cookies()
        await browser.close() 
        save_cookies(cookies, MS_COOKIES)
        logger.info("✅ Login Marimsys OK")
        return cookies