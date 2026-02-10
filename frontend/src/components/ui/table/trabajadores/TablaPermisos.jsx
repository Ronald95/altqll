const TablaPermisos = ({ permisos = [], onEdit, onDelete }) => {
  if (!permisos.length) return <p className="text-gray-500">No hay permisos disponibles.</p>;

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
          {permisos.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 border-b">{p.categoria.nombre}</td>
              <td className="px-3 py-2 border-b">{p.fecha_vigencia}</td>
              <td className="px-3 py-2 border-b">{p.observacion || "-"}</td>
              <td>
                <button
                  onClick={() => onEdit?.(p)}
                  className="text-blue-600 hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete('permisos', p)}
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

export default TablaPermisos;