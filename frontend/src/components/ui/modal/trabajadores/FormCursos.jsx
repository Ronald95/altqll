import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import SelectReact from "react-select";
import { CreditCard, Calendar, Image } from "lucide-react";
import LoaderError from "../../../loading/LoaderError";
import CursosAPI from "../../../../api/cursos";
import Input from "../../../form/input/InputField";
import Label from "../../../form/Label";
import ImageCropPolygon from "../../images/ImageCropPolygon";

const FormCursos = ({ isOpen, onClose, data, trabajador }) => {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
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

  const isEdit = Boolean(data?.id);

  // Cargar tipos de cursos
  useEffect(() => {
    if (!isOpen) return;
    const fetchTipos = async () => {
      setLoading(true);
      try {
        const response = await CursosAPI.getCategoriasCursosForSelect();
        setTipos(response.data);
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
      reset();
      setFrontalFile(null);
      setCroppedImage(null);
    }
  }, [data, reset]);

  const onSubmit = async (data) => {
    if (!trabajador?.id) return;
    try {
      setSubmitLoading(true);
      const formData = new FormData();
      formData.append("trabajador", trabajador.id);
      formData.append("tipo_curso", data.tipo_curso?.value);
      formData.append("fecha_vigencia", data.fecha_vigencia);
      formData.append("observacion", data.observacion || "");
      formData.append("predeterminada", data.predeterminada);
      if (frontalFile) formData.append("foto_frontal", frontalFile);

      if (isEdit) {
        await CursosAPI.update(data.id, formData);
      } else {
        await CursosAPI.create(formData);
      }
      onClose();
    } catch (err) {
      console.error("Error al guardar curso", err);
      setError("Ocurrió un error al guardar.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCrop = (file) => {
    setCroppedImage(URL.createObjectURL(file));
    setFrontalFile(file);
  };

  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "2.75rem",
      borderColor: state.isFocused ? "#6366f1" : "#e5e7eb",
      borderRadius: "0.75rem",
      borderWidth: "2px",
    }),
  };

  if (!trabajador) return null;

  return (
    <LoaderError loading={loading} error={error}>
      <div className="bg-white rounded-xl overflow-hidden">
        <div className="bg-indigo-600 px-6 py-4 text-white">
          <h2 className="text-2xl font-bold">{isEdit ? "Actualizar Curso" : "Nuevo Curso"}</h2>
          <p className="text-indigo-100 text-sm">Trabajador: {trabajador.nombre}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div>
            <Label className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Tipo de Curso *
            </Label>
            <Controller
              name="tipo_curso"
              control={control}
              rules={{ required: "Seleccione un tipo" }}
              render={({ field }) => (
                <SelectReact {...field} options={tipos} placeholder="Seleccione..." styles={customStyles} />
              )}
            />
            {errors.tipo_curso && <p className="text-red-500 text-sm">{errors.tipo_curso.message}</p>}
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Fecha de Vigencia *
            </Label>
            <Input
              type="date"
              {...register("fecha_vigencia", { required: "La fecha es obligatoria" })}
            />
          </div>

          <div className="grid grid-cols-6 md:grid-cols-1 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Foto Frontal
              </Label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => { setFrontalFile(e.target.files[0]); setCroppedImage(null); }}
                className="border p-2 rounded"
              />
              {frontalFile && <ImageCropPolygon imageFile={frontalFile} onCrop={handleCrop} />}
              {croppedImage && (
                <div className="mt-4 border p-4 rounded bg-gray-50">
                  <h2 className="font-bold mb-2">Imagen Recortada:</h2>
                  <img src={croppedImage} alt="Recortada" className="max-w-full" />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-xl">Cancelar</button>
            <button type="submit" disabled={submitLoading} className="px-6 py-2 bg-indigo-600 text-white rounded-xl">
              {submitLoading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </LoaderError>
  );
};

export default FormCursos;
