import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import SelectReact from "react-select";
import { CreditCard, Image, Calendar, MessageSquare } from "lucide-react";
import LoaderError from "../../../loading/LoaderError";
import EspecialidadesAPI from "../../../../api/especialidades";
import Input from "../../../form/input/InputField";
import Label from "../../../form/Label";
import ImageCropPolygon from "../../images/ImageCropPolygon";

const FormEspecialidad = ({ isOpen, onClose, data, trabajador, onSuccess }) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      tipo_especialidad: null,
      fecha_vigencia: "",
      foto_frontal: null,
      foto_trasera: null,
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

  const isEdit = Boolean(data?.id);

  // Cargar tipos de especialidad
  useEffect(() => {
    if (!isOpen) return;

    const fetchTipos = async () => {
      setLoading(true);
      try {
        const response = await EspecialidadesAPI.getCategoriasEspecialidadesForSelect();
        setTipos(response);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los tipos de especialidad.");
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
        tipo_especialidad: data.codigo
          ? { value: data.codigo, label: data.nombre }
          : null,
        fecha_vigencia: data.fecha_vigencia || "",
        observacion: data.observacion || "",
        predeterminada: data.predeterminada || false,
      });
      if (data.foto_frontal) setCroppedImage(data.foto_frontal);
    } else {
      reset({
        tipo_especialidad: null,
        fecha_vigencia: "",
        observacion: "",
        predeterminada: false,
      });
      setFrontalFile(null);
      setCroppedImage(null);
    }
  }, [data, reset]);

  const onSubmit = async (formData) => {
    if (!trabajador?.id) return;

    try {
      setSubmitLoading(true);

      const payload = new FormData();
      payload.append("trabajador", trabajador.id);
      payload.append("tipo_especialidad", formData.tipo_especialidad?.value);
      payload.append("fecha_vigencia", formData.fecha_vigencia);
      payload.append("observacion", formData.observacion || "");      
      payload.append("predeterminada", formData.predeterminada);

      if (frontalFile) payload.append("foto_frontal", frontalFile);

      if (isEdit) {
        await EspecialidadesAPI.update(data.id, payload);
      } else {
        await EspecialidadesAPI.create(payload);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Error al guardar especialidad", err);
      setError("Ocurrió un error al guardar.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCrop = (file) => {
    setCroppedImage(URL.createObjectURL(file));
    setFrontalFile(file);
  };

  // Estilos para SelectReact - Diseño corporativo
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

  return (
    <LoaderError loading={loading} error={error}>
      <div className="relative w-full bg-white overflow-hidden rounded-lg border border-gray-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gray-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                {isEdit ? "Actualizar Especialidad" : "Registrar Nueva Especialidad"}
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Trabajador: {trabajador.nombre}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {/* Tipo de Especialidad */}
          <div className="mb-6">
            <Label className="text-gray-700 font-medium text-sm flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-gray-500" />
              Tipo de Especialidad <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="tipo_especialidad"
              control={control}
              rules={{ required: "Seleccione un tipo de especialidad" }}
              render={({ field }) => (
                <SelectReact
                  {...field}
                  options={tipos}
                  placeholder="Seleccione un tipo..."
                  styles={customStyles}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              )}
            />
            {errors.tipo_especialidad && (
              <p className="text-red-500 text-sm mt-1">{errors.tipo_especialidad.message}</p>
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
              {...register("fecha_vigencia", { required: "La fecha de vigencia es obligatoria" })}
              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-gray-600 focus:ring-1 focus:ring-gray-400 outline-none"
            />
            {errors.fecha_vigencia && (
              <p className="text-red-500 text-sm mt-1">{errors.fecha_vigencia.message}</p>
            )}
          </div>

          {/* Foto Frontal */}
          <div className="mb-6">
            <Label className="text-gray-700 font-medium text-sm flex items-center gap-2 mb-2">
              <Image className="w-4 h-4 text-gray-500" />
              Foto Frontal
            </Label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files[0]) {
                  setFrontalFile(e.target.files[0]);
                  setCroppedImage(null);
                }
              }}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 cursor-pointer"
            />
            {frontalFile && (
              <div className="mt-4">
                <ImageCropPolygon imageFile={frontalFile} onCrop={handleCrop} />
              </div>
            )}
            {croppedImage && (
              <div className="mt-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
                <p className="text-sm font-medium text-gray-700 mb-2">Vista previa:</p>
                <img src={croppedImage} alt="Recortada" className="max-w-full h-auto rounded-md" />
              </div>
            )}
          </div>

          {/* Observación */}
          <div className="mb-6">
            <Label className="text-gray-700 font-medium text-sm flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-gray-500" />
              Observación
            </Label>
            <textarea
              rows={4}
              {...register("observacion")}
              placeholder="Ingrese observaciones o notas adicionales (opcional)"
              className="w-full rounded-md border border-gray-300 focus:border-gray-600 focus:ring-1 focus:ring-gray-400 px-3 py-2 resize-none outline-none text-gray-700"
            />
          </div>

          {/* Predeterminada */}
          <div className="mb-6 flex items-center gap-3">
            <input
              type="checkbox"
              {...register("predeterminada")}
              className="h-4 w-4 rounded border-gray-300 text-gray-700 focus:ring-gray-500"
            />
            <Label className="text-gray-700 text-sm font-normal cursor-pointer">
              Establecer como especialidad predeterminada
            </Label>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-300">
            <button
              type="button"
              onClick={onClose}
              disabled={submitLoading}
              className="px-5 py-2 font-medium rounded-md border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-5 py-2 font-medium bg-gray-700 hover:bg-gray-800 text-white rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitLoading ? "Guardando..." : isEdit ? "Actualizar Especialidad" : "Guardar Especialidad"}
            </button>
          </div>
        </form>
      </div>
    </LoaderError>
  );
};

export default FormEspecialidad;