import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import SelectReact from "react-select";
import { Award, Calendar, MessageSquare, Ship, FileCheck, Plus, Edit3 } from "lucide-react";
import Button from "../../button/Button";
import Label from "../../../form/Label";
import Input from "../../../form/input/InputField";
import LoaderError from "../../../loading/LoaderError";
import CertificadoNaveAPI from "../../../../api/certificadoNave";
import TipoCertificadoNaveAPI from "../../../../api/tipoCertificadoNave";
import { useNave } from "../../../../context/NaveContext";
import { Modal } from "../../../../components/ui/modal";
import { useModal } from "../../../../hooks/useModal";
import FormTipoCertificado from "./FormTipoCertificado";

const FormCertificado = ({ isOpen, onClose, item, onItemUpdated }) => {
  const { naveSeleccionada } = useNave();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      cantidad: "",
      fecha: "",
      observacion: "",
      tipo: null,
    },
  });

  const selectedTipo = watch("tipo");

  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const {
    isOpen: isOpenTipoModal,
    openModal: openTipoModal,
    closeModal: closeTipoModal,
  } = useModal();

  useEffect(() => {
    const fetchTipos = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await TipoCertificadoNaveAPI.getTiposCertificadoForSelect();
        setTipos(data);
      } catch (err) {
        console.error("Error al obtener tipos:", err);
        setError("No se pudieron cargar los tipos de certificado.");
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
        tipo: item.tipo_id
          ? { value: item.tipo_id, label: item.tipo_nombre }
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

  const customStyles = {
    control: (base, state) => ({ 
      ...base, 
      minHeight: "2.75rem",
      paddingRight: "5rem",
      borderColor: state.isFocused ? "#0891b2" : "#e5e7eb",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(8, 145, 178, 0.1)" : "none",
      "&:hover": {
        borderColor: "#0891b2"
      }
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? "#0891b2" : state.isFocused ? "#cffafe" : "white",
      color: state.isSelected ? "white" : "#111827",
      "&:active": {
        backgroundColor: "#0891b2"
      }
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 99999,
    })
  };

  const onSubmit = async (formData) => {
    try {
      setSubmitLoading(true);

      const payload = {
        cantidad: parseInt(formData.cantidad),
        fecha: formData.fecha ? formData.fecha.split("T")[0] : null,
        observacion: formData.observacion || "",
        tipo: formData.tipo?.value,
        nave: naveSeleccionada?.id,
      };

      let response;
      if (item?.id) {
        response = await CertificadoNaveAPI.updateCertificado(item.id, payload);
      } else {
        response = await CertificadoNaveAPI.createCertificado(payload);
      }

      const newItem = {
        ...response,
        isUpdated: !!item,
        isNew: !item,
      };
      onItemUpdated(newItem);
      onClose();
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleTipoUpdated = async (newItem) => {
    try {
      const data = await TipoCertificadoNaveAPI.getTiposCertificadoForSelect();
      setTipos(data);

      if (newItem?.id) {
        const newOption = data.find((t) => t.value === newItem.id);
        if (newOption) {
          setValue("tipo", newOption, { shouldValidate: true });
        }
      }
    } catch (error) {
      console.error("Error al actualizar lista de tipos:", error);
    } finally {
      closeTipoModal();
    }
  };

  const handleOpenTipoModal = () => {
    openTipoModal();
  };

  const isEdit = Boolean(item?.id);

  if (!naveSeleccionada) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-gradient-to-br from-slate-50 to-cyan-50 rounded-2xl">
        <Ship className="w-16 h-16 text-slate-400 mb-4" />
        <p className="text-lg text-slate-600 font-medium">Debes seleccionar una nave para continuar</p>
      </div>
    );
  }

  return (
    <LoaderError loading={loading} error={error}>
      <div className="relative w-full bg-white overflow-hidden">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-8 py-6 text-white rounded-t-3xl">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-8 h-8" />
            <h2 className="text-3xl font-bold">
              {isEdit ? "Actualizar Certificado" : "Registrar Certificado"}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-cyan-100">
            <Ship className="w-4 h-4" />
            <p className="text-sm">
              Nave: <span className="font-semibold text-white">{naveSeleccionada?.nombre}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 pb-6">
          {/* Sección: Información del Certificado */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-cyan-600">
              <FileCheck className="w-5 h-5 text-cyan-600" />
              <h3 className="text-xl font-semibold text-gray-800">Detalle del Certificado</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tipo */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Award className="w-4 h-4 text-cyan-600" />
                  Tipo de Certificado <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
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
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        className="react-select-container"
                      />
                    )}
                  />
                  
                  {/* Botones de Agregar y Editar */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-20">
                    <button
                      type="button"
                      onClick={handleOpenTipoModal}
                      className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                      title="Agregar nuevo tipo"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenTipoModal}
                      className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Editar tipo"
                      disabled={!selectedTipo?.value}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {errors.tipo && (
                  <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                    <span>⚠</span> {errors.tipo.message}
                  </p>
                )}
              </div>

              {/* Fecha */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Calendar className="w-4 h-4 text-cyan-600" />
                  Fecha de Expiración
                </Label>
                <Input
                  type="date"
                  {...register("fecha")}
                  className="w-full"
                />
                <p className="text-gray-500 text-xs">
                  Opcional: solo completar si tiene fecha de expiración.
                </p>
                {errors.fecha && (
                  <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                    <span>⚠</span> {errors.fecha.message}
                  </p>
                )}
              </div>

              {/* Observación */}
              <div className="lg:col-span-2 space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium">
                  <MessageSquare className="w-4 h-4 text-cyan-600" />
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
              className="px-6 py-3 font-medium bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              {submitLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Guardando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  {isEdit ? "Actualizar" : "Guardar"}
                </span>
              )}
            </Button>
          </div>
        </form>

        {/* Modal para Tipo de Certificado */}
        <Modal
          isOpen={isOpenTipoModal}
          onClose={closeTipoModal}
          className="max-w-4xl"
        >
          <FormTipoCertificado
            isOpen={isOpenTipoModal}
            onClose={closeTipoModal}
            item={null}
            onItemUpdated={handleTipoUpdated}
          />
        </Modal>
      </div>
    </LoaderError>
  );
};

export default FormCertificado;