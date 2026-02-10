import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Button from "../../button/Button";
import Label from "../../../form/Label";
import Input from "../../../form/input/InputField";
import TipoCertificadoAPI from "../../../../api/tipoCertificadoNave";

const FormTipoCertificado = ({ isOpen, onClose, item, onItemUpdated }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nombre: "",
      observacion: "",
    },
  });

  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    reset({
      nombre: item?.nombre || "",
      observacion: item?.observacion || "",
    });
  }, [item, reset]);

  const onSubmit = async (formData) => {
    try {
      setSubmitLoading(true);
      setError(null); // 👈 Limpia el error anterior

      const payload = {
        nombre: formData.nombre,
        observacion: formData.observacion || "",
      };

      const response = item?.id
        ? await TipoCertificadoAPI.updateTipoCertificado(item.id, payload)
        : await TipoCertificadoAPI.createTipoCertificado(payload);

      onItemUpdated({
        id: response.id,
        label: response.nombre,
        value: response.id,
        isNew: true,
      });

      onClose();
    } catch (err) {
      console.error("Error al guardar:", err);
      setError("No se pudo guardar el tipo de certificado.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const isEdit = Boolean(item?.id);

  return (
    <div className="relative w-full p-4 overflow-y-auto bg-white rounded-3xl dark:bg-gray-900 lg:p-11">
      <div className="px-2 pr-14">
        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          {isEdit
            ? "Actualizar Tipo de Certificado"
            : "Registrar Tipo de Certificado"}
        </h4>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
        <div className="px-2 overflow-y-auto custom-scrollbar">
          <div className="mb-6">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <div>
                <Label>Nombre</Label>
                <Input
                  type="text"
                  placeholder="Nombre del tipo de certificado"
                  {...register("nombre", {
                    required: "El nombre es obligatorio",
                    maxLength: { value: 100, message: "Máximo 100 caracteres" },
                  })}
                />
                {errors.nombre && (
                  <span className="text-red-500 text-sm">
                    {errors.nombre.message}
                  </span>
                )}
              </div>

              <div>
                <Label>Observación</Label>
                <Input
                  type="text"
                  placeholder="Observación opcional"
                  {...register("observacion")}
                />
              </div>
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={submitLoading}
          >
            Cancelar
          </Button>

          <Button size="sm" type="submit" disabled={submitLoading}>
            {submitLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                Guardando...
              </span>
            ) : isEdit ? (
              "Actualizar"
            ) : (
              "Guardar"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FormTipoCertificado;
