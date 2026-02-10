// NavesDashboard.jsx - Actualizado con mejores prácticas
import React, { useEffect, useState } from "react";
import NaveCard from "../Naves/NaveCard";
import Naves from "../../api/naves";

export default function NavesDashboard() {
  const [naves, setNaves] = useState([]);
  const [loading, setLoading] = useState(true);


useEffect(() => {
  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await Naves.getDashboard();
      setNaves(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      setNaves([]);
    } finally {
      setLoading(false);
    }
  };

  loadDashboard();
}, []);


  // Calcular estadísticas
const stats = {
    completas: naves.filter(n => (n.porcentaje_completado ?? 0) >= 100).length,
    total: naves.length,
    promedio: naves.length > 0
      ? Math.round(
          naves.reduce((acc, n) => acc + (n.porcentaje_completado ?? 0), 0) / naves.length
        )
      : 0
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="text-sm text-blue-600 font-medium">Naves Totales</div>
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <div className="text-sm text-green-600 font-medium">Completas</div>
          <div className="text-2xl font-bold text-gray-800">{stats.completas}</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
          <div className="text-sm text-purple-600 font-medium">Promedio General</div>
          <div className="text-2xl font-bold text-gray-800">{stats.promedio}%</div>
        </div>
      </div>

      {/* Grid de Naves */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {naves.map((nave) => (
          <NaveCard key={nave.id} nave={nave} />
        ))}
      </div>

      {/* Empty State */}
      {naves.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🚢</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay naves registradas</h3>
          <p className="text-gray-500">Agrega tu primera nave para comenzar</p>
        </div>
      )}
    </div>
  );
}