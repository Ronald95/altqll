// ProtectedRoute.jsx - Versión Mejorada
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";

// Componente de loading mejorado
const LoadingSpinner = ({ message = "Verificando sesión..." }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  </div>
);

const ProtectedRoute = ({ 
  redirectTo = "/signin",
  requiredRole = null,
  fallback = null 
}) => {
  const { isAuthenticated, loading, user, checkAuth } = useAuth();
  const location = useLocation();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Verificar autenticación en montaje del componente
    const verifyAuth = async () => {
      if (isInitialLoad && !isAuthenticated && !loading) {
        try {
          await checkAuth();
        } catch (error) {
          console.error('Error verificando autenticación:', error);
        } finally {
          setIsInitialLoad(false);
        }
      } else {
        setIsInitialLoad(false);
      }
    };

    verifyAuth();
  }, [isAuthenticated, loading, checkAuth, isInitialLoad]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading || isInitialLoad) {
    return fallback || <LoadingSpinner />;
  }

  // Si no está autenticado, redirigir al login con la ubicación actual
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location.pathname + location.search }}
        replace 
      />
    );
  }

  // Verificar rol específico si se requiere
  if (requiredRole && user?.role !== requiredRole) {
    console.warn(`Acceso denegado. Rol requerido: ${requiredRole}, rol actual: ${user?.role}`);
    return (
      <Navigate 
        to="/unauthorized" 
        state={{ requiredRole, currentRole: user?.role }}
        replace 
      />
    );
  }

  // Usuario autenticado y con permisos, renderizar contenido protegido
  return <Outlet />;
};

// Variante para rutas que requieren roles específicos
export const AdminRoute = ({ fallback, ...props }) => (
  <ProtectedRoute 
    requiredRole="admin" 
    fallback={fallback}
    {...props} 
  />
);

export const ModeratorRoute = ({ fallback, ...props }) => (
  <ProtectedRoute 
    requiredRole="moderator" 
    fallback={fallback}
    {...props} 
  />
);

// Hook personalizado para verificar permisos en componentes
export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth();

  return {
    canAccess: (requiredRole) => {
      if (!isAuthenticated || !user) return false;
      if (!requiredRole) return true;
      return user.role === requiredRole || user.role === 'admin'; // Admin tiene acceso a todo
    },
    isAdmin: isAuthenticated && user?.role === 'admin',
    isModerator: isAuthenticated && user?.role === 'moderator',
    hasRole: (role) => isAuthenticated && user?.role === role
  };
};

export default ProtectedRoute;