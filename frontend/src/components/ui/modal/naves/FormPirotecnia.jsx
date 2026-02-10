import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import SelectReact from "react-select";
import { Sparkles, Calendar, MessageSquare, Ship, Hash, Flame } from "lucide-react";
import Button from "../../button/Button";
import Label from "../../../form/Label";
import Input from "../../../form/input/InputField";
import LoaderError from "../../../../components/loading/LoaderError";
import PirotecniaNaveAPI from "../../../../api/pirotecniaNave";
import TipoPirotecniaAPI from "../../../../api/tipoPirotecniaNave";
import { useNave } from "../../../../context/NaveContext";

const FormPirotecnia = ({ isOpen, onClose, item, onItemUpdated }) => {
  const { naveSeleccionada } = useNave();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      cantidad: "",
      fecha: "",
      observacion: "",
      tipo: null,
    },
  });

  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    const fetchTipos = async () => {
      try {
        setLoading(true);
        const data = await TipoPirotecniaAPI.getTiposPirotecniaForSelect();
        console.log(data);
        setTipos(data);
      } catch (err) {
        console.error("Error al obtener tipos:", err);
        setError("No se pudieron cargar los tipos de pirotecnia.");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) fetchTipos();
  }, [isOpen]);

  useEffect(() => {
    if (item) {
      reset({
        cantidad: item.cantidad || "",
        fecha: item.fecha ? item.fecha.split("T")[0] : "",
        observacion: item.observacion || "",
        tipo: item.tipo
          ? { value: item.tipo, label: item.tipo_nombre }
          : null,
      });
    } else {
      reset({
        cantidad: "",
        fecha: "",
        observacion: "",
        tipo: null,
      });
    }
  }, [item, reset]);

  const onSubmit = async (formData) => {
    try {
      setSubmitLoading(true);

      const payload = {
        cantidad: parseInt(formData.cantidad),
        fecha: formData.fecha,
        observacion: formData.observacion || "",
        tipo: formData.tipo?.value,
        nave: naveSeleccionada?.id,
      };

      let response;
      if (item?.id) {
        response = await PirotecniaNaveAPI.updatePirotecnia(item.id, payload);
      } else {
        response = await PirotecniaNaveAPI.createPirotecnia(payload);
      }

      const newItem = {
        ...response,
        tipo: formData.tipo?.value,
        tipo_nombre: formData.tipo?.label,
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
      borderColor: state.isFocused ? "#f97316" : "#e5e7eb",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(249, 115, 22, 0.1)" : "none",
      "&:hover": {
        borderColor: "#f97316"
      }
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? "#f97316" : state.isFocused ? "#ffedd5" : "white",
      color: state.isSelected ? "white" : "#111827",
      "&:active": {
        backgroundColor: "#f97316"
      }
    })
  };

  const isEdit = Boolean(item?.id);

  if (!naveSeleccionada) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-gradient-to-br from-slate-50 to-orange-50 rounded-2xl">
        <Ship className="w-16 h-16 text-slate-400 mb-4" />
        <p className="text-lg text-slate-600 font-medium">Debes seleccionar una nave para continuar</p>
      </div>
    );
  }

  return (
    <LoaderError loading={loading} error={error}>
      <div className="relative w-full bg-white overflow-hidden">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-8 py-6 text-white rounded-t-3xl">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8" />
            <h2 className="text-3xl font-bold">
              {isEdit ? "Actualizar Pirotecnia" : "Registrar Pirotecnia"}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-orange-100">
            <Ship className="w-4 h-4" />
            <p className="text-sm">
              Nave: <span className="font-semibold text-white">{naveSeleccionada?.nombre}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 pb-6">
          {/* Sección: Información General */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-orange-600">
              <Flame className="w-5 h-5 text-orange-600" />
              <h3 className="text-xl font-semibold text-gray-800">Información del Registro</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tipo */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  Tipo de Pirotecnia <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="tipo"
                  control={control}
                  rules={{ required: "El tipo es obligatorio" }}
                  render={({ field }) => (
                    <SelectReact
                      {...field}
                      options={tipos}
                      placeholder="Seleccione un tipo..."
                      styles={customStyles}
                      className="react-select-container"
                    />
                  )}
                />
                {errors.tipo && (
                  <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                    <span>⚠</span> {errors.tipo.message}
                  </p>
                )}
              </div>

              {/* Cantidad */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Hash className="w-4 h-4 text-orange-600" />
                  Cantidad <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  placeholder="Ingrese la cantidad"
                  {...register("cantidad", {
                    required: "La cantidad es obligatoria",
                    min: { value: 1, message: "La cantidad mínima es 1" },
                  })}
                  className="w-full"
                />
                {errors.cantidad && (
                  <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                    <span>⚠</span> {errors.cantidad.message}
                  </p>
                )}
              </div>

              {/* Fecha */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  Fecha de Expiración <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  {...register("fecha", { required: "La fecha es obligatoria" })}
                  className="w-full"
                />
                {errors.fecha && (
                  <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                    <span>⚠</span> {errors.fecha.message}
                  </p>
                )}
              </div>

              {/* Observación */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium">
                  <MessageSquare className="w-4 h-4 text-orange-600" />
                  Observaciones
                </Label>
                <Input
                  type="text"
                  placeholder="Ingrese observaciones adicionales (opcional)"
                  {...register("observacion")}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-6 pb-2 border-t-2 border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={submitLoading}
              className="px-6 py-3 font-medium"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={submitLoading}
              className="px-6 py-3 font-medium bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              {submitLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Guardando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {isEdit ? "Actualizar" : "Guardar"}
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </LoaderError>
  );
};

export default FormPirotecnia;