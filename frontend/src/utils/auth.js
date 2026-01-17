import axios from "axios";

// Configuración y constantes
export const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:8000";

const ENDPOINTS = {
  LOGIN: '/api/login/',
  LOGOUT: '/api/logout/',
  REFRESH: '/api/token/refresh/',
  VERIFY: '/api/token/verify-auth/',
  USER_DATA: '/api/home/'
};

const HTTP_STATUS = {
  UNAUTHORIZED: 401
};

// Crear instancia de Axios
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
});

// Variables globales
let isRefreshing = false;
let failedQueue = [];
export let loggedOut = false; // <-- exportable para AuthProvider

const processQueue = (error, result = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(result));
  failedQueue = [];
};

const utils = {
  shouldSkipAuth(url) {
    const skip = [ENDPOINTS.LOGIN, ENDPOINTS.LOGOUT, ENDPOINTS.REFRESH];
    return skip.some(u => url.includes(u));
  },
  redirectToSignIn() {
    loggedOut = true;
    processQueue(new Error("Usuario no autenticado"));
    if (!window.location.pathname.includes('/signin')) {
      window.location.href = '/signin';
    }
  },
  handleError(error, operation) {
    const msg = error.response?.data?.detail || error.response?.data?.message || error.message || `Error en ${operation}`;
    console.error(`Error en ${operation}:`, msg);
    return new Error(msg);
  }
};

export const authService = {
  async login(username, password) {
    if (!username || !password) throw new Error('Username y password son requeridos');
    loggedOut = false;
    try {
      const res = await apiClient.post(ENDPOINTS.LOGIN, { username, password });
      return res.data;
    } catch (e) { throw utils.handleError(e, 'login'); }
  },

  async logout() {
    try {
      await apiClient.post(ENDPOINTS.LOGOUT);
    } catch (e) {
      console.error('Error logout', e);
    } finally {
      utils.redirectToSignIn();
    }
  },

  async verifyAuth() {
    if (loggedOut) return false;
    try {
      await apiClient.get(ENDPOINTS.VERIFY);
      return true;
    } catch (e) {
      if (loggedOut) return false;
      if (e.response?.status === HTTP_STATUS.UNAUTHORIZED) return false;
      if (!window.location.pathname.includes('/signin')) {
        console.error('Error verifyAuth', e);
      }
      return false;
    }
  },
  

  async getUserData(maxRetries = 1) {
    if (loggedOut) return null;
    let attempts = 0;
    while (attempts <= maxRetries) {
      try {
        const res = await apiClient.get(ENDPOINTS.USER_DATA);
        return res.data;
      } catch (e) {
        attempts++;
        if (attempts > maxRetries) throw utils.handleError(e, 'getUserData');
        await new Promise(r => setTimeout(r, 1000 * attempts));
      }
    }
  },

  async refreshToken() {
    if (loggedOut) return false;
    if (isRefreshing) {
      return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }));
    }
    isRefreshing = true;
    try {
      const res = await apiClient.post(ENDPOINTS.REFRESH);
      processQueue(null, res);
      return true;
    } catch (e) {
      processQueue(e, null);
    
      if (!loggedOut && [HTTP_STATUS.UNAUTHORIZED, 400].includes(e.response?.status)) {
        utils.redirectToSignIn();
      }
    
      return false;    
    } finally {
      isRefreshing = false;
    }
  }
};

// Interceptor 401 → refresh
apiClient.interceptors.response.use(
  r => r,
  async error => {
    const originalRequest = error.config;

    if (loggedOut) return Promise.reject(error);

    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED &&
        !originalRequest._retry &&
        !utils.shouldSkipAuth(originalRequest.url)) {
      
      originalRequest._retry = true;
      const refreshed = await authService.refreshToken();
      if (refreshed) return apiClient(originalRequest);
      utils.redirectToSignIn();
    }

    return Promise.reject(error);
  }
);

export default apiClient;
