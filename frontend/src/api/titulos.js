// api/trabajadores.js
import apiClient from "../utils/auth";

const TitulosAPI = {

   async create(payload) {
    const response = await apiClient.post("/api/titulos/", payload);
    return response.data;
  },

  async update(id, payload) {
    const response = await apiClient.patch(`/api/titulos/${id}/`, payload);
    return response.data;
  },

  async delete(id) {
    const response = await apiClient.delete(`/api/titulos/${id}/`);
    return response.data;
  },
  /**
   * Obtener lista de matrículas formateados para Select
   */
  async getTitulosForSelect() {
    try {
      const response = await apiClient.get("/api/titulos/");

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
   * Obtener lista completa de titulos
   */
  async list() {
    try {
      const response = await apiClient.get("/api/titulos/");
      return response.data;
    } catch (error) {
      console.error("Error al listar titulos:", error);
      throw error;
    }
  }
};

export default TitulosAPI;
