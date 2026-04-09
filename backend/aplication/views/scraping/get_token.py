from django.http import JsonResponse
from django.views import View
import httpx

MICROSERVICE_API_KEY = "MI_API_KEY_SUPER_SECRETA"
MICROSERVICE_URL = "http://localhost:8001/token"

class getTokenDirectemarView(View):
    async def get(self, request):
        run = request.GET.get("run")
        clave = request.GET.get("clave")
        if not run or not clave:
            return JsonResponse({"error": "Faltan parámetros run o clave"}, status=400)

        headers = {"Authorization": f"Bearer {MICROSERVICE_API_KEY}"}
        data = {"run": run, "clave": clave}

        async with httpx.AsyncClient(timeout=60) as client:
            try:
                resp = await client.post(MICROSERVICE_URL, headers=headers, data=data)
                resp.raise_for_status()  # Lanza excepción si status != 2xx
                return JsonResponse(resp.json())
            except httpx.HTTPStatusError as e:
                return JsonResponse({"error": f"Microservicio respondió con status {e.response.status_code}"}, status=500)
            except ValueError:  # JSONDecodeError
                return JsonResponse({"error": "Respuesta inválida del microservicio", "content": resp.text}, status=500)
            except httpx.RequestError as e:
                return JsonResponse({"error": f"No se pudo conectar al microservicio: {str(e)}"}, status=500)