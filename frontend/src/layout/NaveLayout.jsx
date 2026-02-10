import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useNave } from "../context/NaveContext";

export default function NaveLayout() {
  const { naveSeleccionada, setNaveSeleccionada } = useNave();
  const navigate = useNavigate();
  const location = useLocation();

  // 🔍 Si sales del módulo de naves, limpiar la nave seleccionada
  useEffect(() => {
    if (!location.pathname.startsWith("/naves")) {
      setNaveSeleccionada(null);
    }
  }, [location, setNaveSeleccionada]);

  // 🚨 Si no hay nave seleccionada y estás dentro de naves/detalle, redirige
  useEffect(() => {
    if (!naveSeleccionada && location.pathname.startsWith("/naves/detalle")) {
      navigate("/naves");
    }
  }, [naveSeleccionada, location, navigate]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ✅ El NaveHeader ya está en AppHeader, no lo duplicamos aquí */}
      <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950">
        <Outlet />
      </main>
    </div>
  );
}
