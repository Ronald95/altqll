import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import SelectReact from "react-select";
import { CreditCard, Calendar, Image, User, Save, X, Upload, Camera, FileImage, BookOpen } from "lucide-react";
import LoaderError from "../../../loading/LoaderError";
import CursosAPI from "../../../../api/cursos";
import Input from "../../../form/input/InputField";
import Label from "../../../form/Label";
import ImageCropPolygon from "../../images/ImageCropPolygon";

const FormCursos = ({ isOpen, onClose, data, trabajador, onSuccess }) => {
  const { 
    register, 
    handleSubmit, 
    control, 
    reset, 
    formState: { errors, isValid } 
  } = useForm({
    defaultValues: {
      tipo_curso: null,
      fecha_vigencia: "",
      foto_frontal: null,
      observacion: "",
      predeterminada: false,
    },
    mode: "onChange",
  });

  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);

  const [frontalFile, setFrontalFile] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [showCrop, setShowCrop] = useState(false);

  const isEdit = Boolean(data?.id);

  // Cargar tipos de cursos
  useEffect(() => {
    if (!isOpen) return;
    const fetchTipos = async () => {
      setLoading(true);
      try {
        const response = await CursosAPI.getCategoriasCursosForSelect();
        setTipos(response.data || response);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los tipos de curso.");
      } finally {
        setLoading(false);
      }
    };
    fetchTipos();
  }, [isOpen]);

  // Llenar formulario si estamos editando
  useEffect(() => {
    if (data) {
      reset({
        tipo_curso: data.codigo ? { value: data.codigo, label: data.nombre } : null,
        fecha_vigencia: data.fecha_vigencia || "",
        observacion: data.observacion || "",
        predeterminada: data.predeterminada || false,
      });
      if (data.foto_frontal) setCroppedImage(data.foto_frontal);
    } else {
      reset({
        tipo_curso: null,
        fecha_vigencia: "",
        observacion: "",
        predeterminada: false,
      });
      setFrontalFile(null);
      setCroppedImage(null);
      setShowCrop(false);
    }
  }, [data, reset]);

  const onSubmit = async (formData) => {
    if (!trabajador?.id) return;
    try {
      setSubmitLoading(true);
      const formDataToSend = new FormData();
      formDataToSend.append("trabajador", trabajador.id);
      formDataToSend.append("tipo_curso", formData.tipo_curso?.value);
      formDataToSend.append("fecha_vigencia", formData.fecha_vigencia);
      formDataToSend.append("observacion", formData.observacion || "");
      formDataToSend.append("predeterminada", formData.predeterminada);
      
      if (frontalFile) {
        formDataToSend.append("foto_frontal", frontalFile);
      }

      if (isEdit) {
        await CursosAPI.update(data.id, formDataToSend);
      } else {
        await CursosAPI.create(formDataToSend);
      }
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Error al guardar curso", err);
      setError("Ocurrió un error al guardar.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFrontalFile(file);
      setCroppedImage(null);
      setShowCrop(true);
    }
  };

  const handleCrop = (file) => {
    setCroppedImage(URL.createObjectURL(file));
    setFrontalFile(file);
    setShowCrop(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setFrontalFile(file);
      setCroppedImage(null);
      setShowCrop(true);
    }
  };

  const removeImage = () => {
    if (croppedImage && croppedImage.startsWith('blob:')) {
      URL.revokeObjectURL(croppedImage);
    }
    setFrontalFile(null);
    setCroppedImage(null);
    setShowCrop(false);
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

  if (!trabajador) return null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-gray-700"></div>
        <span className="mt-4 text-gray-600">Cargando tipos de cursos...</span>
      </div>
    );
  }

  return (
    <LoaderError loading={loading} error={error}>
      <div className="relative w-full bg-white overflow-hidden rounded-lg border border-gray-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-5 border-b border-gray-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-gray-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-800">
                {isEdit ? "Actualizar Curso" : "Registrar Nuevo Curso"}
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Trabajador: {trabajador.nombre}
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

          {/* Tipo de Curso */}
          <div className="mb-6">
            <Label className="text-gray-700 font-medium text-sm flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-gray-500" />
              Tipo de Curso <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="tipo_curso"
              control={control}
              rules={{ required: "Seleccione un tipo de curso" }}
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
            {errors.tipo_curso && (
              <p className="mt-1 text-sm text-red-500">{errors.tipo_curso.message}</p>
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

          {/* Foto Frontal */}
          <div className="mb-6">
            <Label className="text-gray-700 font-medium text-sm flex items-center gap-2 mb-2">
              <Image className="w-4 h-4 text-gray-500" />
              Foto Frontal
            </Label>
            
            {showCrop && frontalFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-700 flex items-center gap-2">
                    <FileImage className="w-4 h-4" />
                    Editar imagen
                  </h4>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                </div>
                <ImageCropPolygon imageFile={frontalFile} onCrop={handleCrop} />
              </div>
            ) : croppedImage ? (
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <h5 className="font-medium text-gray-700 flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Imagen lista
                  </h5>
                  <button
                    type="button"
                    onClick={() => setShowCrop(true)}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1"
                  >
                    <Upload className="w-4 h-4" />
                    Reemplazar
                  </button>
                </div>
                <div className="p-4 flex justify-center">
                  <img 
                    src={croppedImage} 
                    alt="Curso" 
                    className="max-w-full h-auto max-h-[250px] rounded-md"
                  />
                </div>
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex justify-end">
                  <button
                    type="button"
                    onClick={removeImage}
                    className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Eliminar imagen
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center transition-all border-gray-300 hover:border-gray-400 hover:bg-gray-50 cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input').click()}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-gray-100 rounded-full">
                    <Camera className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 mb-1">
                      Foto del Curso
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Imagen principal del certificado del curso
                    </p>
                  </div>
                  <label className="cursor-pointer">
                    <div className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors inline-flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Subir imagen
                    </div>
                    <input
                      id="file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-400 mt-2">
                    Arrastra y suelta una imagen aquí o haz clic para seleccionar
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Observación */}
          <div className="mb-6">
            <Label className="text-gray-700 font-medium text-sm flex items-center gap-2 mb-2">
              Observación
            </Label>
            <textarea
              rows={3}
              {...register("observacion")}
              placeholder="Ingrese observaciones o notas adicionales (opcional)"
              className="w-full rounded-md border border-gray-300 focus:border-gray-600 focus:ring-1 focus:ring-gray-400 px-3 py-2 resize-none outline-none text-gray-700"
            />
          </div>

          {/* Predeterminada */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              {...register("predeterminada")}
              className="h-4 w-4 rounded border-gray-300 text-gray-700 focus:ring-gray-500"
            />
            <Label className="text-gray-700 text-sm font-normal cursor-pointer">
              Establecer como curso predeterminado
            </Label>
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
              disabled={submitLoading}
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
                  {isEdit ? "Actualizar Curso" : "Guardar Curso"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </LoaderError>
  );
};

export default FormCursos;