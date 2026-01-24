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
 * @param {string|string[]} allowedRoles - Roles permitidos
 * @param {string} redirectTo - Ruta login
 * @param {ReactNode} fallback - Componente mientras se verifica
 */
const ProtectedRoute = ({ allowedRoles = null, redirectTo = "/signin", fallback = null }) => {
  const { isAuthenticated, loading, user, checkAuth } = useAuth();
  const location = useLocation();
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        await checkAuth();
      } catch (err) {
        console.error("Error verificando auth:", err);
      } finally {
        setInitialCheckDone(true);
      }
    };
    verify();
  }, [checkAuth]);

  if (loading || !initialCheckDone) {
    return fallback || <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = Array.isArray(allowedRoles)
      ? allowedRoles.includes(user?.role) || user?.role === "admin"
      : user?.role === allowedRoles || user?.role === "admin";

    if (!hasRole) {
      return (
        <Navigate
          to="/unauthorized"
          state={{ allowedRoles, currentRole: user?.role }}
          replace
        />
      );
    }
  }

  return <Outlet />;
};

// Rutas específicas
export const AdminRoute = ({ fallback, ...props }) => (
  <ProtectedRoute allowedRoles="admin" fallback={fallback} {...props} />
);

export const ModeratorRoute = ({ fallback, ...props }) => (
  <ProtectedRoute allowedRoles="moderator" fallback={fallback} {...props} />
);

export const MultiRoleRoute = ({ allowedRoles, fallback, ...props }) => (
  <ProtectedRoute allowedRoles={allowedRoles} fallback={fallback} {...props} />
);

// Hook para permisos en componentes
export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth();

  return {
    canAccess: (roles) => {
      if (!isAuthenticated || !user) return false;
      if (!roles) return true;
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(user.role) || user.role === "admin";
    },
    isAdmin: isAuthenticated && user?.role === "admin",
    isModerator: isAuthenticated && user?.role === "moderator",
    hasRole: (role) => isAuthenticated && user?.role === role
  };
};

export default ProtectedRoute;
