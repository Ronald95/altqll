
import json
import requests
from django.http import JsonResponse, HttpResponse
from rest_framework.decorators import csrf_exempt
from rest_framework.decorators import require_POST
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes

@csrf_exempt
@permission_classes([IsAuthenticated])
def descargar_pdf(request, codigo):
    # Token de Directemar (puede venir del frontend o guardarse en backend)
    token = request.headers.get("Authorization")
    if not token:
        return HttpResponse("Falta token", status=401)

    url = f"https://recaudaciones.directemar.cl/api/ordenesingreso/detalle/{codigo}"
    # Petición al servidor externo
    response = requests.get(url, headers={"Authorization": token})
    if response.status_code == 200:
        return HttpResponse(
            response.content,
            content_type="application/pdf",
        )
    else:
        return HttpResponse(
            f"Error {response.status_code}: {response.text}",
            status=response.status_code
        )


@require_POST
def buscar_tripulante(request):
    try:
        # Parsear JSON del body
        data = json.loads(request.body)
        rut = data.get("rut")
        token = data.get("token")

        if not rut or not token:
            return JsonResponse({"error": "Se requiere 'rut' y 'token'"}, status=400)

        # Llamada a la API externa
        url = "https://orion.directemar.cl/endPointCtr/index.php/embarqueDesembarque/buscarDatosTripulante"
        response = requests.post(
            url,
            json={"rut": rut},
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            timeout=15
        )

        # Verificar si devuelve JSON válido
        try:
            return JsonResponse(response.json(), safe=False, status=response.status_code)
        except ValueError:
            # No era JSON, devolver error legible
            return JsonResponse(
                {"error": "Sesión expirada o inválida. Por favor vuelva a iniciar sesión."},
                status=401
            )

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def buscar_nave(request):
    if not request.body:
        return JsonResponse({"error": "El cuerpo de la solicitud está vacío"}, status=400)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido"}, status=400)

    token_usuario = data.get("token")
    rut_usuario = data.get("armador")

    # Endpoint remoto
    url = "https://orion.directemar.cl/endPointCtr/index.php/nave/buscarNave"

    try:
        response = requests.post(
            url,
            json={
                "search": "",
                "mayor": 0,
                "armador": rut_usuario,
                "navegando": 0,
                "pais": "CL"
            },
            headers={
                "Authorization": f"Bearer {token_usuario}",
                "Content-Type": "application/json",
            },
            timeout=10
        )
       # Verificar si devuelve JSON válido
        try:
            return JsonResponse(response.json(), safe=False, status=response.status_code)
        except ValueError:
            # No era JSON, devolver error legible
            return JsonResponse(
                {"error": "Sesión expirada o inválida. Por favor vuelva a iniciar sesión."},
                status=401
            )
    except requests.exceptions.RequestException as e:
        return JsonResponse({"error": str(e)}, status=500)



@csrf_exempt
@require_POST
def buscar_inspecciones(request):
    if not request.body:
        return JsonResponse(
            {"error": "El cuerpo de la solicitud está vacío"},
            status=400
        )

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse(
            {"error": "JSON inválido"},
            status=400
        )

    token_usuario = data.get("token")
    id_movil = data.get("idMovil")

    if not token_usuario or not id_movil:
        return JsonResponse(
            {"error": "Faltan parámetros obligatorios (token, idMovil)"},
            status=400
        )

    # Endpoint remoto Directemar
    url = (
        "https://orion.directemar.cl/endPointCtr/index.php/ZarpeRecalada/buscarInspecciones"
    )

    try:
        response = requests.post(
            url,
            json={
                "idMovil": id_movil
            },
            headers={
                "Authorization": f"Bearer {token_usuario}",
                "Content-Type": "application/json",
            },
            timeout=10
        )

        # Intentar devolver JSON válido
        try:
            return JsonResponse(
                response.json(),
                safe=False,
                status=response.status_code
            )
        except ValueError:
            # Token vencido o respuesta HTML
            return JsonResponse(
                {
                    "error": (
                        "Sesión expirada o inválida. "
                        "Por favor vuelva a iniciar sesión."
                    )
                },
                status=401
            )

    except requests.exceptions.Timeout:
        return JsonResponse(
            {"error": "Tiempo de espera agotado con Directemar"},
            status=504
        )

    except requests.exceptions.RequestException as e:
        return JsonResponse(
            {"error": str(e)},
            status=500
        )


@csrf_exempt
@require_POST
def certificados_persona(request):
    """
    Recibe un RUT y token, consulta Directemar y devuelve
    datos del certificado en JSON limpio.
    """
    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({"error": "JSON inválido"}, status=400)

    rut = data.get("rut")
    token = data.get("token")

    if not rut or not token:
        return JsonResponse({"error": "Faltan parámetros rut o token"}, status=400)

    url = "https://serviciosonline.directemar.cl/certificados/ReporteUsuario/getCertificado"

    try:
        response = requests.post(
            url,
            json={"RutParam": rut, "TipoCertificado": 1},
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )

        if response.status_code != 200:
            return JsonResponse({"error": "Error al obtener certificado"}, status=response.status_code)

        result = response.json()
        html = result.get("getView", "")

        if not html:
            return JsonResponse({"error": "Certificado vacío"}, status=404)

        # Extraer campos usando regex
        nombre = re.search(r"<strong>Nombre<\/strong>\s*<\/td>\s*<td>\s*(.*?)\s*<\/td>", html, re.S)
        rut_extr = re.search(r"<strong>Rut<\/strong>\s*<\/td>\s*<td>\s*(.*?)\s*<\/td>", html, re.S)
        telefono = re.search(r"<strong>Tel[eé]fono<\/strong>\s*<\/td>\s*<td>\s*(.*?)\s*<\/td>", html, re.S)
        direccion = re.search(r"<strong>Direcci[oó]n<\/strong>\s*<\/td>\s*<td>\s*(.*?)\s*<\/td>", html, re.S)
        titulos = re.findall(r"<input type=\"radio\" .*? value=\"(.*?)\"", html, re.S)

        data_json = {
            "nombre": nombre.group(1).strip() if nombre else "",
            "rut": rut_extr.group(1).strip() if rut_extr else "",
            "telefono": telefono.group(1).strip() if telefono else "",
            "direccion": direccion.group(1).strip() if direccion else "",
            "titulos": titulos
        }

        return JsonResponse(data_json)

    except requests.exceptions.RequestException as e:
        return JsonResponse({"error": str(e)}, status=500)

