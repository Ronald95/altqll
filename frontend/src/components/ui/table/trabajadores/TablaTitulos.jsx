
const TablaTitulos = ({ titulos = [], onEdit, onDelete }) => {
  if (!titulos.length) return <p className="text-gray-500">No hay títulos disponibles.</p>;

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
          {titulos.map((t) => (
            <tr key={t.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 border-b">{t.categoria.nombre}</td>
              <td className="px-3 py-2 border-b">{t.fecha_vigencia}</td>
              <td className="px-3 py-2 border-b">{t.observacion || "-"}</td>
              <td>
                <button
                  onClick={() => onEdit?.(t)}
                  className="text-blue-600 hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete('titulos', t)}
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

export default TablaTitulos;