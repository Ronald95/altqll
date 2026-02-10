const TablaCertificados = ({ certificados = [], onEdit, onDelete }) => {
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
            <th className="px-3 py-2 border-b">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {certificados.map((c) => (
            <tr key={c.id} className={`${getRowColor(c.fecha_vigencia)} hover:opacity-90`}>
              <td className="px-3 py-2 border-b">{c.categoria.nombre}</td>
              <td className="px-3 py-2 border-b">{c.codigo}</td>
              <td className="px-3 py-2 border-b">{c.fecha_vigencia}</td>
              <td>
                <button
                  onClick={() => onEdit?.(c)}
                  className="text-blue-600 hover:underline"
                >
                  Editar
                </button>
                 <button
                  onClick={() => onDelete('certificados', c)}
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

export default TablaCertificados;   