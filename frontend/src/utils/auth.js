import axios from "axios";

// ============================================
// CONFIG
// ============================================

export const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:8000/";

const ENDPOINTS = {
  LOGIN: 'api/auth/login/',
  LOGOUT: 'api/auth/logout/',
  REFRESH: 'api/auth/token/refresh/',
  VERIFY: 'api/auth/token/verify/',
  USER_DATA: 'api/auth/home/'
};

const HTTP_STATUS = { UNAUTHORIZED: 401, BAD_REQUEST: 400 };

// Configuración de tokens
const TOKEN_CONFIG = {
  ACCESS_LIFETIME_MS: 15 * 60 * 1000, // 15 minutos
  REFRESH_BEFORE_MS: 2 * 60 * 1000,   // Refrescar 2 min antes de expirar
};

// ============================================
// CLIENTE AXIOS
// ============================================

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 
    'Accept': 'application/json', 
    'Content-Type': 'application/json' 
  }
});

// Variables globales
let isRefreshing = false;
let failedQueue = [];
let refreshTimer = null;
export let loggedOut = false;

// ============================================
// UTILIDADES
// ============================================

const processQueue = (error, result = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(result));
  failedQueue = [];
};

const utils = {
  shouldSkipAuth(url) {
    const skip = [ENDPOINTS.LOGIN, ENDPOINTS.LOGOUT, ENDPOINTS.REFRESH, ENDPOINTS.VERIFY];
    return skip.some(ep => url.includes(ep));
  },

  redirectToSignIn() {
    loggedOut = true;
    processQueue(new Error("Usuario no autenticado"));
    this.clearTokens();
    if (!window.location.pathname.includes('/signin')) window.location.href = '/signin';
  },

  clearTokens() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("tokenTimestamp");
    this.stopAutoRefresh();
  },

  handleError(error, operation) {
    const msg = error.response?.data?.detail ||
                error.response?.data?.error ||
                error.response?.data?.message ||
                error.message || 
                `Error en ${operation}`;
    console.error(`❌ ${operation}:`, msg, { status: error.response?.status });
    return new Error(msg);
  },

  scheduleAutoRefresh() {
    this.stopAutoRefresh();
    const timeUntilRefresh = TOKEN_CONFIG.ACCESS_LIFETIME_MS - TOKEN_CONFIG.REFRESH_BEFORE_MS;
    refreshTimer = setTimeout(async () => {
      console.log('🔄 Auto-refresh ejecutándose...');
      await authService.refreshToken();
    }, timeUntilRefresh);
    console.log(`⏰ Auto-refresh programado en ${timeUntilRefresh / 1000}s`);
  },

  stopAutoRefresh() {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
  },

  saveTokens(access, refresh) {
    localStorage.setItem("accessToken", access);
    localStorage.setItem("refreshToken", refresh);
    localStorage.setItem("tokenTimestamp", Date.now().toString());
    this.scheduleAutoRefresh();
  },

  shouldRefreshToken() {
    const timestamp = localStorage.getItem("tokenTimestamp");
    if (!timestamp) return false;
    const elapsed = Date.now() - parseInt(timestamp);
    const shouldRefresh = elapsed >= (TOKEN_CONFIG.ACCESS_LIFETIME_MS - TOKEN_CONFIG.REFRESH_BEFORE_MS);
    if (shouldRefresh) console.log('⚠️ Token cerca de expirar, necesita refresh');
    return shouldRefresh;
  }
};

// ============================================
// AUTHSERVICE
// ============================================

export const authService = {
  async login(username, password) {
    if (!username || !password) throw new Error('Username y password son requeridos');
    loggedOut = false;

    try {
      const res = await apiClient.post(ENDPOINTS.LOGIN, { username, password });
      const { access, refresh, user } = res.data;
      if (!access || !refresh) throw new Error('Respuesta de login inválida');
      utils.saveTokens(access, refresh);
      console.log('✅ Login exitoso, auto-refresh programado');
      console.log('👤 Usuario:', user);
      return res.data;
    } catch (err) {
      throw utils.handleError(err, 'login');
    }
  },

  async logout() {
    try { 
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) await apiClient.post(ENDPOINTS.LOGOUT, { refresh: refreshToken }); 
    } catch (err) { 
      console.warn('⚠️ Logout falló en backend:', err.message); 
    } finally { 
      utils.redirectToSignIn(); 
    }
  },

  async verifyAuth() {
    if (loggedOut) return false;
    const token = localStorage.getItem("accessToken");
    if (!token) return false;

    if (utils.shouldRefreshToken()) {
      console.log('🔄 Token por expirar, refrescando antes de verificar...');
      const refreshed = await this.refreshToken();
      if (!refreshed) return false;
    }

    try {
      await apiClient.get(ENDPOINTS.VERIFY, { headers: { Authorization: `Bearer ${token}` } });
      return true;
    } catch (err) {
      if ([HTTP_STATUS.UNAUTHORIZED, HTTP_STATUS.BAD_REQUEST].includes(err.response?.status)) {
        utils.redirectToSignIn();
      }
      return false;
    }
  },

  async getUserData(maxRetries = 2) {
    if (loggedOut) return null;
    let attempts = 0;
    while (attempts <= maxRetries) {
      try {
        const res = await apiClient.get(ENDPOINTS.USER_DATA, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
        });
        return res.data;
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
    if (isRefreshing) return new Promise((res, rej) => failedQueue.push({ resolve: res, reject: rej }));

    isRefreshing = true;
    const refresh = localStorage.getItem("refreshToken");
    if (!refresh) { utils.redirectToSignIn(); isRefreshing = false; return false; }

    try {
      const res = await apiClient.post(ENDPOINTS.REFRESH, { refresh });
      const { access, refresh: newRefresh } = res.data;
      utils.saveTokens(access, newRefresh || refresh);
      processQueue(null, res);
      console.log('✅ Token refrescado exitosamente');
      return true;
    } catch (err) {
      processQueue(err, null);
      utils.redirectToSignIn();
      return false;
    } finally {
      isRefreshing = false;
    }
  }
};

// ============================================
// INTERCEPTORES
// ============================================

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

apiClient.interceptors.response.use(
  res => res,
  async error => {
    const originalRequest = error.config;
    if (loggedOut) return Promise.reject(error);

    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED &&
        !originalRequest._retry &&
        !utils.shouldSkipAuth(originalRequest.url)) {

      originalRequest._retry = true;
      const refreshed = await authService.refreshToken();
      if (refreshed) {
        originalRequest.headers.Authorization = `Bearer ${localStorage.getItem("accessToken")}`;
        return apiClient(originalRequest);
      }
      utils.redirectToSignIn();
    }

    return Promise.reject(error);
  }
);

// ============================================
// INICIALIZACIÓN
// ============================================

export function initAuth() {
  const token = localStorage.getItem("accessToken");
  const timestamp = localStorage.getItem("tokenTimestamp");
  if (!token || !timestamp) return false;

  const elapsed = Date.now() - parseInt(timestamp);
  if (elapsed >= TOKEN_CONFIG.ACCESS_LIFETIME_MS) { utils.clearTokens(); return false; }

  const timeUntilRefresh = TOKEN_CONFIG.ACCESS_LIFETIME_MS - TOKEN_CONFIG.REFRESH_BEFORE_MS - elapsed;
  if (timeUntilRefresh > 0) {
    refreshTimer = setTimeout(() => authService.refreshToken(), timeUntilRefresh);
  } else {
    authService.refreshToken();
  }
  return true;
}

export async function checkInitialAuth() { return await authService.verifyAuth(); }
export async function requireAuth() {
  const isAuth = await authService.verifyAuth();
  if (!isAuth && !window.location.pathname.includes('/signin')) window.location.href = '/signin';
  return isAuth;
}

export function debugAuth() {
  const timestamp = localStorage.getItem("tokenTimestamp");
  const elapsed = timestamp ? Date.now() - parseInt(timestamp) : null;
  console.log('🔍 Auth debug:', { loggedOut, isRefreshing, failedQueueLength: failedQueue.length, currentPath: window.location.pathname, hasAccessToken: !!localStorage.getItem("accessToken"), tokenAge: elapsed ? `${(elapsed / 1000).toFixed(0)}s` : 'N/A', autoRefreshActive: !!refreshTimer });
}

export default apiClient;
