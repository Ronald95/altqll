import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { authService, loggedOut as clientLoggedOut } from "../utils/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loggedOut, setLoggedOut] = useState(clientLoggedOut);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  const setAuthState = useCallback((userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setError(null);
  }, []);

  const checkAuth = useCallback(async (retryCount = 0) => {
    if (loggedOut) return false;
    try {
      const isAuth = await authService.verifyAuth();
      if (!isAuth) {
        clearAuthState();
        return false;
      }
      const userData = await authService.getUserData();
      setAuthState(userData);
      return true;
    } catch (err) {
      if (loggedOut) return false;
      if (err.response?.status === 401 && retryCount < 2) {
        const refreshSuccess = await authService.refreshToken();
        if (refreshSuccess) return await checkAuth(retryCount + 1);
      }
      clearAuthState();
      return false;
    }
  }, [setAuthState, clearAuthState, loggedOut]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    checkAuth().finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [checkAuth]);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    setLoggedOut(false);
    try {
      await authService.login(username, password);
      const authSuccess = await checkAuth();
      if (!authSuccess) throw new Error("Error al verificar autenticación después del login");
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setError(errorMessage);
      clearAuthState();
      return { success: false, error: errorMessage };
    } finally { setLoading(false); }
  };

  const logout = async () => {
    setLoading(true);
    setLoggedOut(true);
    try { await authService.logout(); } catch(e){ console.error(e); }
    finally { clearAuthState(); setLoading(false); }
  };

  const refreshUserData = async () => {
    if (!isAuthenticated || loggedOut) return null;
    try {
      const userData = await authService.getUserData();
      setUser(userData);
      return userData;
    } catch (error) {
      if (error.response?.status === 401) await checkAuth();
      throw error;
    }
  };

  const handleAuthError = useCallback(async (error) => {
    if (loggedOut) return false;
    if (error.response?.status === 401) {
      const isValid = await checkAuth();
      if (!isValid) clearAuthState();
      return isValid;
    }
    return true;
  }, [checkAuth, clearAuthState, loggedOut]);

  const contextValue = useMemo(() => ({
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    refreshUserData,
    checkAuth,
    handleAuthError,
    clearError: () => setError(null),
    hasRole: (role) => user?.role === role,
    isAdmin: user?.role === 'admin',
    canAccess: (requiredRole) => !requiredRole || user?.role === requiredRole || user?.role === 'admin'
  }), [user, isAuthenticated, loading, error, login, logout, refreshUserData, checkAuth, handleAuthError]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
}
