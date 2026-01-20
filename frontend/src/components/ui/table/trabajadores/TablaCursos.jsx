import React from "react";

export default function TablaCursos({ data }) {

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-700">
        <thead className="bg-gray-100 text-gray-700 font-semibold">
          <tr>
            <th className="px-3 py-2 border-b">Tipo de Curso</th>
            <th className="px-3 py-2 border-b">Fecha</th>
            <th className="px-3 py-2 border-b">Vencimiento</th>
          </tr>
        </thead>

        <tbody>   
            <tr className="hover:bg-gray-50">
              <td className="px-3 py-2 border-b">---</td>
              <td className="px-3 py-2 border-b">---</td>
              <td className="px-3 py-2 border-b">---</td>
            </tr>
        </tbody>
      </table>
    </div>
  );
}
