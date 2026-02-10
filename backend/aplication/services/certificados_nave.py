from django.db.models import Q
from aplication.models import (
    RequisitoCertificadoNave,
    CertificadoNave
)

def porcentaje_certificados_nave(nave):
    requisitos = RequisitoCertificadoNave.objects.filter(
        categoria_nave=nave.categoria,
        obligatorio=True
    ).filter(
        Q(aplica_a_todas=True) |
        Q(naves=nave)
    ).distinct()

    total_requeridos = requisitos.count()

    cargados = CertificadoNave.objects.filter(
        nave=nave,
        categoria__in=requisitos.values('categoria_certificado')
    ).values('categoria').distinct().count()

    if total_requeridos == 0:
        return 100

    return round((cargados / total_requeridos) * 100, 2)
