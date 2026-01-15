import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import SelectReact from "react-select";
import {
  Sparkles,
  Users,
  User,
  CreditCard,
  Briefcase,
  Mail,
  Phone,
  MessageSquare,
  X,
} from "lucide-react";
import LoaderError from "../../../loading/LoaderError";
import TrabajadoresAPI from "../../../../api/trabajadores";
import CargosApi from "../../../../api/cargos";
import Input from "../../../form/input/InputField";
import Label from "../../../form/Label";

const FormTrabajadores = ({ isOpen, onClose, item, onItemUpdated }) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nombre: "",
      rut: "",
      cargo: null,
      correo: "",
      telefono: "",
      observacion: "",
    },
    mode: "onChange", // evita validaciones prematuras
  });

  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Fetch cargos cuando el modal se abre
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const tiposList = await CargosApi.getCargosForSelect();
        setTipos(tiposList);
      } catch (err) {
        console.error("Error al cargar cargos:", err);
        setError("No se pudieron cargar los cargos.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen]);


  useEffect(() => {
    console.log("item", item);
    if (item) {
      reset({
        nombre: item.nombre || "",
        rut: item.rut || "",
        cargo: item.cargo_data
          ? { value: item.cargo_data.id, label: item.cargo_data.nombre }
          : null,
        correo: item.correo || "",
        telefono: item.telefono || "",
        observacion: item.observacion || "",
      });
    } else {
      reset({
        nombre: "",
        rut: "",
        cargo: null,
        correo: "",
        telefono: "",
        observacion: "",
      });
    }
  }, [item, reset]);

  const onSubmit = async (formData) => {
    try {
      setSubmitLoading(true);

      const payload = {
        nombre: formData.nombre,
        rut: formData.rut,
        cargo: formData.cargo?.value || formData.cargo,
        correo: formData.correo,
        telefono: formData.telefono,
        observacion: formData.observacion || "",
      };

      let response;
      if (item?.id) {
        response = await TrabajadoresAPI.updateTrabajador(item.id, payload);
      } else {
        response = await TrabajadoresAPI.createTrabajador(payload);
      }

      const newItem = {
        ...response,
        id: item?.id ?? response?.id,
        isUpdated: !!item,
        isNew: !item,
      };

      onItemUpdated(newItem);
      onClose();
    } catch (err) {
      console.error("❌ Error al guardar:", err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "2.75rem",
      borderColor: state.isFocused ? "#22c55e" : "#e5e7eb",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(34, 197, 94, 0.1)" : "none",
      borderRadius: "0.75rem",
      borderWidth: "2px",
      "&:hover": { borderColor: "#22c55e" },
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#22c55e"
        : state.isFocused
        ? "#dcfce7"
        : "white",
      color: state.isSelected ? "white" : "#111827",
      "&:active": { backgroundColor: "#22c55e" },
    }),
  };

  const isEdit = Boolean(item?.id);

  return (
    <LoaderError loading={loading} error={error}>
      <div className="relative w-full bg-white overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 px-8 py-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">
                {isEdit ? "Actualizar Trabajador" : "Registrar Nuevo Trabajador"}
              </h2>
              <p className="text-green-100 text-sm mt-1">
                Complete los datos del trabajador
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 pb-6">
          {/* Información Personal */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-5 pb-2 border-b-2 border-green-600">
              <User className="w-5 h-5 text-green-600" />
              <h3 className="text-xl font-semibold text-gray-800">Información Personal</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Nombre */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                  <User className="w-4 h-4 text-green-600" />
                  Nombre Completo <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Ingrese el nombre completo"
                  {...register("nombre", {
                    required: "El nombre es obligatorio",
                    minLength: { value: 3, message: "El nombre debe tener al menos 3 caracteres" },
                  })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                />
                {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
              </div>

              {/* RUT */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                  <CreditCard className="w-4 h-4 text-green-600" />
                  RUT <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="12.345.678-9"
                  {...register("rut", { required: "El RUT es obligatorio" })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                />
                {errors.rut && <p className="text-red-500 text-sm mt-1">{errors.rut.message}</p>}
              </div>
            </div>
          </div>

          {/* Información Laboral */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-5 pb-2 border-b-2 border-green-600">
              <Briefcase className="w-5 h-5 text-green-600" />
              <h3 className="text-xl font-semibold text-gray-800">Información Laboral</h3>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                  <Briefcase className="w-4 h-4 text-green-600" />
                  Cargo <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="cargo"
                  control={control}
                  rules={{ required: "El cargo es obligatorio" }}
                  render={({ field }) => (
                    <SelectReact
                      {...field}
                      options={tipos}
                      placeholder="Seleccione un cargo..."
                      styles={customStyles}
                      className="react-select-container"
                      isClearable
                    />
                  )}
                />
                {errors.cargo && <p className="text-red-500 text-sm mt-1">{errors.cargo.message}</p>}
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-5 pb-2 border-b-2 border-green-600">
              <Mail className="w-5 h-5 text-green-600" />
              <h3 className="text-xl font-semibold text-gray-800">Información de Contacto</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                  <Mail className="w-4 h-4 text-green-600" />
                  Correo Electrónico
                </Label>
                <Input
                  placeholder="correo@ejemplo.com"
                  {...register("correo", {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Formato de correo inválido",
                    },
                  })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                />
                {errors.correo && <p className="text-red-500 text-sm mt-1">{errors.correo.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                  <Phone className="w-4 h-4 text-green-600" />
                  Teléfono
                </Label>
                <Input
                  type="telefono"
                  placeholder="912345678"
                  {...register("telefono", {
                    pattern: { value: /^[0-9]{9}$/, message: "Formato de teléfono inválido" },
                  })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                />
                {errors.telefono && <p className="text-red-500 text-sm mt-1">{errors.telefono.message}</p>}
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-5 pb-2 border-b-2 border-green-600">
              <MessageSquare className="w-5 h-5 text-green-600" />
              <h3 className="text-xl font-semibold text-gray-800">Observaciones</h3>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                <MessageSquare className="w-4 h-4 text-green-600" />
                Observaciones Adicionales
              </Label>
              <textarea
                placeholder="Ingrese observaciones o notas adicionales (opcional)"
                {...register("observacion")}
                rows={4}
                className="w-full rounded-xl border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all px-4 py-3 text-gray-700 resize-none outline-none"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-6 pb-2 border-t-2 border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitLoading}
              className="px-6 py-3 font-medium rounded-xl border-2 border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-6 py-3 font-medium bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Guardando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {isEdit ? "Actualizar Trabajador" : "Guardar Trabajador"}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </LoaderError>
  );
};

export default FormTrabajadores;
