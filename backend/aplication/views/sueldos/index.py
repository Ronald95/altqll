from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
import pandas as pd
import pdfplumber
import re
import tempfile

# Regex global
monto_pattern = re.compile(r"\d{1,3}(?:\.\d{3})+")
rut_pattern = re.compile(r"\d{1,3}(?:\.\d{3})*-\s*[\dkK]")

# Función para limpiar nombre
def limpiar_nombre(nombre):
    return re.sub(r"^Sr\(a\)\s*", "", nombre).strip()

# Extraer datos PDF
def extraer_datos_pdf(pdf_file):
    datos = []
    with pdfplumber.open(pdf_file) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if not text:
                continue
            lineas = text.split("\n")
            trabajador = ""
            rut = ""
            total = 0
            for linea in lineas:
                if "TRABAJADOR" in linea:
                    trabajador = limpiar_nombre(linea.split(":")[-1])
                elif "R.U.T" in linea:
                    match_rut = rut_pattern.search(linea)
                    if match_rut:
                        rut = match_rut.group()
                elif "** TOTAL A PAGAR **" in linea:
                    match_total = monto_pattern.search(linea)
                    if match_total and trabajador and rut:
                        total = int(match_total.group().replace(".", ""))
                        datos.append({
                            "TRABAJADOR": trabajador,
                            "RUT": rut,
                            "LIQUIDO_PDF": total
                        })
                        trabajador = ""
                        rut = ""
                        total = 0
    return pd.DataFrame(datos)

# Validar RUT
def es_rut_valido(rut):
    if pd.isna(rut):
        return False
    return bool(rut_pattern.fullmatch(str(rut).strip()))

# Endpoint para comparar sueldos
@csrf_exempt
def comparar_sueldos_view(request):
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)

    pdf_file = request.FILES.get("pdf")
    excel_file = request.FILES.get("excel")

    if not pdf_file or not excel_file:
        return JsonResponse({"error": "Se requiere PDF y Excel"}, status=400)

    # Extraer PDF
    df_pdf = extraer_datos_pdf(pdf_file)

    # Leer Excel (fila 3 como header)
    df_excel = pd.read_excel(excel_file, header=2)
    df_excel.columns = df_excel.columns.str.strip().str.replace("\n","").str.upper()

    # Detectar columnas
    col_trabajador = [c for c in df_excel.columns if "TRABAJADOR" in c or "NOMBRE" in c][0]
    col_rut        = [c for c in df_excel.columns if "RUT" in c][0]
    col_liquido    = [c for c in df_excel.columns if "LIQUIDO" in c or "PAGO" in c][0]

    # Renombrar
    df_excel = df_excel.rename(columns={
        col_trabajador: "TRABAJADOR",
        col_rut: "RUT",
        col_liquido: "LIQUIDO_EXCEL"
    })

    # Filtrar solo columnas necesarias y RUT válidos
    df_excel = df_excel[["TRABAJADOR", "RUT", "LIQUIDO_EXCEL"]]
    df_excel = df_excel[df_excel["RUT"].apply(es_rut_valido)]

    # Merge PDF vs Excel
    df_comparacion = df_excel.merge(df_pdf, on="RUT", how="left")
    df_comparacion["LIQUIDO_PDF"] = df_comparacion["LIQUIDO_PDF"].fillna(0).astype(int)
    df_comparacion["DIFERENCIA"] = df_comparacion["LIQUIDO_EXCEL"] - df_comparacion["LIQUIDO_PDF"]

    # Guardar en archivo temporal y enviar como descarga
    with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp:
        df_comparacion.to_excel(tmp.name, index=False)
        tmp.seek(0)
        response = HttpResponse(tmp.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response['Content-Disposition'] = 'attachment; filename=comparacion_sueldos.xlsx'
        return response