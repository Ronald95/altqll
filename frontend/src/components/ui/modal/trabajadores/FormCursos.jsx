import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import SelectReact from "react-select";
import {
  CreditCard,
  Calendar,
} from "lucide-react";
import LoaderError from "../../../loading/LoaderError";
import CursosAPI from "../../../../api/cursos";
import Input from "../../../form/input/InputField";
import Label from "../../../form/Label";

const FormCursos = ({ isOpen, onClose, item, trabajador }) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      tipo_matricula: null,
      fecha_vigencia: "",
      foto_frontal: null,
      foto_trasera: null,
      observacion: "",
      predeterminada: false,
    },
    mode: "onChange",
  });
 if (!item) return null;
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);

  const [frontalFile, setFrontalFile] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);



    // Cargar tipos de matrícula
    useEffect(() => {
      if (!isOpen) return;
  
      const fetchTipos = async () => {
        setLoading(true);
        try {
          const data = await CursosAPI.getCategoriasCursosForSelect();
          setTipos(data);
        } catch (err) {
          console.error(err);
          setError("No se pudieron cargar los tipos de matrícula.");
        } finally {
          setLoading(false);
        }
      };
  
      fetchTipos();
    }, [isOpen]);

  // Editar matrícula
  useEffect(() => {
    if (item) {
      reset({
        tipo_matricula: item.tipo_data
          ? { value: item.tipo_data.id, label: item.tipo_data.nombre }
          : null,
        fecha_vigencia: item.fecha_vigencia || "",
        observacion: item.observacion || "",
        predeterminada: item.predeterminada || false,
      });
    } else {
      reset();
    }
  }, [item, reset]);

  const onSubmit = async (data) => {
    try {
      setSubmitLoading(true);

      const formData = new FormData();
      formData.append("trabajador", trabajador.id);
      formData.append("tipo_matricula", data.tipo_matricula?.value);
      formData.append("fecha_vigencia", data.fecha_vigencia);
      formData.append("observacion", data.observacion || "");
      formData.append("predeterminada", data.predeterminada);

      if (data.foto_frontal?.[0])
        formData.append("foto_frontal", data.foto_frontal[0]);

      if (data.foto_trasera?.[0])
        formData.append("foto_trasera", data.foto_trasera[0]);

      if (item?.id) {
        await CursosAPI.update(item.id, formData);
      } else {
        await CursosAPI.create(formData);
      }

      onClose();
    } catch (err) {
      console.error("Error al guardar matrícula", err);
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

  const isEdit = Boolean(item?.id);

  return (
    <LoaderError loading={loading} error={error}>
      <div className="bg-white">
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4 text-white rounded-t-xl">
          <h2 className="text-2xl font-bold">
            {isEdit ? "Actualizar Curso" : "Nuevo Curso"}
          </h2>
          <p className="text-indigo-100 text-sm">
            Trabajador: {trabajador?.nombre}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Tipo matrícula */}
          <div>
            <Label className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Tipo de Curso *
            </Label>
            <Controller
              name="tipo_matricula"
              control={control}
              rules={{ required: "Seleccione un tipo" }}
              render={({ field }) => (
                <SelectReact
                  {...field}
                  options={tipos}
                  placeholder="Seleccione..."
                  styles={customStyles}
                />
              )}
            />
            {errors.tipo_matricula && (
              <p className="text-red-500 text-sm">{errors.tipo_matricula.message}</p>
            )}
          </div>

          {/* Fecha vigencia */}
          <div>
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Fecha de Vigencia *
            </Label>
            <Input
              type="date"
              {...register("fecha_vigencia", {
                required: "La fecha es obligatoria",
              })}
            />
          </div>
          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-xl"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={submitLoading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-xl"
            >
              {submitLoading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </LoaderError>
  );
};

export default FormCursos;

 
