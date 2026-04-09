import React, { useEffect, useState } from "react";
import { Controller, useForm, useFieldArray } from "react-hook-form";
import SelectReact from "react-select";
import { FileText, Calendar, MessageSquare, Upload, Plus, Trash2, Ship, Package, Weight, Hash, FileCheck } from "lucide-react";
import Button from "../../button/Button";
import Label from "../../../form/Label";
import Input from "../../../form/input/InputField";
import LoaderError from "../../../loading/LoaderError";
import EstudioNaveAPI from "../../../../api/estudioNave";
import { useNave } from "../../../../context/NaveContext";
import TipoEstudioNaveAPI from "../../../../api/tipoEstudioNave";

const FormEstudios = ({ isOpen, onClose, item, onItemUpdated }) => {
  const { naveSeleccionada } = useNave();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      tipo_id: null,
      fecha_aprobacion: "",
      observacion: "",
      archivo_pdf: null,
      detalles: [
        { nombre: "", cantidad: 1, descripcion: "", peso_total_tons: "" },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "detalles",
  });

  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    const fetchTipos = async () => {
      try {
        const data = await TipoEstudioNaveAPI.getTiposEstudioForSelect();
        setTipos(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) fetchTipos();
  }, [isOpen]);

  useEffect(() => {
    if (item?.id) {
      reset({
        tipo_id: item.tipo_id
          ? { value: item.tipo_id, label: item.tipo_nombre }
          : null,
        fecha_aprobacion: item.fecha_aprobacion || "",
        observacion: item.observacion || "",
        archivo_pdf: null,
        detalles: item.detalles?.length
          ? item.detalles.map((d) => ({
              nombre: d.nombre,
              cantidad: d.cantidad,
              descripcion: d.descripcion,
              peso_total_tons: d.peso_total_tons,
            }))
          : [],
      });
    }
  }, [item, reset]);

  const onSubmit = async (data) => {
    try {
      setSubmitLoading(true);

      const formData = new FormData();
      formData.append("tipo_id", data.tipo_id?.value);
      formData.append("fecha_aprobacion", data.fecha_aprobacion);
      formData.append("observacion", data.observacion);
      formData.append("nave_id", naveSeleccionada.id || "");

      if (data.archivo_pdf?.[0]) {
        formData.append("archivo_pdf", data.archivo_pdf[0]);
      }

      formData.append("detalles", JSON.stringify(data.detalles));

      let response;
      if (item?.id) {
        response = await EstudioNaveAPI.updateEstudioNave(item.id, formData);
      } else {
        response = await EstudioNaveAPI.createEstudioNave(formData);
      }
      
      const newItem = {
        ...response,
        isUpdated: !!item,
        isNew: !item,
      };

      onClose();
    } catch (err) {
      console.error("Error al guardar:", err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const customStyles = {
    control: (base, state) => ({ 
      ...base, 
      minHeight: "2.75rem",
      borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
      "&:hover": {
        borderColor: "#3b82f6"
      }
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? "#3b82f6" : state.isFocused ? "#eff6ff" : "white",
      color: state.isSelected ? "white" : "#111827",
      "&:active": {
        backgroundColor: "#3b82f6"
      }
    })
  };

  if (!naveSeleccionada) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl">
        <Ship className="w-16 h-16 text-slate-400 mb-4" />
        <p className="text-lg text-slate-600 font-medium">Debes seleccionar una nave para continuar</p>
      </div>
    );
  }

  return (
    <LoaderError loading={loading}>
      <div className="relative w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <FileCheck className="w-8 h-8" />
            <h2 className="text-3xl font-bold">
              {item ? "Actualizar Estudio" : "Nuevo Estudio"}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-blue-100">
            <Ship className="w-4 h-4" />
            <p className="text-sm">
              Nave: <span className="font-semibold text-white">{naveSeleccionada.nombre}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8">
          {/* Sección: Información General */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-blue-600">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-800">Información General</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tipo */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Tipo de Estudio <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="tipo_id"
                  control={control}
                  rules={{ required: "El tipo de estudio es obligatorio" }}
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
                {errors.tipo_id && (
                  <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                    <span>⚠</span> {errors.tipo_id.message}
                  </p>
                )}
              </div>

              {/* Fecha */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Fecha de Aprobación <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  {...register("fecha_aprobacion", {
                    required: "La fecha es obligatoria",
                  })}
                  className="w-full"
                />
                {errors.fecha_aprobacion && (
                  <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                    <span>⚠</span> {errors.fecha_aprobacion.message}
                  </p>
                )}
              </div>

              {/* Observación */}
              <div className="lg:col-span-2 space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  Observaciones
                </Label>
                <Input
                  type="text"
                  placeholder="Ingrese observaciones adicionales (opcional)"
                  {...register("observacion")}
                  className="w-full"
                />
              </div>

              {/* PDF */}
              <div className="lg:col-span-2 space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Upload className="w-4 h-4 text-blue-600" />
                  Archivo PDF
                </Label>
                <div className="relative">
                  <input 
                    type="file" 
                    {...register("archivo_pdf")}
                    accept=".pdf"
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sección: Detalles del Estudio */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-blue-600">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-800">Detalles del Estudio</h3>
              </div>
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                onClick={() =>
                  append({
                    nombre: "",
                    cantidad: 1,
                    descripcion: "",
                    peso_total_tons: "",
                  })
                }
              >
                <Plus className="w-4 h-4" />
                Agregar Detalle
              </button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        Nombre <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        placeholder="Ej: Estructura principal"
                        {...register(`detalles.${index}.nombre`, {
                          required: "Nombre obligatorio",
                        })}
                      />
                      {errors.detalles?.[index]?.nombre && (
                        <p className="text-red-500 text-xs">
                          {errors.detalles[index].nombre.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                        <Hash className="w-3.5 h-3.5 text-blue-600" />
                        Cantidad <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="1"
                        {...register(`detalles.${index}.cantidad`, {
                          required: "Campo obligatorio",
                          min: 1,
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                        Descripción
                      </Label>
                      <Input
                        type="text"
                        placeholder="Detalles adicionales"
                        {...register(`detalles.${index}.descripcion`)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                        <Weight className="w-3.5 h-3.5 text-blue-600" />
                        Peso (tons)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...register(`detalles.${index}.peso_total_tons`)}
                      />
                    </div>
                  </div>

                  {fields.length > 1 && (
                    <div className="flex justify-end pt-2 border-t border-gray-200">
                      <button
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {fields.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No hay detalles agregados</p>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  onClick={() =>
                    append({
                      nombre: "",
                      cantidad: 1,
                      descripcion: "",
                      peso_total_tons: "",
                    })
                  }
                >
                  <Plus className="w-5 h-5" />
                  Agregar Primer Detalle
                </button>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-6 border-t-2 border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="px-6 py-3 font-medium"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={submitLoading}
              className="px-6 py-3 font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              {submitLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Guardando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  {item ? "Actualizar" : "Guardar"}
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </LoaderError>
  );
};

export default FormEstudios;