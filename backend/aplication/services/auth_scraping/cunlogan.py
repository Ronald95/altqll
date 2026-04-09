from playwright.async_api import async_playwright
from aplication.services.session.cookie_manager import save_cookies, get_cookies
from aplication.services.auth_scraping.validar_cookies_cunlogan import validar_cookies_cunlogan
import random


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

async def login_cunlogan(force_login=False):
    cookies = None
    if not force_login:
        cookies = get_cookies(CL_COOKIES)
        if cookies:
            print("🔍 Validando cookies Cunlogan...")
            is_valid = await validar_cookies_cunlogan(cookies, CL_API_URL)
            if is_valid:
                print("✅ Cookies vigentes")
                return cookies
            else:
                print("⚠️ Cookies expiradas, se hará login")

    print("🌐 Iniciando login Cunlogan...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(user_agent=get_random_ua())
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
        print("✅ Login Cunlogan OK")
        return cookies