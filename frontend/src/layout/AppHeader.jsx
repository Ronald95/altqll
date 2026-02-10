import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";
import NaveHeader from "./NaveHeader";

const AppHeader = () => {
  const [isAppMenuOpen, setIsAppMenuOpen] = useState(false);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const location = useLocation();
  const inputRef = useRef(null);

  // 🔹 Mostrar NaveHeader solo en rutas que empiecen con /naves
  const mostrarNaveHeader = location.pathname.startsWith("/naves");

  // 🔹 Alternar menú lateral según tamaño de pantalla
  const handleToggleSidebar = () => {
    window.innerWidth >= 1024 ? toggleSidebar() : toggleMobileSidebar();
  };

  // 🔹 Atajo Ctrl/Cmd + K para enfocar búsqueda
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6 lg:py-4">
        {/* Botón de menú lateral */}
        <button
          onClick={handleToggleSidebar}
          aria-label="Toggle Sidebar"
          className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:w-11 lg:h-11"
        >
          {isMobileOpen ? (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.22 6.22a.75.75 0 0 1 1.06 0L12 10.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L13.06 12l4.72 4.72a.75.75 0 0 1-1.06 1.06L12 13.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06L10.94 12 6.22 7.28a.75.75 0 0 1 0-1.06Z"
                fill="currentColor"
              />
            </svg>
          ) : (
            <svg
              width="20"
              height="14"
              viewBox="0 0 20 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M1 1h18a1 1 0 0 1 0 2H1a1 1 0 1 1 0-2Zm0 10h18a1 1 0 0 1 0 2H1a1 1 0 0 1 0-2Zm0-5h12a1 1 0 0 1 0 2H1a1 1 0 0 1 0-2Z"
                fill="currentColor"
              />
            </svg>
          )}
        </button>

        {/* Contenido central */}
        <div className="flex items-center gap-3">
          {mostrarNaveHeader ? (
            <NaveHeader />
          ) : (
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-sm lg:text-base">
              Sistema de Gestión
            </p>
          )}
        </div>

        {/* Lado derecho */}
        <div className="flex items-center gap-2 2xsm:gap-3">
          <ThemeToggleButton />
          <NotificationDropdown />
          <UserDropdown />
        </div>
      </div>

      {/* Menú móvil (si lo usas) */}
      {isAppMenuOpen && (
        <div className="flex flex-col gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 lg:hidden animate-fadeIn">
          <Link
            to="/"
            className="text-gray-700 dark:text-gray-200 hover:text-cyan-600 transition-colors"
          >
            Inicio
          </Link>
          <Link
            to="/naves"
            className="text-gray-700 dark:text-gray-200 hover:text-cyan-600 transition-colors"
          >
            Naves
          </Link>
        </div>
      )}
    </header>
  );
};

export default AppHeader;
