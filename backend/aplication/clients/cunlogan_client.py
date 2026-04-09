import aiohttp
from datetime import timedelta
import asyncio

API_URL   = "https://www.cunlogantrack.net/controller/location.php"

async def fetch_chunk(session, semaphore, start, end, mobs):
    payload = {
        "sort": "loc_date",
        "dir": "ASC",
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
        async with session.post(API_URL, data=payload) as r:
            if r.status != 200:
                return []
            data = await r.json(content_type=None)
            return data.get("location", [])


async def obtener_data_cruda(cookies, start_date, end_date, mobs):
    jar = aiohttp.CookieJar(unsafe=True)
    for c in cookies:
        jar.update_cookies({c["name"]: c["value"]})

    semaphore = asyncio.Semaphore(3)

    async with aiohttp.ClientSession(cookie_jar=jar) as session:
        tareas = []
        current = start_date

        while current < end_date:
            chunk_end = min(current + timedelta(hours=6), end_date)
            tareas.append(fetch_chunk(session, semaphore, current, chunk_end, mobs))
            current = chunk_end

        resultados = await asyncio.gather(*tareas)

    data = []
    for r in resultados:
        data.extend(r)

    return data