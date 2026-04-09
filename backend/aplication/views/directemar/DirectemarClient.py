import asyncio
import base64
import json
from datetime import datetime, timedelta
from urllib.parse import urlparse
import httpx
from playwright.async_api import async_playwright

ZARPE_LOGIN_URL = "https://orion.directemar.cl/auth2/responseOpenIDClaveUnica/18/1/0"


class DirectemarClient:

    def __init__(self, run: str, clave: str):
        self.run = run
        self.clave = clave
        self.token = None

    def _extraer_token(self, url: str) -> str | None:
        """Extrae JWT de /mis-aplicaciones/<TOKEN>"""
        parsed = urlparse(url)
        path_parts = parsed.path.strip("/").split("/")
        if "mis-aplicaciones" in path_parts:
            idx = path_parts.index("mis-aplicaciones")
            if len(path_parts) > idx + 1:
                token_candidate = path_parts[idx + 1]
                if len(token_candidate.split(".")) == 3:
                    return token_candidate
        return None

    def token_expirado(token: str) -> bool:
        payload = token.split(".")[1]
        padded = payload + "=" * (-len(payload) % 4)
        data = json.loads(base64.b64decode(padded))
        exp = datetime.fromtimestamp(data["exp"])
        return datetime.utcnow() > exp

    # ─────────────────────────────
    # LOGIN
    # ─────────────────────────────
    async def _login(self):
        print("🔐 Haciendo login...")

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False)
            context = await browser.new_context(
                viewport={"width": 1280, "height": 720},
                locale="es-CL",
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
            )
            page = await context.new_page()

            print("🔹 Abriendo login...")
            await page.goto(ZARPE_LOGIN_URL, wait_until="domcontentloaded", timeout=40000)
            await page.wait_for_timeout(3000)
            print("🔹 URL actual:", page.url)

            # Click ClaveÚnica si aparece
            try:
                await page.locator("button:has-text('ClaveÚnica')").click(timeout=5000)
                print("🔹 Click en ClaveÚnica")
            except:
                print("⚠️ No apareció botón ClaveÚnica")

            # Esperar inputs
            await page.wait_for_selector("#uname")
            await page.wait_for_selector("#pword")

            print("🔹 Escribiendo credenciales...")
            await page.click("#uname")
            await page.keyboard.type(self.run, delay=80)
            await page.click("#pword")
            await page.keyboard.type(self.clave, delay=100)

            await page.press("#pword", "Tab")
            await page.wait_for_timeout(1000)

            # Activar botón login
            await page.wait_for_function(
                "document.querySelector('#login-submit') && !document.querySelector('#login-submit').disabled"
            )
            await page.click("#login-submit")
            print("🔹 Login enviado, esperando redirección...")

            # Esperar redirección a /mis-aplicaciones/...
            await page.wait_for_function(
                "window.location.pathname.includes('/mis-aplicaciones')",
                timeout=60000
            )

            current_url = page.url
            print("🌐 URL completa:")
            print(current_url)

            # Fragmento y path
            parsed = urlparse(current_url)
            print("🔹 Fragmento (hash #):", parsed.fragment if parsed.fragment else "(vacío)")
            print("🔹 Path:", parsed.path)

            # Extraer token
            token = self._extraer_token(current_url)
            if token:
                print("✅ Token detectado correctamente:")
                print(token)
                self.token = token
            else:
                print("❌ No se pudo obtener token")

            # Pausa para inspección manual
            print("\n⏸ Sistema cargado, navegador en pausa para inspección. Cierra manualmente cuando quieras.")
            await asyncio.sleep(300)  # 5 minutos de pausa

            await browser.close()



# ─────────────────────────────
# EJEMPLO DE USO
# ─────────────────────────────
async def main():
    client = DirectemarClient("19145988-1", "")
    await client._login()
    if client.token:
        print("\n💎 Token final:", client.token)

if __name__ == "__main__":
    asyncio.run(main())