// api/certificados.js
import apiClient from "../utils/auth";

const CertificadosAPI = {
  /**
   * Crear un nuevo certificado
   * @param {FormData|Object} payload - Datos del certificado (FormData para imágenes)
   * @returns {Promise<Object>} Certificado creado
   */
  async create(payload) {
    try {
      const response = await apiClient.post("/api/certificados/", payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
      return response.data
    } catch (error) {
      console.error("Error al crear certificado:", error);
      throw this.handleError(error);
    }
  },

  /**
   * Actualizar un certificado existente
   * @param {string} id - ID del certificado
   * @param {FormData|Object} payload - Datos a actualizar
   * @returns {Promise<Object>} Certificado actualizado
   */
  async update(id, payload) {
    try {
      // Usar PATCH para actualización parcial (mejor para FormData)
      const response = await apiClient.patch(`/api/certificados/${id}/`, payload, {
        headers: {
        "Content-Type": "multipart/form-data",
      },
      });
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar certificado ${id}:`, error);
      throw this.handleError(error);
    }
  },

  /**
   * Eliminar un certificado
   * @param {string} id - ID del certificado
   * @returns {Promise<Object>} Respuesta de la eliminación
   */
  async delete(id) {
    try {
      const response = await apiClient.delete(`/api/certificados/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar certificado ${id}:`, error);
      throw this.handleError(error);
    }
  },

  /**
   * Obtener un certificado por ID
   * @param {string} id - ID del certificado
   * @returns {Promise<Object>} Certificado
   */
  async getById(id) {
    try {
      const response = await apiClient.get(`/api/certificados/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener certificado ${id}:`, error);
      throw this.handleError(error);
    }
  },

  /**
   * Obtener todos los certificados de un trabajador
   * @param {string} trabajadorId - ID del trabajador
   * @param {Object} params - Parámetros de filtro (opcional)
   * @returns {Promise<Array>} Lista de certificados
   */
  async getByTrabajador(trabajadorId, params = {}) {
    try {
      const queryParams = new URLSearchParams({
        trabajador: trabajadorId,
        ...params
      }).toString();
      
      const response = await apiClient.get(`/api/certificados/?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener certificados del trabajador ${trabajadorId}:`, error);
      throw this.handleError(error);
    }
  },

  /**
   * Obtener estadísticas de certificados
   * @param {string} trabajadorId - ID del trabajador (opcional)
   * @returns {Promise<Object>} Estadísticas
   */
  async getStats(trabajadorId = null) {
    try {
      const url = trabajadorId 
        ? `/api/certificados/stats/?trabajador=${trabajadorId}`
        : '/api/certificados/stats/';
      
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error("Error al obtener estadísticas de certificados:", error);
      throw this.handleError(error);
    }
  },

  /**
   * Buscar certificados
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Array>} Resultados de búsqueda
   */
  async search(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await apiClient.get(`/api/certificados/search/?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error("Error al buscar certificados:", error);
      throw this.handleError(error);
    }
  },

  /**
   * Verificar si un certificado está vigente
   * @param {string} id - ID del certificado
   * @returns {Promise<Object>} Estado de vigencia
   */
  async checkVigencia(id) {
    try {
      const response = await apiClient.get(`/api/certificados/${id}/vigencia/`);
      return response.data;
    } catch (error) {
      console.error(`Error al verificar vigencia del certificado ${id}:`, error);
      throw this.handleError(error);
    }
  },

  /**
   * Actualizar imagen específica de un certificado
   * @param {string} id - ID del certificado
   * @param {string} tipo - Tipo de imagen (frontal, trasera, extra)
   * @param {File} imagen - Archivo de imagen
   * @returns {Promise<Object>} Certificado actualizado
   */
  async updateImagen(id, tipo, imagen) {
    try {
      const formData = new FormData();
      formData.append(`foto_${tipo}`, imagen);
      
      const response = await apiClient.patch(`/api/certificados/${id}/update-imagen/`, formData);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar imagen ${tipo} del certificado ${id}:`, error);
      throw this.handleError(error);
    }
  },

  /**
   * Eliminar imagen específica de un certificado
   * @param {string} id - ID del certificado
   * @param {string} tipo - Tipo de imagen a eliminar
   * @returns {Promise<Object>} Certificado actualizado
   */
  async deleteImagen(id, tipo) {
    try {
      const response = await apiClient.delete(`/api/certificados/${id}/imagen/${tipo}/`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar imagen ${tipo} del certificado ${id}:`, error);
      throw this.handleError(error);
    }
  },

  /**
   * Establecer certificado como predeterminado
   * @param {string} id - ID del certificado
   * @returns {Promise<Object>} Certificado actualizado
   */
  async setAsDefault(id) {
    try {
      const response = await apiClient.patch(`/api/certificados/${id}/set-default/`, {});
      return response.data;
    } catch (error) {
      console.error(`Error al establecer certificado ${id} como predeterminado:`, error);
      throw this.handleError(error);
    }
  },

  /**
   * Obtener certificados próximos a vencer
   * @param {number} days - Días para alerta (por defecto 30)
   * @param {string} trabajadorId - ID del trabajador (opcional)
   * @returns {Promise<Array>} Certificados próximos a vencer
   */
  async getProximosVencer(days = 30, trabajadorId = null) {
    try {
      const params = { days };
      if (trabajadorId) params.trabajador = trabajadorId;
      
      const queryParams = new URLSearchParams(params).toString();
      const response = await apiClient.get(`/api/certificados/proximos-vencer/?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener certificados próximos a vencer:", error);
      throw this.handleError(error);
    }
  },

  /**
   * Generar reporte de certificados
   * @param {Object} filters - Filtros para el reporte
   * @returns {Promise<Blob>} Archivo del reporte
   */
  async generarReporte(filters = {}) {
    try {
      const response = await apiClient.post('/api/certificados/generar-reporte/', filters, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error("Error al generar reporte de certificados:", error);
      throw this.handleError(error);
    }
  },

  /**
   * Manejo centralizado de errores
   * @param {Error} error - Error original
   * @returns {Error} Error procesado
   */
  handleError(error) {
    // Puedes personalizar los mensajes de error según el código de estado
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return new Error(data.message || 'Datos inválidos. Por favor verifique la información.');
        case 401:
          return new Error('No autorizado. Por favor inicie sesión nuevamente.');
        case 403:
          return new Error('No tiene permisos para realizar esta acción.');
        case 404:
          return new Error('Certificado no encontrado.');
        case 413:
          return new Error('El archivo es demasiado grande. Máximo 10MB por imagen.');
        case 422:
          return new Error(data.detail || 'Error de validación. Revise los datos enviados.');
        case 500:
          return new Error('Error interno del servidor. Por favor intente más tarde.');
        default:
          return new Error(data.message || `Error ${status}: ${data.detail || 'Error desconocido'}`);
      }
    } else if (error.request) {
      return new Error('No se pudo conectar con el servidor. Verifique su conexión a internet.');
    } else {
      return new Error('Error al procesar la solicitud.');
    }
  }
};

export default CertificadosAPI;