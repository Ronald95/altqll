const TablaCursos = ({ cursos = [], onEdit, onDelete }) => {
  if (!cursos.length) return <p className="text-gray-500">No hay cursos disponibles.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-700">
        <thead className="bg-gray-100 font-semibold">
          <tr>
            <th className="px-3 py-2 border-b">Curso</th>
            <th className="px-3 py-2 border-b">Fecha</th>
            <th className="px-3 py-2 border-b">Estado</th>
            <th className="px-3 py-2 border-b">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {cursos.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 border-b">{c.categoria.nombre}</td>
              <td className="px-3 py-2 border-b">{c.fecha_vigencia}</td>
              <td className="px-3 py-2 border-b">{c.estado || "Activo"}</td>
              <td>
                <button
                  onClick={() => onEdit?.(c)}
                  className="text-blue-600 hover:underline"
                >
                  Editar
                </button>
                 <button
                  onClick={() => onDelete('cursos', c)}
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

export default TablaCursos;