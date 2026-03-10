from django.contrib import admin
from aplication.models import User,ProcessedPDF, CategoriaNave, CategoriaCertificadoNave, Naves, RequisitoCertificadoNave, CertificadoNave, CategoriaTitulo, Titulo, CategoriaPermiso, Permiso, Trabajador, CategoriaPirotecnia, PirotecniaNave, CategoriaEstudioNave, EstudioNave, CategoriaEspecialidad, Especialidad, EspecialidadImagen, CategoriaCertificado, Certificado, CertificadoImagen, CategoriaCurso, Curso, CategoriaEspecialidad, EspecialidadImagen


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active', 'groups')
    search_fields = ('username', 'email')
    ordering = ('username',)
    filter_horizontal = ('groups', 'user_permissions')  # para asignar grupos y permisos
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Información personal', {'fields': ('first_name', 'last_name', 'email', 'cargo')}),
        ('Permisos', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Fechas importantes', {'fields': ('last_login', 'date_joined')}),
    )


# -------------------------------
# CategoriaCertificado
# -------------------------------
@admin.register(CategoriaCertificado)
class CategoriaCertificadoAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'user')
    search_fields = ('codigo', 'nombre')
    list_filter = ('user',)
    ordering = ('codigo',)
    readonly_fields = ()

    def save_model(self, request, obj, form, change):
        if not obj.user:
            obj.user = request.user
        super().save_model(request, obj, form, change)


# -------------------------------
# Certificado
# -------------------------------
@admin.register(Certificado)
class CertificadoAdmin(admin.ModelAdmin):
    list_display = ('trabajador', 'categoria', 'fecha_vigencia', 'user')
    search_fields = ('trabajador__nombre', 'categoria__nombre')
    list_filter = ('categoria', 'fecha_vigencia', 'user')
    autocomplete_fields = ('trabajador', 'categoria')
    ordering = ('-fecha_vigencia',)

    def save_model(self, request, obj, form, change):
        if not obj.user:
            obj.user = request.user
        super().save_model(request, obj, form, change)


# -------------------------------
# CertificadoImagen
# -------------------------------
@admin.register(CertificadoImagen)
class CertificadoImagenAdmin(admin.ModelAdmin):
    list_display = ('certificado', 'tipo', 'orden', 'user', 'created_at')
    list_filter = ('tipo', 'user', 'created_at')
    search_fields = ('certificado__trabajador__nombre', 'certificado__categoria__nombre')
    autocomplete_fields = ('certificado',)
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('orden',)


# -------------------------------
# CategoriaEspecialidad
# -------------------------------
@admin.register(CategoriaEspecialidad)
class CategoriaEspecialidadAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'user')
    search_fields = ('codigo', 'nombre')
    list_filter = ('user',)
    ordering = ('codigo',)

    def save_model(self, request, obj, form, change):
        if not obj.user:
            obj.user = request.user
        super().save_model(request, obj, form, change)


# -------------------------------
# Especialidad
# -------------------------------
@admin.register(Especialidad)
class EspecialidadAdmin(admin.ModelAdmin):
    list_display = ('trabajador', 'categoria', 'fecha_vigencia', 'user', 'created_at')
    list_filter = ('categoria', 'fecha_vigencia', 'user')
    search_fields = ('trabajador__nombre', 'categoria__nombre')
    autocomplete_fields = ('trabajador', 'categoria')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-fecha_vigencia',)

    def save_model(self, request, obj, form, change):
        if not obj.user:
            obj.user = request.user
        super().save_model(request, obj, form, change)


# -------------------------------
# EspecialidadImagen
# -------------------------------
@admin.register(EspecialidadImagen)
class EspecialidadImagenAdmin(admin.ModelAdmin):
    list_display = ('especialidad', 'tipo', 'orden', 'user', 'created_at')
    list_filter = ('tipo', 'user', 'created_at')
    search_fields = ('especialidad__trabajador__nombre', 'especialidad__categoria__nombre')
    autocomplete_fields = ('especialidad',)
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('orden',)


# -------------------------------
# CategoriaCurso
# -------------------------------
@admin.register(CategoriaCurso)
class CategoriaCursoAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'user')
    search_fields = ('codigo', 'nombre')
    list_filter = ('user',)
    ordering = ('codigo',)

    def save_model(self, request, obj, form, change):
        if not obj.user:
            obj.user = request.user
        super().save_model(request, obj, form, change)


# -------------------------------
# Curso
# -------------------------------
@admin.register(Curso)
class CursoAdmin(admin.ModelAdmin):
    list_display = ('trabajador', 'categoria', 'fecha_vigencia', 'estado', 'user')
    list_filter = ('categoria', 'fecha_vigencia', 'estado', 'user')
    search_fields = ('trabajador__nombre', 'categoria__nombre')
    autocomplete_fields = ('trabajador', 'categoria')
    ordering = ('-fecha_vigencia',)

    def save_model(self, request, obj, form, change):
        if not obj.user:
            obj.user = request.user
        super().save_model(request, obj, form, change)



@admin.register(CategoriaPirotecnia)
class CategoriaPirotecniaAdmin(admin.ModelAdmin):
    list_display = (
        'nombre',
        'user',
        'created_at',
        'updated_at',
    )

    search_fields = ('nombre',)
    list_filter = ('created_at', 'updated_at')
    ordering = ('nombre',)

    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Información de la categoría', {
            'fields': ('nombre', 'user')
        }),
        ('Fechas del sistema', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(PirotecniaNave)
class PirotecniaNaveAdmin(admin.ModelAdmin):
    list_display = (
        'nave',
        'categoria',
        'cantidad',
        'fecha_vigencia',
        'user',
        'created_at',
    )

    list_filter = (
        'categoria',
        'nave',
        'fecha_vigencia',
        'created_at',
    )

    search_fields = (
        'nave__nombre',
        'categoria__nombre',
        'observacion',
    )

    ordering = ('fecha_vigencia',)

    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Datos de la bengala', {
            'fields': (
                'categoria',
                'cantidad',
                'fecha_vigencia',
                'observacion',
            )
        }),
        ('Asignación', {
            'fields': (
                'nave',
                'user',
            )
        }),
        ('Fechas del sistema', {
            'fields': (
                'created_at',
                'updated_at',
            )
        }),
    )

@admin.register(CategoriaEstudioNave)
class CategoriaEstudioNaveAdmin(admin.ModelAdmin):
    list_display = (
        'nombre',
        'user',
        'created_at',
        'updated_at',
    )

    search_fields = ('nombre',)
    list_filter = ('created_at', 'updated_at')
    ordering = ('nombre',)

    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Información de la categoría', {
            'fields': ('nombre', 'user')
        }),
        ('Fechas del sistema', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(EstudioNave)
class EstudioNaveAdmin(admin.ModelAdmin):
    list_display = (
        'nave',
        'categoria',
        'fecha_aprobacion',
        'user',
        'created_at',
    )

    list_filter = (
        'categoria',
        'nave',
        'fecha_aprobacion',
        'created_at',
    )

    search_fields = (
        'nave__nombre',
        'categoria__nombre',
        'observacion',
    )

    ordering = ('-fecha_aprobacion',)

    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Datos del estudio', {
            'fields': (
                'nave',
                'categoria',
                'fecha_aprobacion',
                'observacion',
                'archivo_pdf',
            )
        }),
        ('Auditoría', {
            'fields': (
                'user',
                'created_at',
                'updated_at',
            )
        }),
    )



@admin.register(ProcessedPDF)
class ProcessedPDFAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "original_name",
        "output_name",
        "file_size",
        "file_path",
        "created_at",
    )
    list_filter = ("created_at", "user")
    search_fields = ("original_name", "output_name", "user__username")
    ordering = ("-created_at",)


# -------------------------------
# CategoriaNave
# -------------------------------
@admin.register(CategoriaNave)
class CategoriaNaveAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'user', 'created_at', 'updated_at')
    search_fields = ('nombre',)
    list_filter = ('created_at',)
    readonly_fields = ('created_at', 'updated_at')


# -------------------------------
# CategoriaCertificadoNave
# -------------------------------
@admin.register(CategoriaCertificadoNave)
class CategoriaCertificadoNaveAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'user', 'created_at', 'updated_at')
    search_fields = ('nombre',)
    list_filter = ('created_at',)
    readonly_fields = ('created_at', 'updated_at')


# -------------------------------
# Naves
# -------------------------------
@admin.register(Naves)
class NavesAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'categoria', 'sllamada', 'matricula', 'eslora', 'manga', 'puntal', 'trg', 'tminima', 'tmaxima', 'pasajeros', 'actividad', 'user', 'created_at')
    search_fields = ('nombre', 'sllamada', 'matricula')
    list_filter = ('categoria', 'actividad', 'created_at')
    readonly_fields = ('created_at', 'updated_at')


# -------------------------------
# RequisitoCertificadoNave
# -------------------------------
@admin.register(RequisitoCertificadoNave)
class RequisitoCertificadoNaveAdmin(admin.ModelAdmin):
    list_display = (
        'categoria_certificado',
        'obligatorio',
        'aplica_a_todas',
        'naves_aplican',  # Nuevo campo
        'user',
        'created_at'
    )
    search_fields = ('categoria_certificado__nombre',)
    list_filter = ('categoria_certificado', 'obligatorio', 'aplica_a_todas', 'created_at')
    filter_horizontal = ('naves',)
    readonly_fields = ('created_at', 'updated_at')

    # -------------------------------
    # Mostrar nombres de naves
    # -------------------------------
    def naves_aplican(self, obj):
        if obj.aplica_a_todas:
            return "Aplica a todas"
        naves = obj.naves.all()
        return ", ".join([n.nombre for n in naves]) if naves.exists() else "-"
    
    naves_aplican.short_description = "Naves que aplica"


# -------------------------------
# CertificadoNave
# -------------------------------
@admin.register(CertificadoNave)
class CertificadoNaveAdmin(admin.ModelAdmin):
    list_display = ('nave', 'categoria', 'fecha_emision', 'fecha_vigencia', 'user', 'observacion', 'created_at')
    search_fields = ('nave__nombre', 'categoria__nombre', 'observacion')
    list_filter = ('categoria', 'fecha_emision', 'fecha_vigencia', 'created_at')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Trabajador)
class TrabajadorAdmin(admin.ModelAdmin):
    list_display = ("nombre", "rut")
    search_fields = ("nombre", "rut")

@admin.register(CategoriaTitulo)
class CategoriaTituloAdmin(admin.ModelAdmin):
    list_display = ("codigo", "nombre", "user")
    search_fields = ("codigo", "nombre")
    list_filter = ("user",)
    ordering = ("codigo",)
    readonly_fields = ()

    def save_model(self, request, obj, form, change):
        # Asigna automáticamente el usuario si no está definido
        if not obj.user:
            obj.user = request.user
        super().save_model(request, obj, form, change)


@admin.register(Titulo)
class TituloAdmin(admin.ModelAdmin):
    list_display = (
        "trabajador",
        "categoria",
        "fecha_vigencia",
        "user",
        "created_at"
    )
    list_filter = (
        "categoria",
        "fecha_vigencia",
        "user"
    )
    search_fields = (
        "trabajador__nombre",
        "categoria__nombre",
        "observacion"
    )
    autocomplete_fields = ("trabajador", "categoria")
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-created_at",)

    def save_model(self, request, obj, form, change):
        if not obj.user:
            obj.user = request.user
        super().save_model(request, obj, form, change)


@admin.register(CategoriaPermiso)
class CategoriaPermisoAdmin(admin.ModelAdmin):
    list_display = ("codigo", "nombre", "user")
    search_fields = ("codigo", "nombre")
    list_filter = ("user",)
    ordering = ("codigo",)

    def save_model(self, request, obj, form, change):
        if not obj.user:
            obj.user = request.user
        super().save_model(request, obj, form, change)


@admin.register(Permiso)
class PermisoAdmin(admin.ModelAdmin):
    list_display = (
        "trabajador",
        "categoria",
        "fecha_vigencia",
        "user",
        "created_at"
    )
    list_filter = (
        "categoria",
        "fecha_vigencia",
        "user"
    )
    search_fields = (
        "trabajador__nombre",
        "categoria__nombre",
        "observacion"
    )
    autocomplete_fields = ("trabajador", "categoria")
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-created_at",)

    def save_model(self, request, obj, form, change):
        if not obj.user:
            obj.user = request.user
        super().save_model(request, obj, form, change)