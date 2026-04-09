import { useState } from "react";
import SUELDOS_API from "../../api/sueldos";

export default function CompararSueldosForm() {
  const [pdf, setPdf] = useState(null);
  const [excel, setExcel] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pdf || !excel) return alert("Por favor, sube PDF y Excel.");

    try {
      const blob = await SUELDOS_API.compararSueldos(pdf, excel);

      // Descargar Excel resultante
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "comparacion_sueldos.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Error al procesar los archivos.");
      console.error(error);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border border-gray-300 rounded-lg shadow-sm bg-white">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Comparar Sueldos</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col">
          <label className="mb-1 text-gray-700 font-medium">Archivo PDF</label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setPdf(e.target.files[0])}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-gray-700 font-medium">Archivo Excel</label>
          <input
            type="file"
            accept=".xls,.xlsx"
            onChange={(e) => setExcel(e.target.files[0])}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-gray-800 text-white font-medium py-2 rounded hover:bg-gray-700 transition-colors"
        >
          Comparar y Descargar
        </button>
      </form>
    </div>
  );
}