import React, { useState, useEffect } from "react";
import dayjs from "dayjs";

// --- Tablas (igual que antes) ---
const TablaCertificados = ({ certificados = [] }) => {
  if (!certificados.length) {
    return <p className="text-gray-500">No hay certificados disponibles.</p>;
  }

  const getRowColor = (fechaVigencia) => {
    const hoy = dayjs();
    const vencimiento = dayjs(fechaVigencia);

    if (vencimiento.isBefore(hoy)) return "bg-red-100 text-red-800";
    if (vencimiento.diff(hoy, "day") <= 30) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-700">
        <thead className="bg-gray-100 font-semibold">
          <tr>
            <th className="px-3 py-2 border-b">Certificado</th>
            <th className="px-3 py-2 border-b">Código</th>
            <th className="px-3 py-2 border-b">Vencimiento</th>
          </tr>
        </thead>
        <tbody>
          {certificados.map((c) => (
            <tr key={c.id} className={`${getRowColor(c.fecha_vigencia)} hover:opacity-90`}>
              <td className="px-3 py-2 border-b">{c.nombre}</td>
              <td className="px-3 py-2 border-b">{c.codigo}</td>
              <td className="px-3 py-2 border-b">{c.fecha_vigencia}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TablaCursos = ({ cursos = [] }) => {
  if (!cursos.length) return <p className="text-gray-500">No hay cursos disponibles.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-700">
        <thead className="bg-gray-100 font-semibold">
          <tr>
            <th className="px-3 py-2 border-b">Curso</th>
            <th className="px-3 py-2 border-b">Fecha</th>
            <th className="px-3 py-2 border-b">Estado</th>
          </tr>
        </thead>
        <tbody>
          {cursos.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 border-b">{c.nombre}</td>
              <td className="px-3 py-2 border-b">{c.fecha_vigencia}</td>
              <td className="px-3 py-2 border-b">{c.estado || "Activo"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TablaEspecialidades = ({ especialidades = [] }) => {
  if (!especialidades.length) return <p className="text-gray-500">No hay especialidades disponibles.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-700">
        <thead className="bg-gray-100 font-semibold">
          <tr>
            <th className="px-3 py-2 border-b">Especialidad</th>
            <th className="px-3 py-2 border-b">Fecha</th>
            <th className="px-3 py-2 border-b">Observación</th>
          </tr>
        </thead>
        <tbody>
          {especialidades.map((e) => (
            <tr key={e.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 border-b">{e.nombre}</td>
              <td className="px-3 py-2 border-b">{e.fecha_vigencia}</td>
              <td className="px-3 py-2 border-b">{e.observacion || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- Dashboard con spinner ---
export default function DashboardTrabajador({ certificados, cursos, especialidades }) {
  const [tab, setTab] = useState("certificados");
  const [loading, setLoading] = useState(true);

  // Simula fetch / espera a que los datos lleguen
useEffect(() => {
  if (
    (certificados && certificados.length > 0) ||
    (cursos && cursos.length > 0) ||
    (especialidades && especialidades.length > 0)
  ) {
    setLoading(false);
  }
}, [certificados, cursos, especialidades]);


if (loading) {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-b-4 border-gray-300"></div>
      <span className="ml-2">Cargando...</span>
    </div>
  );
}


  return (
    <div className="p-4">
      {/* Tabs */}
      <div className="flex border-b mb-4">
        <button
          onClick={() => setTab("certificados")}
          className={`px-4 py-2 -mb-px font-semibold border-b-2 ${
            tab === "certificados" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-600"
          }`}
        >
          Certificados
        </button>
        <button
          onClick={() => setTab("cursos")}
          className={`px-4 py-2 -mb-px font-semibold border-b-2 ${
            tab === "cursos" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-600"
          }`}
        >
          Cursos
        </button>
        <button
          onClick={() => setTab("especialidades")}
          className={`px-4 py-2 -mb-px font-semibold border-b-2 ${
            tab === "especialidades" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-600"
          }`}
        >
          Especialidades
        </button>
      </div>

      {/* Contenido de tab */}
      <div>
        {tab === "certificados" && <TablaCertificados certificados={certificados} />}
        {tab === "cursos" && <TablaCursos cursos={cursos} />}
        {tab === "especialidades" && <TablaEspecialidades especialidades={especialidades} />}
      </div>
    </div>
  );
}
