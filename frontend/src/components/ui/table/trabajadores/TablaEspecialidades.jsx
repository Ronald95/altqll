const TablaEspecialidades = ({ especialidades = [], onEdit, onDelete }) => {
  if (!especialidades.length) return <p className="text-gray-500">No hay especialidades disponibles.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-700">
        <thead className="bg-gray-100 font-semibold">
          <tr>
            <th className="px-3 py-2 border-b">Especialidad</th>
            <th className="px-3 py-2 border-b">Fecha</th>
            <th className="px-3 py-2 border-b">Observación</th>
            <th className="px-3 py-2 border-b">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {especialidades.map((e) => (
            <tr key={e.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 border-b">{e.categoria.nombre}</td>
              <td className="px-3 py-2 border-b">{e.fecha_vigencia}</td>
              <td className="px-3 py-2 border-b">{e.observacion || "-"}</td>
              <td>
                <button
                  onClick={() => onEdit?.(e)}
                  className="text-blue-600 hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete('especialidades', e)}
                  className="text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TablaEspecialidades;