import axios from "axios";

export const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:8000/";

const ENDPOINTS = {
  LOGIN:     'api/auth/login/',
  LOGOUT:    'api/auth/logout/',
  REFRESH:   'api/auth/token/refresh/',
  VERIFY:    'api/auth/token/verify/',
  USER_DATA: 'api/auth/home/'
};

// FIX #1: Ampliar HTTP_STATUS para cubrir 400 (Django Simple JWT devuelve 400,
// no 401, cuando no se envían credenciales en /verify/).
const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  BAD_REQUEST:  400,
  FORBIDDEN:    403,
};

const TOKEN_CONFIG = {
  ACCESS_LIFETIME_MS:  15 * 60 * 1000,
  REFRESH_BEFORE_MS:    2 * 60 * 1000,
};

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' }
});

let isRefreshing  = false;
let failedQueue   = [];
let refreshTimer  = null;
export let loggedOut = false;

const processQueue = (error, result = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(result));
  failedQueue = [];
};

const utils = {
  shouldSkipAuth(url) {
    const skip = [ENDPOINTS.LOGIN, ENDPOINTS.LOGOUT, ENDPOINTS.REFRESH, ENDPOINTS.VERIFY];
    return skip.some(ep => url?.includes(ep));
  },

  clearTokens() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("tokenTimestamp");
    this.stopAutoRefresh();
  },

  clearAll() {
    this.clearTokens();
    localStorage.removeItem("user_data");
  },

  redirectToSignIn() {
    loggedOut = true;
    processQueue(new Error("Usuario no autenticado"));
    this.clearAll();
    if (!window.location.pathname.includes('/signin')) {
      window.location.href = '/signin';
    }
  },

  handleError(error, operation) {
    const msg =
      error.response?.data?.detail  ||
      error.response?.data?.error   ||
      error.response?.data?.message ||
      error.message                  ||
      `Error en ${operation}`;
    console.error(`❌ ${operation}:`, msg, { status: error.response?.status });
    return new Error(msg);
  },

  scheduleAutoRefresh() {
    this.stopAutoRefresh();
    const timeUntilRefresh = TOKEN_CONFIG.ACCESS_LIFETIME_MS - TOKEN_CONFIG.REFRESH_BEFORE_MS;
    refreshTimer = setTimeout(() => authService.refreshToken(), timeUntilRefresh);
  },

  stopAutoRefresh() {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
  },

  saveTokens(access, refresh) {
    localStorage.setItem("accessToken",    access);
    localStorage.setItem("refreshToken",   refresh);
    localStorage.setItem("tokenTimestamp", Date.now().toString());
    this.scheduleAutoRefresh();
  },

  saveUserData(user) {
    localStorage.setItem("user_data", JSON.stringify({
      ...user,
      permissions: user.permissions || [],
      groups:      user.groups      || []
    }));
  },

  getUserData() {
    const data = localStorage.getItem("user_data");
    return data ? JSON.parse(data) : null;
  },

  // FIX #2: isTokenExpired distingue "expirado del todo" de "próximo a vencer".
  // ACCESS_LIFETIME_MS = vida total; si el elapsed lo supera, el token ya murió.
  isTokenExpired() {
    const timestamp = localStorage.getItem("tokenTimestamp");
    if (!timestamp) return true;
    return Date.now() - parseInt(timestamp) >= TOKEN_CONFIG.ACCESS_LIFETIME_MS;
  },

  shouldRefreshToken() {
    const timestamp = localStorage.getItem("tokenTimestamp");
    if (!timestamp) return false;
    const elapsed = Date.now() - parseInt(timestamp);
    return elapsed >= (TOKEN_CONFIG.ACCESS_LIFETIME_MS - TOKEN_CONFIG.REFRESH_BEFORE_MS);
  }
};

export const authService = {

  async login(username, password) {
    loggedOut = false;
    const res = await apiClient.post(ENDPOINTS.LOGIN, { username, password });
    const { access, refresh, user } = res.data;
    utils.saveTokens(access, refresh);
    utils.saveUserData(user);
    return res.data;
  },

  async logout() {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await apiClient.post(ENDPOINTS.LOGOUT, { refresh: refreshToken });
      }
    } catch (err) {
      console.warn('⚠️ Logout backend falló:', err.message);
    } finally {
      utils.redirectToSignIn();
    }
  },

  // FIX #3 — verifyAuth completamente reescrito.
  //
  // Problema original: llamaba a POST /verify y si fallaba con 400/401 volvía a
  // llamar refreshToken(). A su vez, el interceptor de response también intentaba
  // un refresh ante cualquier 401 en esa misma petición → triple refresh + 4 logs
  // de error en consola.
  //
  // Solución: eliminar la llamada a /verify. Django Simple JWT /verify solo valida
  // la firma del token; no aporta nada que no podamos saber localmente (timestamp).
  // La fuente de verdad real es /home/, que ya requiere auth y nos devuelve el user.
  // Si necesitas validación criptográfica en el servidor usa /verify solo tras un
  // refresh exitoso, no en cada carga de página.
  //
  // Flujo nuevo:
  //   1. Sin token → false
  //   2. Token expirado del todo → intentar refresh → si falla → false
  //   3. Token próximo a vencer  → refrescar proactivamente
  //   4. Token vigente           → true (sin red)
  async verifyAuth() {
    if (loggedOut) return false;

    const token = localStorage.getItem("accessToken");
    if (!token) return false;

    // Token completamente expirado: necesita refresh obligatorio
    if (utils.isTokenExpired()) {
      return await this.refreshToken();
    }

    // Token próximo a vencer: refrescar en segundo plano (no bloqueante)
    if (utils.shouldRefreshToken()) {
      this.refreshToken().catch(() => {});   // fire-and-forget; si falla, el
    }                                         // interceptor lo reintentará

    return true;
  },

  async getUserData(maxRetries = 2) {
    if (loggedOut) return null;
    let attempts = 0;

    while (attempts <= maxRetries) {
      try {
        const res = await apiClient.get(ENDPOINTS.USER_DATA, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
        });
        const freshData = res.data.user || res.data;

        const cachedUser = utils.getUserData() || {};
        const mergedUser = {
          ...cachedUser,
          ...freshData,
          permissions: freshData.permissions?.length
            ? freshData.permissions
            : cachedUser.permissions || [],
          groups: freshData.groups?.length
            ? freshData.groups
            : cachedUser.groups || [],
        };

        utils.saveUserData(mergedUser);
        return mergedUser;
      } catch (err) {
        attempts++;
        if (attempts > maxRetries) throw utils.handleError(err, 'getUserData');
        await new Promise(r => setTimeout(r, 1000 * attempts));
      }
    }
    return null;
  },

  async refreshToken() {
    if (loggedOut) return false;

    // FIX #4: Si ya hay un refresh en curso, encolar la promesa en lugar de lanzar
    // otra petición. Devuelve boolean para mantener la firma del método.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: () => resolve(true),
          reject:  () => resolve(false)   // resolve(false) en vez de reject
        });                                // evita uncaught promise en los callers
      });
    }

    const refresh = localStorage.getItem("refreshToken");
    if (!refresh) {
      utils.redirectToSignIn();
      return false;
    }

    isRefreshing = true;

    try {
      const res = await apiClient.post(ENDPOINTS.REFRESH, { refresh });
      const { access, refresh: newRefresh } = res.data;
      utils.saveTokens(access, newRefresh || refresh);
      processQueue(null, res);
      return true;
    } catch (err) {
      processQueue(err, null);
      // FIX #5: Solo redirigir si el error es de autenticación (401/400/403),
      // no ante errores de red (sin conexión).
      const status = err.response?.status;
      if (!status || [HTTP_STATUS.UNAUTHORIZED, HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.FORBIDDEN].includes(status)) {
        utils.redirectToSignIn();
      }
      return false;
    } finally {
      isRefreshing = false;
    }
  },

  // ─── Helpers de permisos y roles ──────────────────────────────────────────

  hasPermission(perm) {
    const user = utils.getUserData();
    if (!user) return false;
    if (user.is_superuser) return true;
    return user.permissions?.includes(perm) ?? false;
  },

  // FIX #6: hasAnyPermission y hasAllPermissions para lógica OR / AND,
  // habitual en rutas con múltiples permisos.
  hasAnyPermission(...perms) {
    return perms.some(p => this.hasPermission(p));
  },

  hasAllPermissions(...perms) {
    return perms.every(p => this.hasPermission(p));
  },

  hasGroup(groupName) {
    const user = utils.getUserData();
    return user?.groups?.includes(groupName) ?? false;
  },

  // FIX #7: hasAnyGroup para roles múltiples (ej. admin | moderator).
  hasAnyGroup(...groups) {
    return groups.some(g => this.hasGroup(g));
  },

  isStaff() {
    return !!(utils.getUserData()?.is_staff);
  },

  isSuperuser() {
    return !!(utils.getUserData()?.is_superuser);
  }
};

// ─── Interceptor REQUEST ────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem("accessToken");
    if (token && !utils.shouldSkipAuth(config.url)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// ─── Interceptor RESPONSE ───────────────────────────────────────────────────
// FIX #8: El interceptor original no chequeaba loggedOut antes de procesar,
// y no ignoraba errores de red (status undefined). Corregido.
apiClient.interceptors.response.use(
  res => res,
  async error => {
    const originalRequest = error.config;

    if (loggedOut) return Promise.reject(error);

    // Salir para endpoints de auth: evita el loop verify→refresh→verify
    if (utils.shouldSkipAuth(originalRequest.url)) return Promise.reject(error);

    // Solo actuar ante 401 (token expirado en mid-session), no ante 400 ni 403
    if (
      error.response?.status === HTTP_STATUS.UNAUTHORIZED &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const refreshed = await authService.refreshToken();
      if (refreshed) {
        originalRequest.headers.Authorization =
          `Bearer ${localStorage.getItem("accessToken")}`;
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

// ─── Init ───────────────────────────────────────────────────────────────────
export function initAuth() {
  const token     = localStorage.getItem("accessToken");
  const timestamp = localStorage.getItem("tokenTimestamp");
  if (!token || !timestamp) return false;

  const elapsed = Date.now() - parseInt(timestamp);
  if (elapsed >= TOKEN_CONFIG.ACCESS_LIFETIME_MS) {
    utils.clearTokens();
    return false;
  }

  const timeUntilRefresh =
    TOKEN_CONFIG.ACCESS_LIFETIME_MS - TOKEN_CONFIG.REFRESH_BEFORE_MS - elapsed;

  if (timeUntilRefresh > 0) {
    refreshTimer = setTimeout(() => authService.refreshToken(), timeUntilRefresh);
  } else {
    // Ya debería refrescarse: hacerlo inmediatamente
    authService.refreshToken();
  }

  return true;
}

export async function checkInitialAuth() {
  return await authService.verifyAuth();
}

export async function requireAuth() {
  const isAuth = await authService.verifyAuth();
  if (!isAuth && !window.location.pathname.includes('/signin')) {
    window.location.href = '/signin';
  }
  return isAuth;
}

export default apiClient;