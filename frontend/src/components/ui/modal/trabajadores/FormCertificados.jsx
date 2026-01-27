import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import SelectReact from "react-select";
import { 
  CreditCard, 
  Calendar, 
  Image, 
  User, 
  CheckCircle,
  X,
  Save,
  Upload,
  Camera,
  Layers,
  FileImage,
  Trash2
} from "lucide-react";
import LoaderError from "../../../loading/LoaderError";
import EspecialidadesAPI from "../../../../api/especialidades";
import CertificadosAPI from "../../../../api/certificados";
import Input from "../../../form/input/InputField";
import Label from "../../../form/Label";
import ImageCropPolygon from "../../images/ImageCropPolygon";

const FormCertificados = ({ isOpen, onClose, trabajador, data }) => {
  // Definir valores iniciales
  const initialFormValues = {
    categoria_id: null,
    fecha_vigencia: "",
  };

  // Estado para manejar múltiples imágenes
  const [imagenes, setImagenes] = useState([
    { id: 1, tipo: "frontal", archivo: null, recortada: null, cargando: false, esExistente: false },
    { id: 2, tipo: "trasera", archivo: null, recortada: null, cargando: false, esExistente: false },
    { id: 3, tipo: "extra", archivo: null, recortada: null, cargando: false, esExistente: false }
  ]);

  const [tipos, setTipos] = useState([]);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showImageUpload, setShowImageUpload] = useState(false);

  const isEdit = Boolean(data?.id);

  const { 
    register, 
    handleSubmit, 
    control, 
    reset, 
    formState: { errors, isValid } 
  } = useForm({
    defaultValues: initialFormValues,
    mode: "onChange",
  });

  // --- Cargar tipos de certificados ---
  useEffect(() => {
    if (!isOpen) return;
    const fetchTipos = async () => {
      setLoadingTipos(true);
      try {
        const tiposData = await EspecialidadesAPI.getCategoriasCertificadosForSelect();
        setTipos(tiposData);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los tipos de certificado.");
      } finally {
        setLoadingTipos(false);
      }
    };
    fetchTipos();
  }, [isOpen]);

  // --- Llenar formulario cuando data cambie ---
  useEffect(() => {
    if (!data) {
      // Resetear para creación
      reset(initialFormValues);
      setImagenes([
        { id: 1, tipo: "frontal", archivo: null, recortada: null, cargando: false, esExistente: false },
        { id: 2, tipo: "trasera", archivo: null, recortada: null, cargando: false, esExistente: false },
        { id: 3, tipo: "extra", archivo: null, recortada: null, cargando: false, esExistente: false }
      ]);
      setShowImageUpload(false);
      return;
    }

    // Para edición: cargar datos existentes
    reset({
       categoria_id: data.categoria.id
          ? { value: data.categoria.id, label: data.categoria.nombre }
          : null,
      fecha_vigencia: data.fecha_vigencia || "",
    });

    // Cargar imágenes existentes
    if (data.imagenes && data.imagenes.length > 0) {
      const nuevasImagenes = [
        { id: 1, tipo: "frontal", archivo: null, recortada: null, cargando: false, esExistente: false },
        { id: 2, tipo: "trasera", archivo: null, recortada: null, cargando: false, esExistente: false },
        { id: 3, tipo: "extra", archivo: null, recortada: null, cargando: false, esExistente: false }
      ];
      
      data.imagenes.forEach(img => {
        const index = nuevasImagenes.findIndex(i => i.tipo === img.tipo);
        if (index !== -1) {
          nuevasImagenes[index] = {
            ...nuevasImagenes[index],
            recortada: img.imagen, // URL completa de la imagen del servidor
            esExistente: true,
            imagenId: img.id
          };
        }
      });
      
      setImagenes(nuevasImagenes);
    }
  }, [data, reset]);

  const onSubmit = async (formDataValues) => {
    if (!trabajador?.id) return;
    try {
      setSubmitLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("trabajador", trabajador.id);
      formData.append("categoria_id", formDataValues.categoria_id?.value);
      formData.append("fecha_vigencia", formDataValues.fecha_vigencia);
      
     // Procesar las imágenes
      for (const img of imagenes) {
        if (img.paraEliminar && img.esExistente) {
            formData.append(`eliminar_${img.tipo}`, 'true');
            console.log(`Marcando imagen ${img.tipo} para eliminación`);
        } 
        else if (img.archivo) {
          // Archivo nuevo subido por el usuario
          formData.append(`foto_${img.tipo}`, img.archivo);
          console.log(`Enviando nueva imagen ${img.tipo}`);
        } 
        else if (img.recortada && img.recortada.startsWith('blob:')) {
          // Convertir blob a file
          const response = await fetch(img.recortada);
          const blob = await response.blob();
          const file = new File([blob], `foto_${img.tipo}.png`, { type: 'image/png' });
          formData.append(`foto_${img.tipo}`, file);
          console.log(`Enviando imagen recortada ${img.tipo}`);
        } 
        else if (img.esExistente && !img.paraEliminar) {
    // Solo enviar 'mantener_' si NO estamos eliminando
    formData.append(`mantener_${img.tipo}`, 'true');
    console.log(`Manteniendo imagen existente ${img.tipo}`);
}
      }


     // Verificar contenido
    console.log("=== DATOS A ENVIAR ===");
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File "${value.name}" (${value.size} bytes)`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }

      let response;
      
      if (isEdit) {
        console.log(`Editando certificado ID: ${data.id}`);
        response = await CertificadosAPI.update(data.id, formData);
        console.log("Certificado actualizado:", response.data);
      } else {
        console.log("Creando nuevo certificado");
        response = await CertificadosAPI.create(formData);
        console.log("Certificado creado:", response.data);
      }

      onClose();
      
    } catch (err) {
      console.error("Error al guardar:", err);
      
      let errorMessage = "Ocurrió un error al guardar.";
      
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          const messages = [];
          Object.entries(err.response.data).forEach(([field, errors]) => {
            if (Array.isArray(errors)) {
              messages.push(`${field}: ${errors.join(', ')}`);
            } else if (typeof errors === 'string') {
              messages.push(`${field}: ${errors}`);
            }
          });
          errorMessage = messages.join('\n');
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCrop = (file) => {
    const nuevasImagenes = [...imagenes];
    nuevasImagenes[activeImageIndex].recortada = URL.createObjectURL(file);
    nuevasImagenes[activeImageIndex].archivo = file;
    nuevasImagenes[activeImageIndex].esExistente = false;
    setImagenes(nuevasImagenes);
    setShowImageUpload(false);
  };

  const handleFileChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const nuevasImagenes = [...imagenes];
      nuevasImagenes[index].archivo = file;
      nuevasImagenes[index].recortada = null;
      nuevasImagenes[index].esExistente = false;
      setImagenes(nuevasImagenes);
      setActiveImageIndex(index);
      setShowImageUpload(true);
    }
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    const nuevasImagenes = [...imagenes];
    nuevasImagenes[index].cargando = true;
    setImagenes(nuevasImagenes);
  };

  const handleDragLeave = (index) => {
    const nuevasImagenes = [...imagenes];
    nuevasImagenes[index].cargando = false;
    setImagenes(nuevasImagenes);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    handleDragLeave(index);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const nuevasImagenes = [...imagenes];
      nuevasImagenes[index].archivo = file;
      nuevasImagenes[index].recortada = null;
      nuevasImagenes[index].esExistente = false;
      setImagenes(nuevasImagenes);
      setActiveImageIndex(index);
      setShowImageUpload(true);
    }
  };

const removeImage = (index) => {
  const nuevasImagenes = [...imagenes];
  const imgActual = imagenes[index];
  
  // Si ya está marcada para eliminar, restaurarla
  if (imgActual.paraEliminar) {
    nuevasImagenes[index] = {
      ...imgActual,
      paraEliminar: false
    };
    console.log(`Restaurando imagen ${imgActual.tipo}`);
  } 
  // Si es una imagen existente, marcarla para eliminación
  else if (imgActual.esExistente) {
    nuevasImagenes[index] = {
      ...imgActual,
      paraEliminar: true
    };
    console.log(`Marcando imagen existente ${imgActual.tipo} para eliminación`);
  }
  // Si es una imagen nueva (blob o archivo), removerla completamente
  else if (imgActual.recortada && imgActual.recortada.startsWith('blob:')) {
    URL.revokeObjectURL(imgActual.recortada);
    nuevasImagenes[index] = {
      id: index + 1,
      tipo: imgActual.tipo,
      archivo: null,
      recortada: null,
      cargando: false,
      esExistente: false,
      paraEliminar: false
    };
    console.log(`Eliminando imagen nueva ${imgActual.tipo}`);
  }
  // Si solo tiene archivo (sin recortar), removerlo
  else if (imgActual.archivo) {
    nuevasImagenes[index] = {
      id: index + 1,
      tipo: imgActual.tipo,
      archivo: null,
      recortada: null,
      cargando: false,
      esExistente: false,
      paraEliminar: false
    };
    console.log(`Removiendo archivo ${imgActual.tipo}`);
  }
  
  setImagenes(nuevasImagenes);
  
  // Si la imagen activa fue eliminada, cerrar el editor
  if (activeImageIndex === index && (imgActual.recortada || imgActual.archivo)) {
    setShowImageUpload(false);
  }
};

  const startImageUpload = (index) => {
    setActiveImageIndex(index);
    setShowImageUpload(true);
  };

  const getImageTypeName = (type) => {
    const names = {
      frontal: "Frontal",
      trasera: "Trasera", 
      extra: "Extra"
    };
    return names[type] || type;
  };

  const getImageTypeColor = (type) => {
    const colors = {
      frontal: "bg-blue-100 text-blue-700 border-blue-200",
      trasera: "bg-purple-100 text-purple-700 border-purple-200",
      extra: "bg-green-100 text-green-700 border-green-200"
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "3rem",
      borderColor: state.isFocused ? "#4f46e5" : "#d1d5db",
      borderRadius: "0.75rem",
      borderWidth: "2px",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(79, 70, 229, 0.1)" : "none",
      transition: "all 0.2s",
      "&:hover": {
        borderColor: state.isFocused ? "#4f46e5" : "#9ca3af"
      }
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "0.75rem",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)"
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? "#4f46e5" : state.isFocused ? "#f3f4f6" : "white",
      color: state.isSelected ? "white" : "#1f2937",
      padding: "0.75rem 1rem",
      "&:active": {
        backgroundColor: "#4f46e5"
      }
    })
  };

  if (loadingTipos) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500 border-b-4 border-indigo-100"></div>
        <span className="mt-4 text-gray-600">Cargando tipos de certificados...</span>
      </div>
    );
  }

  return (
    <LoaderError loading={loadingTipos} error={error}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 sm:px-6 py-4 sm:py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
                {isEdit ? "Editar Certificado" : "Nuevo Certificado"}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-sm sm:text-base text-indigo-100">
                <User className="w-4 h-4" />
                <span className="truncate">{trabajador?.nombre}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-6">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <User className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-800">Información del Trabajador</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Nombre</p>
                <p className="font-medium text-gray-900">{trabajador?.nombre || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">RUT</p>
                <p className="font-medium text-gray-900">{trabajador?.rut || "—"}</p>
              </div>
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-2 text-gray-700 font-medium">
              <CreditCard className="w-4 h-4" />
              Tipo de Certificado *
            </Label>
            <Controller
              name="categoria_id"
              control={control}
              rules={{ required: "Seleccione un tipo de certificado" }}
              render={({ field }) => (
                <SelectReact 
                  {...field} 
                  options={tipos} 
                  placeholder="Seleccione un tipo..." 
                  styles={customStyles}
                  className="text-base"
                  isClearable
                  noOptionsMessage={() => "No hay opciones disponibles"}
                />
              )}
            />
            {errors.categoria_id && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                {errors.categoria_id.message}
              </p>
            )}
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-2 text-gray-700 font-medium">
              <Calendar className="w-4 h-4" />
              Fecha de Vigencia *
            </Label>
            <div className="relative">
              <Input
                type="date"
                {...register("fecha_vigencia", { 
                  required: "La fecha de vigencia es obligatoria",
                  validate: value => {
                    if (!value) return true;
                    const selectedDate = new Date(value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return selectedDate >= today || "La fecha debe ser futura";
                  }
                })}
                className="w-full pl-10"
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            {errors.fecha_vigencia && (
              <p className="mt-1 text-sm text-red-600">{errors.fecha_vigencia.message}</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 mb-2 text-gray-700 font-medium">
                <Image className="w-4 h-4" />
                Fotografías del Certificado
              </Label>
              <span className="text-xs text-gray-500">
                {imagenes.filter(img => img.recortada || img.esExistente).length}/3
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {imagenes.map((img, index) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => {
                    setActiveImageIndex(index);
                    if (img.archivo && !img.recortada) {
                      setShowImageUpload(true);
                    } else {
                      setShowImageUpload(false);
                    }
                  }}
                  className={`px-3 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                    activeImageIndex === index 
                      ? `${getImageTypeColor(img.tipo)} border-2 font-medium` 
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <FileImage className="w-4 h-4" />
                  <span className="text-sm">{getImageTypeName(img.tipo)}</span>
                  {(img.recortada || img.esExistente) && (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  )}
                </button>
              ))}
            </div>

            {showImageUpload && imagenes[activeImageIndex]?.archivo ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-700 flex items-center gap-2">
                    <FileImage className="w-4 h-4" />
                    Editando: {getImageTypeName(imagenes[activeImageIndex].tipo)}
                  </h4>
                  <button
                    type="button"
                    onClick={() => removeImage(activeImageIndex)}
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Cancelar
                  </button>
                </div>
                
                <ImageCropPolygon 
                  imageFile={imagenes[activeImageIndex].archivo} 
                  onCrop={handleCrop} 
                />
              </div>
            ) : (
              <div className="space-y-4">
                {imagenes[activeImageIndex]?.recortada || imagenes[activeImageIndex]?.esExistente ? (
                  <div className="border rounded-xl overflow-hidden bg-white">
                    <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                      <h5 className="font-medium text-gray-700 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {getImageTypeName(imagenes[activeImageIndex].tipo)} lista
                      </h5>
                      <button
                        type="button"
                        onClick={() => startImageUpload(activeImageIndex)}
                        className="px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Image className="w-4 h-4" />
                        Reemplazar
                      </button>
                    </div>
                    <div className="p-4 flex justify-center">
                      <img 
                        src={imagenes[activeImageIndex].recortada} 
                        alt={`Certificado ${imagenes[activeImageIndex].tipo}`} 
                        className="max-w-full h-auto max-h-[250px] rounded-lg shadow-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div 
                    className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-200 ${
                      imagenes[activeImageIndex].cargando 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                    }`}
                    onDragOver={(e) => handleDragOver(e, activeImageIndex)}
                    onDragLeave={() => handleDragLeave(activeImageIndex)}
                    onDrop={(e) => handleDrop(e, activeImageIndex)}
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="p-3 bg-indigo-100 rounded-full">
                        <Camera className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 mb-1">
                          {getImageTypeName(imagenes[activeImageIndex].tipo)}
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                          {imagenes[activeImageIndex].tipo === 'frontal' 
                            ? 'Foto principal del certificado' 
                            : imagenes[activeImageIndex].tipo === 'trasera'
                            ? 'Dorso o parte posterior del certificado'
                            : 'Imagen adicional relevante'}
                        </p>
                      </div>
                      <label className="cursor-pointer">
                        <div className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          Subir {getImageTypeName(imagenes[activeImageIndex].tipo)}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, activeImageIndex)}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-400 mt-2">
                        Arrastra y suelta una imagen aquí o haz clic para seleccionar
                      </p>
                    </div>
                  </div>
                )}

              <div className="grid grid-cols-3 gap-2 mt-4">
  {imagenes.map((img, index) => (
    <div 
      key={img.id}
      className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
        activeImageIndex === index 
          ? 'border-indigo-500 ring-2 ring-indigo-200' 
          : 'border-gray-200 hover:border-gray-300'
      } ${img.paraEliminar ? 'border-dashed border-red-500' : ''}`}
      onClick={() => {
        setActiveImageIndex(index);
        setShowImageUpload(false);
      }}
    >
      {/* Indicador de eliminación */}
      {img.paraEliminar && (
        <div className="absolute inset-0 bg-red-500/10 z-10 flex items-center justify-center">
          <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
            Se eliminará
          </div>
        </div>
      )}
      
      {/* Indicador de imagen existente */}
      {img.esExistente && !img.paraEliminar && !img.recortada?.startsWith('blob:') && (
        <div className="absolute top-1 left-1 z-10">
          <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
            Existente
          </span>
        </div>
      )}
      
      <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
        {img.recortada ? (
          <>
            <img 
              src={img.recortada} 
              alt="Miniatura" 
              className="w-full h-full object-cover"
            />
            {/* Overlay para imágenes marcadas para eliminar */}
            {img.paraEliminar && (
              <div className="absolute inset-0 bg-red-500/30"></div>
            )}
          </>
        ) : img.esExistente && !img.recortada?.startsWith('blob:') ? (
          <div className="p-3 text-blue-400 relative">
            <FileImage className="w-6 h-6" />
            {/* Icono de check para imágenes existentes */}
            <div className="absolute -top-1 -right-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
          </div>
        ) : (
          <div className="p-3 text-gray-400">
            <FileImage className="w-6 h-6" />
          </div>
        )}
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white font-medium truncate">
            {getImageTypeName(img.tipo)}
            {img.paraEliminar && " 🗑️"}
          </span>
          {(img.recortada || img.esExistente) && !img.paraEliminar && (
            <CheckCircle className="w-3 h-3 text-green-300" />
          )}
          {img.paraEliminar && (
            <X className="w-3 h-3 text-red-300" />
          )}
        </div>
      </div>
      
      {/* Botón de eliminar/restaurar */}
      {(img.recortada || img.esExistente) && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            removeImage(index);
          }}
          className={`absolute top-1 right-1 p-1.5 rounded-full hover:shadow-lg transition-all ${
            img.paraEliminar 
              ? 'bg-green-500 hover:bg-green-600 text-white' 
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
          title={img.paraEliminar ? "Cancelar eliminación" : "Eliminar imagen"}
        >
          {img.paraEliminar ? (
            <span className="text-xs font-bold">↶</span>
          ) : (
            <Trash2 className="w-3 h-3" />
          )}
        </button>
      )}
    </div>
  ))}
</div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-200 -mx-4 sm:-mx-6 px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium flex-1 sm:flex-none order-2 sm:order-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitLoading || !isValid}
                className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 flex-1 sm:flex-auto order-1 sm:order-2 ${
                  submitLoading 
                    ? 'bg-indigo-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {submitLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isEdit ? "Actualizar Certificado" : "Guardar Certificado"}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </LoaderError>
  );
};

export default FormCertificados;