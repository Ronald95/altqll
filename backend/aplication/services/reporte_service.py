from ..utils.geo import haversine_km

def calcular_reporte(posiciones, velocidad_minima=1.0, fecha_inicio=None, fecha_fin=None):

    VEL_MIN = 0.5
    DIST_MIN_KM = 0.05
    """
    Reporte simplificado con tiempo real de navegación basado en distancia recorrida
    """
    if not posiciones:
        return {
            "total_posiciones": 0, 
            "posiciones_navegando": 0, 
            "dias": [], 
            "minutos_navegacion": 0,
            "horas_navegacion": 0,
            "distancia_km": 0,
            "millas_recorridas": 0
        }

    # Ordenar por fecha
    posiciones.sort(key=lambda x: x.get("fecha_obj") or datetime.min)

    reportes_por_dia = {}
    total_navegacion_minutos = 0

    for i, p in enumerate(posiciones):
        fecha_obj = p.get("fecha_obj")
        if not fecha_obj:
            continue

        dia = fecha_obj.date()

        if dia not in reportes_por_dia:
            reportes_por_dia[dia] = []

        # Inicializamos valores por defecto
        distancia_km = 0.0
        minutos_navegados = 0.0
        velocidad_navegacion_kt = 0.0

        # Si hay una posición anterior
        if i > 0:
            p_prev = posiciones[i - 1]
            fecha_prev = p_prev.get("fecha_obj")
            
            VEL_MIN = 0.5          # nudos (ajustable)
            DIST_MIN_KM = 0.05     # ~50 metros

            if fecha_prev:
                distancia_km = haversine_km(
                    p_prev.get("lat"), p_prev.get("lon"),
                    p.get("lat"), p.get("lon")
                )

                vel1 = p_prev.get("velocidad", 0)
                vel2 = p.get("velocidad", 0)

                # 🔥 Determinar si navegó y calcular velocidad efectiva
                if distancia_km >= DIST_MIN_KM:
                    # Caso 1: Partió durante el intervalo (velocidad inicial baja, final alta)
                    if vel1 < VEL_MIN and vel2 >= VEL_MIN:
                        velocidad_navegacion_kt = vel2
                    
                    # Caso 2: Se detuvo durante el intervalo (velocidad inicial alta, final baja)
                    elif vel1 >= VEL_MIN and vel2 < VEL_MIN:
                        velocidad_navegacion_kt = vel1
                    
                    # Caso 3: Navegó todo el intervalo (ambas velocidades altas)
                    elif vel1 >= VEL_MIN and vel2 >= VEL_MIN:
                        velocidad_navegacion_kt = (vel1 + vel2) / 2
                    
                    # Caso 4: Ambas velocidades bajas pero hubo movimiento significativo
                    else:
                        # Calcular velocidad real desde distancia/tiempo
                        delta_seconds = (fecha_obj - fecha_prev).total_seconds()
                        if delta_seconds > 0:
                            velocidad_kmh = (distancia_km / delta_seconds) * 3600
                            velocidad_navegacion_kt = velocidad_kmh / 1.852
                        else:
                            velocidad_navegacion_kt = 0

                    # 🔥 Calcular minutos navegados basado en distancia y velocidad
                    if velocidad_navegacion_kt >= VEL_MIN:
                        velocidad_kmh = velocidad_navegacion_kt * 1.852
                        tiempo_horas = distancia_km / velocidad_kmh
                        minutos_navegados = round(tiempo_horas * 60, 2)
                    else:
                        minutos_navegados = 0.0

        # Agregar al reporte solo si hay navegación > 0
        if minutos_navegados > 0:
            total_navegacion_minutos += minutos_navegados
            reportes_por_dia[dia].append({
                "hora": fecha_obj.strftime("%H:%M:%S"),
                "velocidad": p.get("velocidad"),
                "rumbo": p.get("rumbo"),
                "lat": p.get("lat"),
                "lon": p.get("lon"),
                "puerto": p.get("puerto"),
                "distancia_km": distancia_km,
                "minutos_navegados": minutos_navegados,
                "velocidad_navegacion_kt": round(velocidad_navegacion_kt, 2)
            })

    dias_completos = []
    current = fecha_inicio
    end = fecha_fin

    while current <= end:
        dias_completos.append(current)
        current += timedelta(days=1)

    # Crear lista de días ordenada
    dias = []
    for dia in dias_completos:
        reportes_dia = reportes_por_dia.get(dia, [])

        minutos_navegados_dia = sum(r["minutos_navegados"] for r in reportes_dia)
        horas_navegadas = round(minutos_navegados_dia / 60, 2)
        
        # 🔥 Calcular distancia total del día
        distancia_total_km = sum(r["distancia_km"] for r in reportes_dia)
        millas_recorridas = round(distancia_total_km * 0.539957, 2)  # km a millas náuticas

        if reportes_dia:
            velocidades = [r["velocidad"] for r in reportes_dia]
            velocidad_promedio = sum(velocidades) / len(velocidades)
            velocidad_maxima = max(velocidades)
            velocidad_minima_dia = min(velocidades)
        else:
            # 🔥 Día sin navegación
            velocidad_promedio = 0
            velocidad_maxima = 0
            velocidad_minima_dia = 0

        dias_semana_es = {
            "Monday": "Lunes",
            "Tuesday": "Martes",
            "Wednesday": "Miércoles",
            "Thursday": "Jueves",
            "Friday": "Viernes",
            "Saturday": "Sábado",
            "Sunday": "Domingo"
        }

        dias.append({
            "fecha": dia.strftime("%Y-%m-%d"),
            "fecha_display": dia.strftime("%d/%m/%Y"),
            "dia_semana": dias_semana_es.get(dia.strftime("%A"), dia.strftime("%A")),
            "total_reportes": len(reportes_dia),  # será 0 si no hay
            "minutos_navegados": round(minutos_navegados_dia, 2),  # 🔥 nuevo campo
            "horas_navegadas": horas_navegadas,
            "distancia_km": round(distancia_total_km, 2),  # 🔥 nuevo
            "millas_recorridas": millas_recorridas,  # 🔥 nuevo
            "velocidad_promedio": round(velocidad_promedio, 1),
            "velocidad_maxima": round(velocidad_maxima, 1),
            "velocidad_minima": round(velocidad_minima_dia, 1),
            "reportes": reportes_dia  # lista vacía si no hay
        })

    # 🔥 Calcular distancia total global
    distancia_total_km = sum(d["distancia_km"] for d in dias)
    millas_recorridas_total = round(distancia_total_km * 0.539957, 2)  # km a millas náuticas

    return {
        "total_posiciones": len(posiciones),
        "posiciones_navegando": sum(len(r["reportes"]) for r in dias),
        "minutos_navegacion": round(total_navegacion_minutos, 2),  # 🔥 nuevo campo global
        "horas_navegacion": round(total_navegacion_minutos / 60, 2),  # 🔥 adicional
        "distancia_km": round(distancia_total_km, 2),  # 🔥 nuevo
        "millas_recorridas": millas_recorridas_total,  # 🔥 nuevo
        "dias": dias
    }
