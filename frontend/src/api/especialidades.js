// api/trabajadores.js
import apiClient from "../utils/auth";

const EspecialidadesAPI = {

   async createEspecialidad(payload) {
    const response = await apiClient.post("/api/especialidades/", payload);
    return response.data;
  },

  async updateEspecialidad(id, payload) {
    const response = await apiClient.patch(`/api/especialidades/${id}/`, payload);
    return response.data;
  },

  async deleteEspecialidad(id) {
    const response = await apiClient.delete(`/api/especialidades/${id}/`);
    return response.data;
  },
  /**
   * Obtener lista de matrículas formateados para Select
   */
  async getEspecialidadesForSelect() {
    try {
      const response = await apiClient.get("/api/especialidades/");

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
   * Obtener lista completa de especialidades
   */
  async list() {
    try {
      const response = await apiClient.get("/api/especialidades/");
      return response.data;
    } catch (error) {
      console.error("Error al listar especialidades:", error);
      throw error;
    }
  }
};

export default EspecialidadesAPI;
