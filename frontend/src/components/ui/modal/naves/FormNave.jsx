import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import SelectReact from "react-select";
import {
  Ship,
  Anchor,
  Ruler,
  Users,
  Activity,
  Plus,
  Edit3,
  ImagePlus,
  Upload,
  X,
  Check,
  Waves,
} from "lucide-react";
import { FaCloudUploadAlt } from "react-icons/fa";
import Button from "../../../../components/ui/button/Button";
import Label from "../../../../components/form/Label";
import Input from "../../../../components/form/input/InputField";
import LoaderError from "../../../../components/loading/LoaderError";
import NavesAPI from "../../../../api/naves";
import TiposNavesAPI from "../../../../api/tipoNave";

const FormNave = ({ isOpen, onClose, nave, onItemUpdated }) => {
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
      nombre: "",
      sllamada: "",
      matricula: "",
      eslora: "",
      manga: "",
      puntal: "",
      trg: "",
      tminima: "",
      tmaxima: "",
      pasajeros: "",
      actividad: "",
      tipo: null,
      imagen: null,
    },
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [imageSize, setImageSize] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isNewImage, setIsNewImage] = useState(false);

  const [imageFileName, setImageFileName] = useState("");
  const selectedTipo = watch("tipo");

  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const tiposData = await TiposNavesAPI.getTiposNave();
        const formattedTipos = tiposData.map((t) => ({
          value: t.id,
          label: t.nombre,
        }));
        setTipos(formattedTipos);

        if (nave) {
          reset({
            ...nave,
            tipo: formattedTipos.find((t) => t.value === nave.tipo) || null,
          });

          // 👇 Cargar imagen del backend
          // 🔥 función para corregir URL absoluta o relativa
          const resolveImageUrl = (img) => {
            if (!img) return null;

            // si viene completa (http / https)
            if (img.startsWith("http://") || img.startsWith("https://")) {
              return img;
            }

            // si viene solo el path relativo
            return `http://127.0.0.1:8000${
              img.startsWith("/") ? img : `/media/${img}`
            }`;
          };
          if (nave) {
            reset({
              ...nave,
              tipo: formattedTipos.find((t) => t.value === nave.tipo) || null,
            });

            if (nave.imagen) {
              const url = resolveImageUrl(nave.imagen);
              setPreviewImage(url);
              setIsNewImage(false);
              // Obtener peso desde el servidor
              fetch(url, { method: "HEAD" })
                .then((res) => {
                  const size = res.headers.get("Content-Length");
                  if (size) setImageSize(parseInt(size));
                })
                .catch((err) => console.error("Error obteniendo tamaño:", err));
            }
          } else {
            setPreviewImage(null);
          }
        } else {
          setPreviewImage(null);
        }
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los tipos de nave.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, nave, reset]);

const handleImageChange = (file) => {
  if (!file) return;

  setValue("imagen", file, { shouldValidate: true });
  setPreviewImage(URL.createObjectURL(file));
  setImageSize(file.size);
  setImageFileName(file.name);
  setIsNewImage(true); 
};


  const clearImage = (e) => {
    e?.stopPropagation();
    setPreviewImage(null);
    setImageSize(null);
    setImageFileName("");
    const input = document.getElementById("imagenInput");
    if (input) input.value = "";
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";

    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(2)} KB`;
    }

    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "2.75rem",
      paddingRight: "5rem",
      borderColor: state.isFocused ? "#0284c7" : "#e5e7eb",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(2, 132, 199, 0.1)" : "none",
      "&:hover": {
        borderColor: "#0284c7",
      },
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#0284c7"
        : state.isFocused
        ? "#e0f2fe"
        : "white",
      color: state.isSelected ? "white" : "#111827",
      "&:active": {
        backgroundColor: "#0284c7",
      },
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 99999,
    }),
  };

  const onSubmit = async (formData) => {
    setSubmitLoading(true);
    try {
      const payload = {
        nombre: formData.nombre,
        sllamada: formData.sllamada,
        matricula: formData.matricula,
        eslora: parseFloat(formData.eslora),
        manga: parseFloat(formData.manga),
        puntal: parseFloat(formData.puntal),
        trg: parseFloat(formData.trg),
        tminima: parseInt(formData.tminima),
        tmaxima: parseInt(formData.tmaxima),
        pasajeros: parseInt(formData.pasajeros),
        actividad: formData.actividad,
        categoria: formData.tipo?.value || null,
      };

      const formPayload = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        formPayload.append(key, value);
      });

      if (formData.imagen instanceof File) {
        formPayload.append("imagen", formData.imagen);
      }

      let response;
      if (nave) {
        response = await NavesAPI.updateNave(nave.id, formPayload, true);
      } else {
        response = await NavesAPI.createNave(formPayload, true);
      }

      onItemUpdated({
        ...response,
        isUpdated: !!nave,
        isNew: !nave,
      });

      onClose();
    } catch (err) {
      console.error("Error al guardar la nave:", err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const isEdit = Boolean(nave?.id);

  return (
    <LoaderError loading={loading} error={error}>
      <div className="relative w-full bg-white overflow-hidden">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-8 py-6 text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <Ship className="w-8 h-8" />
            <h2 className="text-3xl font-bold">
              {isEdit ? "Editar Nave" : "Registrar Nueva Nave"}
            </h2>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 pb-6">
          {/* --- INFORMACIÓN GENERAL --- */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-sky-600">
              <Anchor className="w-5 h-5 text-sky-600" />
              <h3 className="text-xl font-semibold text-gray-800">
                Información General
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Nombre */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Ship className="w-4 h-4 text-sky-600" />
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("nombre", { required: "Campo obligatorio" })}
                  placeholder="Ej: Bramar II"
                />
                {errors.nombre && (
                  <p className="text-red-500 text-sm">
                    ⚠ {errors.nombre.message}
                  </p>
                )}
              </div>

              {/* Señal de llamada */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Waves className="w-4 h-4 text-sky-600" />
                  Señal de Llamada <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("sllamada", { required: "Campo obligatorio" })}
                  placeholder="Ej: CB5461"
                />
                {errors.sllamada && (
                  <p className="text-red-500 text-sm">
                    ⚠ {errors.sllamada.message}
                  </p>
                )}
              </div>

              {/* Matrícula */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Anchor className="w-4 h-4 text-sky-600" />
                  Matrícula <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("matricula", { required: "Campo obligatorio" })}
                  placeholder="Ej: PMO 5445"
                />
                {errors.matricula && (
                  <p className="text-red-500 text-sm">
                    ⚠ {errors.matricula.message}
                  </p>
                )}
              </div>

              {/* Tipo */}
              <div className="lg:col-span-3 space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Ship className="w-4 h-4 text-sky-600" />
                  Tipo de Nave <span className="text-red-500">*</span>
                </Label>

                <div className="relative">
                  <Controller
                    name="tipo"
                    control={control}
                    rules={{ required: "Campo obligatorio" }}
                    render={({ field }) => (
                      <SelectReact
                        {...field}
                        options={tipos}
                        styles={customStyles}
                        menuPortalTarget={document.body}
                        placeholder="Seleccione un tipo..."
                      />
                    )}
                  />
                </div>

                {errors.tipo && (
                  <p className="text-red-500 text-sm">
                    ⚠ {errors.tipo.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* --- DIMENSIONES --- */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-sky-600">
              <Ruler className="w-5 h-5 text-sky-600" />
              <h3 className="text-xl font-semibold text-gray-800">
                Dimensiones y Características
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[
                ["eslora", "Eslora (m)"],
                ["manga", "Manga (m)"],
                ["puntal", "Puntal (m)"],
                ["trg", "TRG"],
              ].map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-700 font-medium">
                    <Ruler className="w-4 h-4 text-sky-600" />
                    {label} <span className="text-red-500">*</span>
                  </Label>

                  <Input
                    type="number"
                    step="0.01"
                    {...register(key, { required: "Campo obligatorio" })}
                    placeholder="0.00"
                  />

                  {errors[key] && (
                    <p className="text-red-500 text-sm">
                      ⚠ {errors[key].message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* --- TRIPULACIÓN --- */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-sky-600">
              <Users className="w-5 h-5 text-sky-600" />
              <h3 className="text-xl font-semibold text-gray-800">
                Tripulación y Pasajeros
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tripulación mínima */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Users className="w-4 h-4 text-sky-600" />
                  Tripulación Mínima <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  {...register("tminima", { required: "Campo obligatorio" })}
                  placeholder="0"
                />
                {errors.tminima && (
                  <p className="text-red-500 text-sm">
                    ⚠ {errors.tminima.message}
                  </p>
                )}
              </div>

              {/* Tripulación máxima */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Users className="w-4 h-4 text-sky-600" />
                  Tripulación Máxima <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  {...register("tmaxima", { required: "Campo obligatorio" })}
                  placeholder="0"
                />
                {errors.tmaxima && (
                  <p className="text-red-500 text-sm">
                    ⚠ {errors.tmaxima.message}
                  </p>
                )}
              </div>

              {/* Pasajeros */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Users className="w-4 h-4 text-sky-600" />
                  Pasajeros <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  {...register("pasajeros", { required: "Campo obligatorio" })}
                  placeholder="0"
                />
                {errors.pasajeros && (
                  <p className="text-red-500 text-sm">
                    ⚠ {errors.pasajeros.message}
                  </p>
                )}
              </div>

              {/* Actividad */}
              <div className="lg:col-span-3 space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Activity className="w-4 h-4 text-sky-600" />
                  Actividad <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("actividad", { required: "Campo obligatorio" })}
                  placeholder="Ej: Apoyo centros de cultivo"
                />
                {errors.actividad && (
                  <p className="text-red-500 text-sm">
                    ⚠ {errors.actividad.message}
                  </p>
                )}
              </div>

              {/* --- Imagen*/}
              {/* --- Imagen --- */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-sky-600">
                  <ImagePlus className="w-5 h-5 text-sky-600" />
                  <h3 className="text-xl font-semibold text-gray-800">
                    Imagen de la Nave
                  </h3>
                </div>

                <div className="lg:col-span-3">
                  {/* Input oculto */}
                  <input
                  id="imagenInput"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageChange(e.target.files?.[0])}
                />


                  {!previewImage ? (
                    /* NO HAY IMAGEN */
                    <div
                      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ${
                        isDragging
                          ? "border-sky-500 bg-sky-50 scale-[1.01]"
                          : "border-gray-300 hover:border-sky-400 hover:bg-gray-50"
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleImageChange(file);
                      }}
                      onClick={() =>
                        document.getElementById("imagenInput").click()
                      }
                    >
                      <FaCloudUploadAlt
                        className={`text-4xl mx-auto mb-4 ${
                          isDragging ? "text-sky-600" : "text-gray-400"
                        }`}
                      />

                      <p className="font-medium text-gray-700 mb-1">
                        {isDragging
                          ? "Suelta la imagen aquí"
                          : "Arrastra una imagen aquí"}
                      </p>
                      <p className="text-sm text-gray-500">
                        o haz clic para seleccionar un archivo
                      </p>

                      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
                        <span className="px-3 py-1 bg-gray-100 rounded-full">
                          JPG
                        </span>
                        <span className="px-3 py-1 bg-gray-100 rounded-full">
                          PNG
                        </span>
                        <span className="px-3 py-1 bg-gray-100 rounded-full">
                          WebP
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* SÍ HAY IMAGEN */
                    <div className="relative group">
                      <div className="relative rounded-xl border bg-gray-50 p-3">
                        <img
                          src={previewImage}
                          alt="Vista previa"
                          className="w-full h-72 object-contain rounded-lg"
                        />

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              document.getElementById("imagenInput").click()
                            }
                            className="px-5 py-2 bg-white hover:bg-gray-100 rounded-lg text-gray-800 font-medium flex items-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Cambiar
                          </button>

                          <button
                            type="button"
                            onClick={clearImage}
                            className="px-5 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-medium flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Eliminar
                          </button>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="mt-3 p-3 bg-sky-50 border border-sky-200 rounded-lg flex items-center gap-3">
                        <Check className="w-5 h-5 text-sky-600" />

                        <div className="truncate">
                          <p className="text-sm font-semibold text-gray-800 truncate max-w-sm">
                            {imageFileName}
                          </p>

                          {imageSize && (
                            <p className="text-xs text-gray-600">
                              📦 {formatFileSize(imageSize)} 
                              { isNewImage && '• Se comprimirá ~40%'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* --- BOTONES --- */}
          <div className="flex justify-end gap-3 pt-6 pb-2 border-t-2 border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitLoading}
              className="px-6 py-3 font-medium"
            >
              Cerrar
            </Button>

            <Button
              type="submit"
              disabled={submitLoading}
              className="px-6 py-3 font-medium bg-sky-600 hover:bg-sky-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              {submitLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Guardando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Ship className="w-4 h-4" />
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

export default FormNave;
