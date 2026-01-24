// AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authService, checkInitialAuth } from "../utils/auth";

// Export nombrado
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Inicialización de auth al cargar la app
  const initializeAuth = useCallback(async () => {
    setLoading(true);
    try {
      const valid = await checkInitialAuth();
      if (valid) {
        const userData = await authService.getUserData();
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error("Error inicializando auth:", err);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Login
  const login = async (username, password) => {
    setLoading(true);
    try {
      const data = await authService.login(username, password);
      setUser(data.user);
      setIsAuthenticated(true);
      return data;
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      console.warn("Error en logout:", err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  // Re-verificar autenticación
  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      const valid = await authService.verifyAuth();
      if (valid) {
        const userData = await authService.getUserData();
        setUser(userData);
        setIsAuthenticated(true);
        return true;
      } else {
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }
    } catch (err) {
      console.error("Error verificando auth:", err);
      setUser(null);
      setIsAuthenticated(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado
export const useAuth = () => useContext(AuthContext);
