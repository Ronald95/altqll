import asyncio
from DirectemarClient import DirectemarClient

async def main():
    client = DirectemarClient("19145988-1", "@Altamar267")

    zarpes = await client.obtener_zarpes()

    print("🚢 RESULTADO:")
    print(zarpes)

if __name__ == "__main__":
    asyncio.run(main())