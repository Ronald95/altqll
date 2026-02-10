// api/trabajadores.js
import apiClient from "../utils/auth";

const PermisosAPI = {

   async create(payload) {
    const response = await apiClient.post("/api/permisos/", payload);
    return response.data;
  },

  async update(id, payload) {
    const response = await apiClient.patch(`/api/permisos/${id}/`, payload);
    return response.data;
  },

  async delete(id) {
    const response = await apiClient.delete(`/api/permisos/${id}/`);
    return response.data;
  },
  /**
   * Obtener lista de matrículas formateados para Select
   */
  async getPermisosForSelect() {
    try {
      const response = await apiClient.get("/api/permisos/");

      if (!Array.isArray(response.data)) {
        throw new Error("Formato de datos inválido, se esperaba un array");
      }

      return response.data.map((item) => ({
        value: item.id,
        label: item.nombre,
      }));
    } catch (error) {
      console.error("Error al cargar especialidades:", error);
      throw error; // re-lanza para manejar en el componente
    }
  },
    async getCategoriasEspecialidadesForSelect() {
    try {
      const response = await apiClient.get("/api/categorias_especialidad/");

      if (!Array.isArray(response.data)) {
        throw new Error("Formato de datos inválido, se esperaba un array");
      }

      return response.data.map((item) => ({
        value: item.id,
        label: item.nombre,
      }));
    } catch (error) {
      console.error("Error al cargar categorias de especialidades:", error);
      throw error; // re-lanza para manejar en el componente
    }
  },
  
    async getCategoriasCertificadosForSelect() {
    try {
      const response = await apiClient.get("/api/categorias_certificado/");

      if (!Array.isArray(response.data)) {
        throw new Error("Formato de datos inválido, se esperaba un array");
      }
      return response.data.map((item) => ({
        value: item.id,
        label: item.nombre,
      }));
    } catch (error) {
      console.error("Error al cargar categorias de certificados:", error);
      throw error; // re-lanza para manejar en el componente
    }
  },



  /**
   * Obtener lista completa de permisos
   */
  async list() {
    try {
      const response = await apiClient.get("/api/permisos/");
      return response.data;
    } catch (error) {
      console.error("Error al listar permisos:", error);
      throw error;
    }
  }
};

export default PermisosAPI;
