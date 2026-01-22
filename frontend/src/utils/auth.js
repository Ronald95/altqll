import axios from "axios";


// Configuración y constantes
export const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:8000";

const ENDPOINTS = {
  LOGIN: '/api/auth/login/',
  LOGOUT: '/api/auth/logout/',
  LOGOUT_ALL: '/api/auth/logout-all/',
  REFRESH: '/api/auth/token/refresh/',  // ← Corregido: era /token/refresh/
  VERIFY: '/api/auth/token/verify/',    // ← Corregido: era /token/verify-auth/
  USER_DATA: '/api/auth/home/'             // ← Corregido: era /api/auth/home/
};

const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  BAD_REQUEST: 400
};

// Crear instancia de Axios
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,  // ← CRÍTICO: envía cookies httpOnly
  headers: { 
    'Accept': 'application/json', 
    'Content-Type': 'application/json' 
  }
});

// Variables globales para manejo de refresh
let isRefreshing = false;
let failedQueue = [];
export let loggedOut = false;

// Procesar cola de requests pendientes
const processQueue = (error, result = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(result);
    }
  });
  failedQueue = [];
};

// Utilidades
const utils = {
  /**
   * Verifica si la URL debe omitir autenticación
   */
  shouldSkipAuth(url) {
    const skipEndpoints = [
      ENDPOINTS.LOGIN, 
      ENDPOINTS.LOGOUT, 
      ENDPOINTS.LOGOUT_ALL,
      ENDPOINTS.REFRESH
    ];
    return skipEndpoints.some(endpoint => url.includes(endpoint));
  },

  /**
   * Redirige a la página de login
   */
  redirectToSignIn() {
    loggedOut = true;
    processQueue(new Error("Usuario no autenticado"));
    
    // Limpiar storage local si es necesario
    sessionStorage.clear();
    
   // Detectar si no hay token
  const accessToken = getAccessTokenFromCookies(); // tu función que lee cookies
  if (!accessToken) {
    console.log('🔒 No hay token, redirigiendo...');
    window.location.href = '/signin'; // pantalla de login
  }
  },

  /**
   * Manejo centralizado de errores
   */
  handleError(error, operation) {
    const msg = error.response?.data?.detail || 
                error.response?.data?.error || 
                error.response?.data?.message || 
                error.message || 
                `Error en ${operation}`;
    
    console.error(`❌ Error en ${operation}:`, {
      message: msg,
      status: error.response?.status,
      data: error.response?.data
    });
    
    return new Error(msg);
  }
};

// Servicio de autenticación
export const authService = {
  /**
   * Login de usuario
   */
  async login(username, password) {
    if (!username || !password) {
      throw new Error('Username y password son requeridos');
    }

    loggedOut = false;
    
    try {
      console.log('🔐 Iniciando login...');
      const response = await apiClient.post(ENDPOINTS.LOGIN, { 
        username, 
        password 
      });
      
      console.log('✅ Login exitoso:', response.data);
      return response.data;
    } catch (error) {
      throw utils.handleError(error, 'login');
    }
  },

  /**
   * Logout del usuario actual
   */
async logout() {
  let response;
  try {
    console.log('🚪 Cerrando sesión...');
    response = await apiClient.post(ENDPOINTS.LOGOUT);
    console.log('✅ Logout exitoso');
  } catch (error) {
    console.error('⚠️ Error en logout (continuando):', error.message);
  } finally {
    // Si el backend devuelve redirect, úsalo
    if (response?.data?.redirect) {
      window.location.href = response.data.redirect;
    } else {
      // fallback a la pantalla de bienvenida
      window.location.href = '/';
    }
  }
},


  /**
   * Logout global (todas las sesiones)
   */
  async logoutAll() {
    let response;
    try {
      console.log('🚪 Cerrando todas las sesiones...');
      response = await apiClient.post(ENDPOINTS.LOGOUT_ALL);
      console.log('✅ Logout global exitoso');
    } catch (error) {
      console.error('⚠️ Error en logout global (continuando):', error.message);
    } finally {
  // Si el backend devuelve redirect, úsalo
  if (response?.data?.redirect) {
    window.location.href = response.data.redirect;
  } else {
    // fallback a la pantalla de bienvenida
    window.location.href = '/';
  }
}

  },

  /**
   * Verificar si el usuario está autenticado
   */
  async verifyAuth() {
    // Si ya sabemos que hizo logout, no intentar verificar
    if (loggedOut) {
      return false;
    }

    try {
      const response = await apiClient.get(ENDPOINTS.VERIFY);
      console.log('✅ Usuario autenticado:', response.data);
      return true;
    } catch (error) {
      // Si ya hizo logout, retornar false silenciosamente
      if (loggedOut) {
        return false;
      }

      // Si es 401, el usuario no está autenticado
      if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
        console.log('⚠️ Usuario no autenticado');
        return false;
      }
      // Log solo si no estamos en página de signin
      if (!window.location.pathname.includes('/signin')) {
        console.error('❌ Error verificando autenticación:', error.message);
      }
      
      return false;
    }
  },

  /**
   * Obtener datos del usuario
   */
  async getUserData(maxRetries = 2) {
    if (loggedOut) {
      console.log('⚠️ Usuario no autenticado, no se pueden obtener datos');
      return null;
    }

    let attempts = 0;
    
    while (attempts <= maxRetries) {
      try {
        console.log(`📡 Obteniendo datos del usuario (intento ${attempts + 1}/${maxRetries + 1})...`);
        const response = await apiClient.get(ENDPOINTS.USER_DATA);
        console.log('✅ Datos de usuario obtenidos:', response.data);
        return response.data;
      } catch (error) {
        attempts++;
        
        // Si es el último intento, lanzar error
        if (attempts > maxRetries) {
          throw utils.handleError(error, 'getUserData');
        }
        
        // Espera incremental entre reintentos
        const delay = 1000 * attempts;
        console.log(`⏳ Reintentando en ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return null;
  },

  /**
   * Refrescar el access token usando el refresh token
   */
  async refreshToken() {
    // No intentar refresh si ya hizo logout
    if (loggedOut) {
      console.log('⚠️ No se puede refrescar token después de logout');
      return false;
    }

    // Si ya hay un refresh en progreso, encolar el request
    if (isRefreshing) {
      console.log('⏳ Refresh en progreso, encolando request...');
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      });
    }

    isRefreshing = true;

    try {
      console.log('🔄 Refrescando access token...');
      const response = await apiClient.post(ENDPOINTS.REFRESH);
      
      console.log('✅ Token refrescado exitosamente');
      processQueue(null, response);
      return true;
    } catch (error) {
      console.error('❌ Error refrescando token:', error.message);
      processQueue(error, null);

      // Si el refresh falla con 401 o 400, redirigir a login
      if (!loggedOut && 
          [HTTP_STATUS.UNAUTHORIZED, HTTP_STATUS.BAD_REQUEST].includes(error.response?.status)) {
        console.log('🔒 Refresh token inválido, cerrando sesión...');
        utils.redirectToSignIn();
      }

      return false;
    } finally {
      isRefreshing = false;
    }
  }
};

// ============================================
// INTERCEPTORES DE AXIOS
// ============================================

/**
 * Interceptor de Request (opcional - para debugging)
 */
apiClient.interceptors.request.use(
  config => {
    // Log de requests (comentar en producción)
    console.log(`📤 ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    console.error('❌ Error en request:', error);
    return Promise.reject(error);
  }
);

/**
 * Interceptor de Response - Manejo automático de 401
 */
apiClient.interceptors.response.use(
  response => {
    // Request exitoso
    return response;
  },
  async error => {
    const originalRequest = error.config;

    // Si ya hizo logout, no procesar más
    if (loggedOut) {
      return Promise.reject(error);
    }

    // Si es 401 y no es un endpoint que debe saltarse
    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED &&
        !originalRequest._retry &&
        !utils.shouldSkipAuth(originalRequest.url)) {
      
      console.log('⚠️ 401 detectado, intentando refresh...');
      originalRequest._retry = true;

      // Intentar refrescar el token
      const refreshed = await authService.refreshToken();

      if (refreshed) {
        console.log('✅ Reintentando request original...');
        return apiClient(originalRequest);
      } else {
        console.log('❌ Refresh falló, redirigiendo a login...');
        utils.redirectToSignIn();
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// HELPERS ADICIONALES
// ============================================

/**
 * Verifica si el usuario está autenticado al cargar la app
 */
export async function checkInitialAuth() {
  try {
    const isAuth = await authService.verifyAuth();
    return isAuth;
  } catch (error) {
    console.error('Error verificando auth inicial:', error);
    return false;
  }
}

/**
 * Hook para rutas protegidas
 */
export async function requireAuth() {
  const isAuth = await authService.verifyAuth();
  
  if (!isAuth && !window.location.pathname.includes('/signin')) {
    console.log('🔒 Ruta protegida - redirigiendo a login');
    window.location.href = '/signin'; 
    return false;
  }
  
  return isAuth;
}


// ============================================
// DEBUGGING
// ============================================

/**
 * Función de debugging para verificar estado
 */
export function debugAuth() {
  console.log('🔍 Estado de autenticación:', {
    loggedOut,
    isRefreshing,
    failedQueueLength: failedQueue.length,
    currentPath: window.location.pathname,
    apiUrl: API_URL
  });
}

// Exportar cliente de axios por si se necesita para otros servicios
export default apiClient;