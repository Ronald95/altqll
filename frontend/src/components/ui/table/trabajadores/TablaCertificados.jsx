import React from "react";

export default function TablaCertificados({ data }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-700">
        <thead className="bg-gray-100 text-gray-700 font-semibold">
          <tr>
            <th className="px-3 py-2 border-b">Tipo de Certificado</th>
            <th className="px-3 py-2 border-b">Fecha Vigencia</th>
            <th className="px-3 py-2 border-b">Usuario</th>
          </tr>
        </thead>

        <tbody>
          {data && data.length > 0 ? (
            data.map((cert) => (
              <tr key={cert.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 border-b">{cert.nombre}</td>
                <td className="px-3 py-2 border-b">{cert.fecha_vigencia}</td>
                <td className="px-3 py-2 border-b">{cert.user || "—"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="px-3 py-2 text-center text-gray-400">
                No hay certificados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
