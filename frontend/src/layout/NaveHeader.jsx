import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useNave } from "../context/NaveContext";

export default function NaveHeader() {
  const { naveSeleccionada } = useNave();
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const menus = [
    {
      nombre: "Certificados",
      opciones: [
        { nombre: "Ver todos", link: "certificados" },
        { nombre: "Agregar", link: "certificados/agregar" },
      ],
    },
    {
      nombre: "Pirotecnia",
      opciones: [
        { nombre: "Ver detalle", link: "pirotecnia" },
        { nombre: "Agregar", link: "pirotecnia/agregar" },
      ],
    },
    {
      nombre: "Manuales y estudios",
      opciones: [{ nombre: "Manuales", link: "estudios" }],
    },
  ];

  // Cerrar dropdown si haces click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!naveSeleccionada) return null;

  return (
    <div
      ref={menuRef}
      className="relative flex items-center justify-between w-full px-4"
    >
      {/* 🛥️ Nombre de la nave */}
      <div className="flex items-center gap-2">
        <p className="text-base font-semibold text-gray-800 dark:text-gray-100 mr-2">
          {naveSeleccionada.nombre}
        </p>

        {/* Botón móvil */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-700 rounded-md border border-gray-300 dark:text-gray-200 dark:border-gray-600 lg:hidden"
          aria-label="Abrir menú"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={
                mobileMenuOpen
                  ? "M6 18L18 6M6 6l12 12"
                  : "M4 6h16M4 12h16M4 18h16"
              }
            />
          </svg>
        </button>
      </div>

      {/* 💻 Menú Desktop */}
      <nav className="hidden lg:flex items-center gap-6">
        {menus.map((menu) => (
          <div key={menu.nombre} className="relative">
            <button
              onClick={() =>
                setOpenMenu(openMenu === menu.nombre ? null : menu.nombre)
              }
              className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-cyan-600 transition-colors"
            >
              {menu.nombre}
              <svg
                className={`w-4 h-4 transition-transform ${
                  openMenu === menu.nombre ? "rotate-180 text-cyan-600" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown */}
            {openMenu === menu.nombre && (
              <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-2 animate-fade-in z-50">
                {menu.opciones.map((opcion) => (
                  <Link
                    key={opcion.link}
                    to={`/naves/${naveSeleccionada.id}/${opcion.link}`}
                    onClick={() => setOpenMenu(null)}
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-cyan-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    {opcion.nombre}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* 📱 Menú Mobile */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 flex flex-col divide-y divide-gray-100 dark:divide-gray-700 lg:hidden animate-slide-down">
          {menus.map((menu) => (
            <div key={menu.nombre} className="flex flex-col p-2">
              <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                {menu.nombre}
              </p>
              {menu.opciones.map((opcion) => (
                <Link
                  key={opcion.link}
                  to={`/naves/${naveSeleccionada.id}/${opcion.link}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-200 rounded-md hover:bg-cyan-50 dark:hover:bg-gray-700 transition"
                >
                  {opcion.nombre}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
