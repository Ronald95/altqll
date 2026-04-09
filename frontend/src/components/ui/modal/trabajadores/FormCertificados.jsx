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

const FormCertificados = ({ isOpen, onClose, trabajador, data, onSuccess }) => {
  const initialFormValues = {
    categoria_id: null,
    fecha_vigencia: "",
  };

  const [imagenes, setImagenes] = useState([
    { id: 1, tipo: "frontal", archivo: null, recortada: null, cargando: false, esExistente: false, paraEliminar: false },
    { id: 2, tipo: "trasera", archivo: null, recortada: null, cargando: false, esExistente: false, paraEliminar: false },
    { id: 3, tipo: "extra", archivo: null, recortada: null, cargando: false, esExistente: false, paraEliminar: false }
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

  useEffect(() => {
    if (!data) {
      reset(initialFormValues);
      setImagenes([
        { id: 1, tipo: "frontal", archivo: null, recortada: null, cargando: false, esExistente: false, paraEliminar: false },
        { id: 2, tipo: "trasera", archivo: null, recortada: null, cargando: false, esExistente: false, paraEliminar: false },
        { id: 3, tipo: "extra", archivo: null, recortada: null, cargando: false, esExistente: false, paraEliminar: false }
      ]);
      setShowImageUpload(false);
      return;
    }

    reset({
      categoria_id: data.categoria?.id
        ? { value: data.categoria.id, label: data.categoria.nombre }
        : null,
      fecha_vigencia: data.fecha_vigencia || "",
    });

    if (data.imagenes && data.imagenes.length > 0) {
      const nuevasImagenes = [
        { id: 1, tipo: "frontal", archivo: null, recortada: null, cargando: false, esExistente: false, paraEliminar: false },
        { id: 2, tipo: "trasera", archivo: null, recortada: null, cargando: false, esExistente: false, paraEliminar: false },
        { id: 3, tipo: "extra", archivo: null, recortada: null, cargando: false, esExistente: false, paraEliminar: false }
      ];
      
      data.imagenes.forEach(img => {
        const index = nuevasImagenes.findIndex(i => i.tipo === img.tipo);
        if (index !== -1) {
          nuevasImagenes[index] = {
            ...nuevasImagenes[index],
            recortada: img.imagen,
            esExistente: true,
            imagenId: img.id,
            paraEliminar: false
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
      
      for (const img of imagenes) {
        if (img.paraEliminar && img.esExistente) {
          formData.append(`eliminar_${img.tipo}`, 'true');
        } 
        else if (img.archivo) {
          formData.append(`foto_${img.tipo}`, img.archivo);
        } 
        else if (img.recortada && img.recortada.startsWith('blob:')) {
          const response = await fetch(img.recortada);
          const blob = await response.blob();
          const file = new File([blob], `foto_${img.tipo}.png`, { type: 'image/png' });
          formData.append(`foto_${img.tipo}`, file);
        } 
        else if (img.esExistente && !img.paraEliminar) {
          formData.append(`mantener_${img.tipo}`, 'true');
        }
      }

      if (isEdit) {
        await CertificadosAPI.update(data.id, formData);
      } else {
        await CertificadosAPI.create(formData);
      }

      if (onSuccess) onSuccess();
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
        }
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
    nuevasImagenes[activeImageIndex].paraEliminar = false;
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
      nuevasImagenes[index].paraEliminar = false;
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
      nuevasImagenes[index].paraEliminar = false;
      setImagenes(nuevasImagenes);
      setActiveImageIndex(index);
      setShowImageUpload(true);
    }
  };

  const removeImage = (index) => {
    const nuevasImagenes = [...imagenes];
    const imgActual = imagenes[index];
    
    if (imgActual.paraEliminar) {
      nuevasImagenes[index] = {
        ...imgActual,
        paraEliminar: false
      };
    } 
    else if (imgActual.esExistente) {
      nuevasImagenes[index] = {
        ...imgActual,
        paraEliminar: true
      };
    }
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
    }
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
    }
    
    setImagenes(nuevasImagenes);
    
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
      frontal: "bg-gray-100 text-gray-700 border-gray-200",
      trasera: "bg-gray-100 text-gray-700 border-gray-200",
      extra: "bg-gray-100 text-gray-700 border-gray-200"
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "2.75rem",
      borderColor: state.isFocused ? "#4b5563" : "#d1d5db",
      borderWidth: "1px",
      borderRadius: "0.5rem",
      boxShadow: state.isFocused ? "0 0 0 1px #4b5563" : "none",
      "&:hover": {
        borderColor: "#9ca3af",
      },
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? "#f3f4f6" : "white",
      color: "#1f2937",
      "&:active": {
        backgroundColor: "#e5e7eb",
      },
    }),
  };

  if (loadingTipos) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-gray-700"></div>
        <span className="mt-4 text-gray-600">Cargando tipos de certificados...</span>
      </div>
    );
  }

  return (
    <LoaderError loading={loadingTipos} error={error}>
      <div className="relative w-full bg-white overflow-hidden rounded-lg border border-gray-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-5 border-b border-gray-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Layers className="w-6 h-6 text-gray-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-800">
                {isEdit ? "Actualizar Certificado" : "Registrar Nuevo Certificado"}
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Trabajador: {trabajador?.nombre}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Formulario - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Información del Trabajador */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-gray-600" />
              <h3 className="font-medium text-gray-800">Información del Trabajador</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Nombre</p>
                <p className="font-medium text-gray-900">{trabajador?.nombre || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">RUT</p>
                <p className="font-medium text-gray-900">{trabajador?.rut || "—"}</p>
              </div>
            </div>
          </div>

          {/* Tipo de Certificado */}
          <div className="mb-6">
            <Label className="text-gray-700 font-medium text-sm flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-gray-500" />
              Tipo de Certificado <span className="text-red-500">*</span>
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
                  isClearable
                />
              )}
            />
            {errors.categoria_id && (
              <p className="mt-1 text-sm text-red-500">{errors.categoria_id.message}</p>
            )}
          </div>

          {/* Fecha de Vigencia */}
          <div className="mb-6">
            <Label className="text-gray-700 font-medium text-sm flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              Fecha de Vigencia <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              {...register("fecha_vigencia", { 
                required: "La fecha de vigencia es obligatoria"
              })}
              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-gray-600 focus:ring-1 focus:ring-gray-400 outline-none"
            />
            {errors.fecha_vigencia && (
              <p className="mt-1 text-sm text-red-500">{errors.fecha_vigencia.message}</p>
            )}
          </div>

          {/* Fotografías */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-gray-700 font-medium text-sm flex items-center gap-2">
                <Image className="w-4 h-4 text-gray-500" />
                Fotografías del Certificado
              </Label>
              <span className="text-xs text-gray-500">
                {imagenes.filter(img => img.recortada || img.esExistente).length}/3
              </span>
            </div>
            
            {/* Pestañas de tipos de imagen */}
            <div className="flex flex-wrap gap-2 mb-4">
              {imagenes.map((img, index) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => {
                    setActiveImageIndex(index);
                    setShowImageUpload(false);
                  }}
                  className={`px-4 py-2 rounded-md border transition-all flex items-center gap-2 text-sm ${
                    activeImageIndex === index 
                      ? 'bg-gray-100 border-gray-400 text-gray-800 font-medium' 
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <FileImage className="w-4 h-4" />
                  <span>{getImageTypeName(img.tipo)}</span>
                  {(img.recortada || img.esExistente) && !img.paraEliminar && (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  )}
                  {img.paraEliminar && (
                    <span className="text-xs text-red-500">(eliminar)</span>
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
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors flex items-center gap-1"
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
              <div>
                {imagenes[activeImageIndex]?.recortada || imagenes[activeImageIndex]?.esExistente ? (
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                      <h5 className="font-medium text-gray-700 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {getImageTypeName(imagenes[activeImageIndex].tipo)} lista
                      </h5>
                      <button
                        type="button"
                        onClick={() => startImageUpload(activeImageIndex)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1"
                      >
                        <Image className="w-4 h-4" />
                        Reemplazar
                      </button>
                    </div>
                    <div className="p-4 flex justify-center">
                      <img 
                        src={imagenes[activeImageIndex].recortada} 
                        alt={`Certificado ${imagenes[activeImageIndex].tipo}`} 
                        className="max-w-full h-auto max-h-[250px] rounded-md"
                      />
                    </div>
                  </div>
                ) : (
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                      imagenes[activeImageIndex].cargando 
                        ? 'border-gray-400 bg-gray-50' 
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                    onDragOver={(e) => handleDragOver(e, activeImageIndex)}
                    onDragLeave={() => handleDragLeave(activeImageIndex)}
                    onDrop={(e) => handleDrop(e, activeImageIndex)}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-gray-100 rounded-full">
                        <Camera className="w-6 h-6 text-gray-600" />
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
                        <div className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors inline-flex items-center gap-2">
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

                {/* Miniaturas */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {imagenes.map((img, index) => (
                    <div 
                      key={img.id}
                      className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                        activeImageIndex === index 
                          ? 'border-gray-600 ring-1 ring-gray-400' 
                          : 'border-gray-200 hover:border-gray-300'
                      } ${img.paraEliminar ? 'border-red-300 bg-red-50' : ''}`}
                      onClick={() => {
                        setActiveImageIndex(index);
                        setShowImageUpload(false);
                      }}
                    >
                      <div className="aspect-square bg-gray-50 flex items-center justify-center relative">
                        {img.recortada ? (
                          <img 
                            src={img.recortada} 
                            alt="Miniatura" 
                            className="w-full h-full object-cover"
                          />
                        ) : img.esExistente && !img.recortada?.startsWith('blob:') ? (
                          <div className="p-3 text-gray-400">
                            <FileImage className="w-6 h-6" />
                          </div>
                        ) : (
                          <div className="p-3 text-gray-400">
                            <FileImage className="w-6 h-6" />
                          </div>
                        )}
                        {img.paraEliminar && (
                          <div className="absolute inset-0 bg-red-100/60 flex items-center justify-center">
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">Eliminar</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                        <span className="text-xs text-white font-medium">
                          {getImageTypeName(img.tipo)}
                        </span>
                      </div>
                      {(img.recortada || img.esExistente) && !img.paraEliminar && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(index);
                          }}
                          className="absolute top-1 right-1 p-1.5 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                      {img.paraEliminar && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(index);
                          }}
                          className="absolute top-1 right-1 p-1.5 bg-green-500 hover:bg-green-600 rounded-full text-white transition-colors text-xs font-bold"
                        >
                          ↶
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-300 bg-white">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitLoading}
              className="px-5 py-2 font-medium rounded-md border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              disabled={submitLoading || !isValid}
              className="px-5 py-2 font-medium bg-gray-700 hover:bg-gray-800 text-white rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
      </div>
    </LoaderError>
  );
};

export default FormCertificados;