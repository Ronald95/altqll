// ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";

// Spinner mientras se verifica auth
const LoadingSpinner = ({ message = "Verificando sesión..." }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  </div>
);

/**
 * ProtectedRoute
 * @param {string|string[]} groups - Grupos permitidos
 * @param {string|string[]} permissions - Permisos requeridos
 * @param {string} redirectTo - Ruta login
 * @param {ReactNode} fallback - Componente mientras se verifica
 */
const ProtectedRoute = ({
  groups = null,
  permissions = null,
  redirectTo = "/signin",
  fallback = null
}) => {
  const { isAuthenticated, loading, hasPermission, hasGroup } = useAuth();
  const location = useLocation();


  // Spinner mientras se verifica
  if (loading) {
    return fallback || <LoadingSpinner />;
  }

  // No autenticado → login
if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }


  // Verificar grupos
if (groups) {
    const groupArray = Array.isArray(groups) ? groups : [groups];
    const hasAny = groupArray.some(g => hasGroup(g));
    if (!hasAny) return <Navigate to="/unauthorized" replace />;
  }

  // Verificar permisos
  if (permissions) {
    const permArray = Array.isArray(permissions) ? permissions : [permissions];
    const hasAny = permArray.some(p => hasPermission(p));
    if (!hasAny) return <Navigate to="/unauthorized" replace />;
  }
  // Todo ok → renderizar children
  return <Outlet />;
};

export default ProtectedRoute;

/* ============================
   Rutas específicas de ejemplo
=============================== */
export const AdminRoute = ({ fallback, ...props }) => (
  <ProtectedRoute groups="admin" fallback={fallback} {...props} />
);

export const MultiGroupRoute = ({ groups, permissions, fallback, ...props }) => (
  <ProtectedRoute groups={groups} permissions={permissions} fallback={fallback} {...props} />
);

/* ============================
   Hook para usar permisos en componentes
=============================== */
export const usePermissions = () => {
  const { hasPermission, hasGroup, isAuthenticated } = useAuth();

  return {
    can: (permissions) => isAuthenticated && (!permissions || hasPermission(permissions)),
    canAny: (permissions) => isAuthenticated && (!permissions || hasPermission(permissions)),
    inGroup: (group) => isAuthenticated && hasGroup(group),
    inAnyGroup: (groups) => isAuthenticated && hasGroup(groups)
  };
};