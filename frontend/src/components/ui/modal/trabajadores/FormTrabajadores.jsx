import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Users,
  User,
  CreditCard,
  Mail,
  Phone,
  MessageSquare,
} from "lucide-react";
import LoaderError from "../../../loading/LoaderError";
import TrabajadoresAPI from "../../../../api/trabajadores";
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
    mode: "onChange",
  });

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);

  const isEdit = Boolean(item?.id);

  useEffect(() => {
    if (item) {
      reset({
        nombre: item.nombre || "",
        rut: item.rut || "",
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
      setError("Error guardando trabajador");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <LoaderError loading={loading} error={error}>
      <div className="relative w-full bg-white overflow-hidden rounded-lg border border-gray-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-300">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-gray-700" />
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                {isEdit ? "Actualizar Trabajador" : "Registrar Nuevo Trabajador"}
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Complete los datos del trabajador
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {/* Información Personal */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4 pb-1 border-b border-gray-300">
              <User className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-800">Información Personal</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 font-medium text-sm">
                  Nombre Completo <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Ingrese el nombre completo"
                  {...register("nombre", {
                    required: "El nombre es obligatorio",
                    minLength: { value: 3, message: "El nombre debe tener al menos 3 caracteres" },
                  })}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-gray-600 focus:ring-1 focus:ring-gray-400 outline-none"
                />
                {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
              </div>
              <div>
                <Label className="text-gray-700 font-medium text-sm">
                  RUT <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="12.345.678-9"
                  {...register("rut", { required: "El RUT es obligatorio" })}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-gray-600 focus:ring-1 focus:ring-gray-400 outline-none"
                />
                {errors.rut && <p className="text-red-500 text-sm mt-1">{errors.rut.message}</p>}
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4 pb-1 border-b border-gray-300">
              <Mail className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-800">Información de Contacto</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 font-medium text-sm">Correo Electrónico</Label>
                <Input
                  placeholder="correo@ejemplo.com"
                  {...register("correo", {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Formato de correo inválido",
                    },
                  })}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-gray-600 focus:ring-1 focus:ring-gray-400 outline-none"
                />
                {errors.correo && <p className="text-red-500 text-sm mt-1">{errors.correo.message}</p>}
              </div>
              <div>
                <Label className="text-gray-700 font-medium text-sm">Teléfono</Label>
                <Input
                  type="tel"
                  placeholder="912345678"
                  {...register("telefono", {
                    pattern: { value: /^[0-9]{9}$/, message: "Formato de teléfono inválido" },
                  })}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-gray-600 focus:ring-1 focus:ring-gray-400 outline-none"
                />
                {errors.telefono && <p className="text-red-500 text-sm mt-1">{errors.telefono.message}</p>}
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4 pb-1 border-b border-gray-300">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-800">Observaciones</h3>
            </div>
            <textarea
              placeholder="Ingrese observaciones o notas adicionales (opcional)"
              {...register("observacion")}
              rows={4}
              className="w-full rounded-md border border-gray-300 focus:border-gray-600 focus:ring-1 focus:ring-gray-400 px-3 py-2 resize-none outline-none text-gray-700"
            />
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
              {submitLoading ? "Guardando..." : isEdit ? "Actualizar Trabajador" : "Guardar Trabajador"}
            </button>
          </div>
        </form>
      </div>
    </LoaderError>
  );
};

export default FormTrabajadores;