import React, { useState } from "react";
import { useForm } from "react-hook-form";
import PDF_SCAN from "../../api/pdf_scan";
import Label from "../../components/form/Label";
import { Upload } from "lucide-react";
import toast from "react-hot-toast";
import { API_URL } from "../../utils/auth";

export default function Index() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting, errors },
    reset,
    setError,
  } = useForm();

  const [downloadUrl, setDownloadUrl] = useState(null);
  const [processedFileName, setProcessedFileName] = useState(null);

  const selectedFile = watch("archivo");

  const onSubmit = async (data) => {
    const file = data.archivo?.[0];

    if (!file) {
      setError("archivo", { message: "Debes seleccionar un archivo PDF." });
      return;
    }

    try {
      const resp = await PDF_SCAN.procesarPDF(file);

      if (resp?.file) {
        const filePath = `/media/${resp.file}`;
        const fullUrl = `${API_URL}${filePath}`;

        setDownloadUrl(fullUrl);
        setProcessedFileName(resp.file);
      }

      toast.success("PDF procesado correctamente");
      reset();
    } catch (error) {
      console.error(error);
      toast.error("Error al procesar el archivo");
    }
  };

  // 👉 Función para limpiar todo
  const handleReset = () => {
    reset();
    setDownloadUrl(null);
    setProcessedFileName(null);
    toast("Formulario restablecido");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">PDF TO SCANNER</h1>
      </div>

      {/* Contenido */}
      <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="lg:col-span-2 space-y-2">
            <Label className="flex items-center gap-2 text-gray-700 font-medium">
              <Upload className="w-4 h-4 text-blue-600" />
              Archivo PDF
            </Label>

            <div className="relative">
              <input
                type="file"
                accept=".pdf"
                {...register("archivo", { required: true })}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {errors.archivo && (
              <p className="text-red-600 text-sm">
                Debes seleccionar un archivo PDF.
              </p>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting || !selectedFile?.length}
              className={`px-4 py-2 rounded-lg text-white font-semibold ${
                isSubmitting || !selectedFile?.length
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? "Procesando..." : "Enviar y procesar PDF"}
            </button>

            {/* Botón REESTABLECER */}
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold"
            >
              Reestablecer
            </button>
          </div>
        </form>

        {/* Resultado */}
        {downloadUrl && (
          <div className="mt-4 space-y-2">
            <p className="text-slate-700 font-medium">
              Archivo listo:{" "}
              <span className="text-blue-600">{processedFileName}</span>
            </p>

            <a href={downloadUrl} target="_blank" download>
              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg">
                Descargar PDF Procesado
              </button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
