// api/trabajadores.js
import apiClient from "../utils/auth";

const MatriculasAPI = {

   async createMatricula(payload) {
    const response = await apiClient.post("/api/matriculas/", payload);
    return response.data;
  },

  async updateMatricula(id, payload) {
    const response = await apiClient.patch(`/api/matriculas/${id}/`, payload);
    return response.data;
  },

  async deleteMatricula(id) {
    const response = await apiClient.delete(`/api/matriculas/${id}/`);
    return response.data;
  },
  /**
   * Obtener lista de matrículas formateados para Select
   */
  async getMatriculasForSelect() {
    try {
      const response = await apiClient.get("/api/matriculas/");

      if (!Array.isArray(response.data)) {
        throw new Error("Formato de datos inválido, se esperaba un array");
      }

      return response.data.map((item) => ({
        value: item.id,
        label: item.nombre,
      }));
    } catch (error) {
      console.error("Error al cargar matrículas:", error);
      throw error; // re-lanza para manejar en el componente
    }
  },

  /**
   * Obtener lista completa de matrículas
   */
  async list() {
    try {
      const response = await apiClient.get("/api/matriculas/");
      return response.data;
    } catch (error) {
      console.error("Error al listar matrículas:", error);
      throw error;
    }
  }
};

export default MatriculasAPI;
