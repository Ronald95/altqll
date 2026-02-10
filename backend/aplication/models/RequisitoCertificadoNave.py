from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid
from .CategoriaCertificadoNave import CategoriaCertificadoNave
from django.conf import settings
from .Naves import Naves
from .CategoriaNave import CategoriaNave
from .CertificadoNave import CertificadoNave
from django.core.exceptions import ValidationError



class RequisitoCertificadoNave(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    categoria_certificado = models.ForeignKey(
        CategoriaCertificadoNave,
        on_delete=models.PROTECT,
        verbose_name="Tipo de certificado"
    )
    
    obligatorio = models.BooleanField(default=True)
    
    aplica_a_todas = models.BooleanField(
        default=True,
        help_text="Si aplica a todas las naves"
    )
    
    naves = models.ManyToManyField(
        Naves,
        blank=True,
        related_name="requisitos_especificos"
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Requisito de certificado"
        verbose_name_plural = "Requisitos de certificados"
        unique_together = ('categoria_certificado',)  # No necesitamos categoría de nave

    def __str__(self):
        # Si aplica a todas las naves
        if self.aplica_a_todas:
            return f"{self.categoria_certificado.nombre} - Aplica a todas las naves"
        
        # Si aplica a naves específicas
        naves = self.naves.all()
        if naves.exists():
            nombres_naves = ", ".join([n.nombre for n in naves])
            return f"{self.categoria_certificado.nombre} - Naves: {nombres_naves}"
        
        # Por defecto, solo el nombre del certificado
        return f"{self.categoria_certificado.nombre}"


    def clean(self):
        if self.aplica_a_todas and self.naves.exists():
            raise ValidationError("No puede seleccionar naves si 'Aplica a todas' está activo")

    # -------------------------------
    # Método para obtener estado de cumplimiento de certificados por nave
    # -------------------------------
    @staticmethod
    def certificados_por_nave(nave):
        """
        Devuelve una lista con cada certificado obligatorio de la nave y su estado:
        [{'nombre': ..., 'estado': 'OK'/'PENDIENTE'}]
        """
        # Todos los requisitos obligatorios
        requisitos = RequisitoCertificadoNave.objects.filter(obligatorio=True).prefetch_related('naves')

        # Obtener certificados que ya tiene la nave
        certificados = CertificadoNave.objects.filter(nave=nave).values_list('categoria', flat=True)

        resultado = []
        for r in requisitos:
            if r.aplica_a_todas or nave in r.naves.all():
                estado = "OK" if r.categoria_certificado.id in certificados else "PENDIENTE"
                resultado.append({
                    "nombre": r.categoria_certificado.nombre,
                    "estado": estado
                })
        return resultado


    # -------------------------------
    # Método para calcular porcentaje por nave
    # -------------------------------
    @staticmethod
    def porcentaje_certificados_naves(naves):
        """
        Devuelve {nave.id: porcentaje} para todas las naves en 2 queries.
        """
        requisitos = RequisitoCertificadoNave.objects.filter(obligatorio=True).prefetch_related('naves')

        # Obtener todos los certificados de estas naves
        from .CertificadoNave import CertificadoNave
        certificados = CertificadoNave.objects.filter(nave__in=naves).values('nave', 'categoria').distinct()

        # Agrupar certificados por nave
        certificados_por_nave = {}
        for c in certificados:
            certificados_por_nave.setdefault(c['nave'], set()).add(c['categoria'])

        resultados = {}
        for nave in naves:
            requisitos_nave = [
                r for r in requisitos
                if r.aplica_a_todas or nave in r.naves.all()
            ]
            total_requeridos = len(requisitos_nave)
            categorias_requisitos = set(r.categoria_certificado.id for r in requisitos_nave)

            cargados = len(certificados_por_nave.get(nave.id, set()) & categorias_requisitos)

            resultados[nave.id] = 100 if total_requeridos == 0 else round((cargados / total_requeridos) * 100, 2)

        return resultados
            
    # -------------------------------
    # Estado de cumplimiento
    # -------------------------------
    @staticmethod
    def estado_certificados(porcentaje):
        if porcentaje == 100:
            return "COMPLETO"
        if porcentaje >= 70:
            return "INCOMPLETO"
        return "CRÍTICO"