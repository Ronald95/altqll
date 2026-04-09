import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authService, checkInitialAuth } from "../utils/auth";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  /* ===============================
     1. ESTADO INICIAL DESDE STORAGE
  =============================== */
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user_data");
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return {
      ...parsed,
      permissions: parsed.permissions || [],
      groups: parsed.groups || []
    };
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("accessToken"));
  const [loading, setLoading] = useState(true);

  /* ===============================
     2. HELPERS DERIVADOS
  =============================== */
  const permissions = user?.permissions || [];
  const groups = user?.groups || [];

  /* ===============================
     3. PERSISTENCIA
  =============================== */
  const saveAuthData = useCallback((userData) => {
    const fullUser = {
      ...userData,
      permissions: userData.permissions || [],
      groups: userData.groups || []
    };
    setUser(fullUser);
    setIsAuthenticated(true);
    localStorage.setItem("user_data", JSON.stringify(fullUser));
  }, []);

  const clearAuthData = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("user_data");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }, []);

  /* ===============================
     4. HELPERS DE PERMISOS
  =============================== */
  const hasPermission = useCallback((perm) => {
    if (!user) return false;
    if (user.is_superuser) return true;
    return permissions.includes(perm);
  }, [permissions, user]);

  const hasAnyPermission = useCallback((permList) => {
    if (!user) return false;
    if (user.is_superuser) return true;
    return permList.some(p => permissions.includes(p));
  }, [permissions, user]);

  const hasGroup = useCallback((group) => {
    if (!user) return false;
    if (user.is_superuser) return true;
    return groups.includes(group);
  }, [groups, user]);

  const hasAnyGroup = useCallback((groupList) => {
    if (!user) return false;
    if (user.is_superuser) return true;
    return groupList.some(g => groups.includes(g));
  }, [groups, user]);

  /* ===============================
     5. INICIALIZAR SESIÓN
  =============================== */
const initializeAuth = useCallback(async () => {
  setLoading(true);
  try {
    const hasToken = !!localStorage.getItem("accessToken");
    if (!hasToken) {
      clearAuthData();
      return;
    }

    const valid = await checkInitialAuth();
    if (valid) {
      const response = await authService.getUserData();
      const freshData = response.user || response;

      // Recuperar datos guardados para no perder permisos si el servidor
      // no los devuelve en esta llamada
      const saved = localStorage.getItem("user_data");
      const cachedUser = saved ? JSON.parse(saved) : {};

      const mergedUser = {
        ...cachedUser,     // base: lo que había en cache
        ...freshData,      // sobreescribir con datos frescos del servidor
        permissions: freshData.permissions?.length
          ? freshData.permissions
          : cachedUser.permissions || [],
        groups: freshData.groups?.length
          ? freshData.groups
          : cachedUser.groups || [],
      };

      saveAuthData(mergedUser);
    } else {
      clearAuthData();
    }
  } catch (err) {
    console.error("Error inicializando sesión:", err);
  } finally {
    setLoading(false);
  }
}, [saveAuthData, clearAuthData]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  /* ===============================
     6. LOGIN
  =============================== */
  const login = async (username, password) => {
    setLoading(true);
    try {
      const data = await authService.login(username, password);
      saveAuthData({
        ...data.user,
        permissions: data.user.permissions || [],
        groups: data.user.groups || []
      });
      return data;
    } catch (err) {
      clearAuthData();
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     7. LOGOUT
  =============================== */
  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      console.warn("Error en logout:", err);
    } finally {
      clearAuthData();
      setLoading(false);
    }
  };

  /* ===============================
     8. CHECK MANUAL
  =============================== */
  const checkAuth = useCallback(async () => {
    try {
      const valid = await authService.verifyAuth();
      if (!valid) {
        clearAuthData();
        return false;
      }

      const userData = await authService.getUserData();
      saveAuthData({
        ...userData,
        permissions: userData.permissions || [],
        groups: userData.groups || []
      });

      return true;
    } catch {
      clearAuthData();
      return false;
    }
  }, [saveAuthData, clearAuthData]);

  /* ===============================
     9. CONTEXTO
  =============================== */
  const value = {
    user,
    permissions,
    groups,
    isAuthenticated,
    loading,
    login,
    logout,
    checkAuth,
    hasPermission,
    hasAnyPermission,
    hasGroup,
    hasAnyGroup
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);