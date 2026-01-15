import React from "react";
import TablaMatriculas from "../../table/trabajadores/TablaMatriculas";
import TablaCursos from "../../table/trabajadores/TablaCursos";
import { MdClose } from "react-icons/md";
import { PiCertificateLight } from "react-icons/pi";
import { HiOutlineBookOpen } from "react-icons/hi2";

export default function FormMatriculas({ item, onClose }) {

  // Si no hay trabajador, no renderizar
  if (!item) return null;

  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b pb-3">
        <h2 className="text-2xl font-bold text-gray-800">Detalle del Trabajador</h2>

        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-200 transition"
        >
          <MdClose className="h-6 w-6 text-gray-700" />
        </button>
      </div>

      {/* Datos del trabajador */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-gray-50 p-4 rounded-xl shadow-sm">
        <div>
          <p className="text-xs text-gray-500">Nombre</p>
          <p className="font-semibold text-gray-800">{item.nombre}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500">RUT</p>
          <p className="font-semibold text-gray-800">{item.rut || "—"}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Cargo</p>
          <p className="font-semibold text-gray-800">{item.cargo || "—"}</p>
        </div>
      </div>

      {/* Botones de acciones */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-md transition">
          <PiCertificateLight className="h-5 w-5" />
          Crear Matrícula
        </button>

        <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl shadow-md transition">
          <HiOutlineBookOpen className="h-5 w-5" />
          Crear Curso
        </button>
      </div>

      {/* Tabla Matrículas */}
      <div className="mb-10">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Matrículas del Trabajador</h3>

        <div className="bg-white p-4 rounded-xl shadow">
          <TablaMatriculas trabajadorId={item.id} />
        </div>
      </div>

      {/* Tabla Cursos */}
      <div className="mb-10">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Cursos del Trabajador</h3>

        <div className="bg-white p-4 rounded-xl shadow">
          <TablaCursos trabajadorId={item.id} />
        </div>
      </div>

      <div className="text-right">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition"
        >
          Cerrar
        </button>
      </div>

    </div>
  );
}
