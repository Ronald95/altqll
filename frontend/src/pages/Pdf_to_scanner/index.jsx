import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import PDF_SCAN from "../../api/pdf_scan";
import Label from "../../components/form/Label";
import { Upload, Trash2 } from "lucide-react";
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
  const [pdfList, setPdfList] = useState([]);

  const selectedFile = watch("archivo");

  // -------------------------------
  // Cargar PDFs al iniciar
  // -------------------------------
  const fetchPDFs = async () => {
    try {
      const data = await PDF_SCAN.listarPDFs();
      setPdfList(data);
    } catch (error) {
      console.error("Error cargando PDFs:", error);
      toast.error("Error al cargar PDFs");
    }
  };

  useEffect(() => {
    fetchPDFs();
  }, []);

  // -------------------------------
  // Subir y procesar PDF
  // -------------------------------
  const onSubmit = async (data) => {
    const file = data.archivo?.[0];

    if (!file) {
      setError("archivo", { message: "Debes seleccionar un archivo PDF." });
      return;
    }

    try {
      const resp = await PDF_SCAN.procesarPDF(file);

      if (resp?.file) {
        setDownloadUrl(resp.url);
        setProcessedFileName(resp.file);

        toast.success("PDF procesado correctamente");

        // Actualizar lista
        fetchPDFs();
      }

      reset();
    } catch (error) {
      console.error(error);
      toast.error("Error al procesar el archivo");
    }
  };

  // -------------------------------
  // Eliminar PDF
  // -------------------------------
  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este PDF?")) return;

    try {
      await PDF_SCAN.eliminarPDF(id);
      toast.success("PDF eliminado correctamente");

      // Actualizar lista
      fetchPDFs();
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar PDF");
    }
  };

  // -------------------------------
  // Reset formulario
  // -------------------------------
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

      {/* Subir PDF */}
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

            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold"
            >
              Reestablecer
            </button>
          </div>
        </form>

        {/* Resultado último PDF */}
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

      {/* Listado de PDFs */}
      <div className="bg-white p-6 rounded-xl shadow-md mt-6">
        <h2 className="text-xl font-bold mb-4 text-slate-800">Mis PDFs</h2>

        {pdfList.length === 0 ? (
          <p className="text-gray-500">No tienes PDFs procesados aún.</p>
        ) : (
          <div className="space-y-2">
            {pdfList.map((pdf) => {
              const fileSizeMB = (pdf.file_size / (1024 * 1024)).toFixed(2);
              const createdAt = new Date(pdf.created_at).toLocaleString();

              return (
                <div
                  key={pdf.id}
                  className="flex justify-between items-center bg-gray-50 p-3 rounded-lg shadow-sm"
                >
                  <div>
                    <p className="font-medium text-slate-700">{pdf.output_name}</p>
                    <p className="text-sm text-gray-500">
                      Tamaño: {fileSizeMB} MB | Creado: {createdAt}
                    </p>
                    <a
                      href={pdf.file_path}
                      target="_blank"
                      className="text-blue-600 text-sm hover:underline"
                    >
                      Ver / Descargar
                    </a>
                  </div>
                  <button
                    onClick={() => handleDelete(pdf.id)}
                    className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
