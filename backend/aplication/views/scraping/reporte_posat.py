
from datetime import datetime
from aplication.services.tracking_service import obtener_reporte_simplificado, obtener_reporte_horas_marimsys
from django.http import JsonResponse

async def reporte_posat_view(request):
    print("\n🚀 Request POSAT - Reporte Unificado")

    try:
        mobs = request.GET.get("mobs")
        fecha_inicio = request.GET.get("fecha_inicio")
        fecha_fin = request.GET.get("fecha_fin")
        
        source = "cunlogan"
        if mobs == "1486":
            source = "marimsys"

        print(f"📋 Parámetros - mobs: {mobs}, inicio: {fecha_inicio}, fin: {fecha_fin}, source: {source}")

        # Validación fechas (tu código OK ✅)
        if fecha_inicio:
            try:
                datetime.strptime(fecha_inicio, "%Y-%m-%d")
            except ValueError:
                return JsonResponse({
                    "success": False,
                    "error": "Formato de fecha_inicio inválido. Use YYYY-MM-DD"
                }, status=400)

        if fecha_fin:
            try:
                datetime.strptime(fecha_fin, "%Y-%m-%d")
            except ValueError:
                return JsonResponse({
                    "success": False,
                    "error": "Formato de fecha_fin inválido. Use YYYY-MM-DD"
                }, status=400)

        # 🔥 SWITCH DE FUENTE
        if source == "marimsys":
            resultado = await obtener_reporte_horas_marimsys(
                id_movil=mobs,
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin
            )
        else:
            resultado = await obtener_reporte_simplificado(
                mobs=mobs,
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin
            )

        return JsonResponse(resultado)

    except Exception as e:
        print("❌ ERROR:", str(e))
        import traceback
        traceback.print_exc()
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=500)