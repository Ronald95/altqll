import React, { useState, useEffect } from "react";
import TablaCertificados from "./TablaCertificados";
import TablaCursos from "./TablaCursos";
import TablaEspecialidades from "./TablaEspecialidades";
import TablaTitulos from "./TablaTitulos";
import TablaPermisos from "./TablaPermisos";


export default function DashboardTrabajador({
  certificados = [],
  cursos = [],
  especialidades = [],
  titulos = [],
  permisos = [],
  onEditCertificado,
  onEditCurso,
  onEditEspecialidad,
  onEditPermiso,
  onEditTitulo,
  onDelete
}) {
  const [tab, setTab] = useState("");
  const [loading, setLoading] = useState(true);

  // Lista dinámica de tabs
  const tabs = [
    { key: "especialidades", label: "Especialidades", data: especialidades, component: TablaEspecialidades, onEdit: onEditEspecialidad },
    { key: "certificados", label: "Certificados", data: certificados, component: TablaCertificados, onEdit: onEditCertificado },
    { key: "cursos", label: "Cursos", data: cursos, component: TablaCursos, onEdit: onEditCurso },
    { key: "titulos", label: "Títulos", data: titulos, component: TablaTitulos, onEdit: onEditTitulo },
    { key: "permisos", label: "Permisos", data: permisos, component: TablaPermisos, onEdit: onEditPermiso },
  ];

  // Filtra solo tabs que tengan datos
  const availableTabs = tabs.filter(t => t.data && t.data.length > 0);

  // Setea tab inicial al primer disponible
  useEffect(() => {
    if (availableTabs.length > 0) {
      setTab(prev => prev || availableTabs[0].key);
    }
    setLoading(false);
  }, [certificados, cursos, especialidades, titulos, permisos]);

  // Spinner mientras cargan datos
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-b-4 border-gray-300"></div>
        <span className="ml-2">Cargando...</span>
      </div>
    );
  }

  // Mensaje si no hay ningún dato
  if (availableTabs.length === 0) {
    return <p className="text-gray-500 text-center">No hay información disponible.</p>;
  }

  return (
    <div className="p-4">
      {/* Tabs */}
      <div className="flex border-b mb-4">
        {availableTabs.map(tabItem => (
          <button
            key={tabItem.key}
            onClick={() => setTab(tabItem.key)}
            className={`px-4 py-2 -mb-px font-semibold border-b-2 ${
              tab === tabItem.key ? "border-blue-500 text-blue-600" : "border-transparent text-gray-600"
            }`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* Contenido del tab */}
      <div>
        {availableTabs.map(tabItem => {
          if (tab !== tabItem.key) return null;
          const Component = tabItem.component;
          return (
            <Component
              key={tabItem.key}
              {...{ [tabItem.key]: tabItem.data }}
              onEdit={tabItem.onEdit}
              onDelete={onDelete}
            />
          );
        })}
      </div>
    </div>
  );
}
