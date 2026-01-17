// api/trabajadores.js
import apiClient from "../utils/auth";

const TipoMatriculaAPI = {

   async createTipoMatricula(payload) {
    const response = await apiClient.post("/api/tipo_matricula/", payload);
    return response.data;
  },

  async updateTipoMatricula(id, payload) {
    const response = await apiClient.patch(`/api/tipo_matricula/${id}/`, payload);
    return response.data;
  },

  async deleteTipoMatricula(id) {
    const response = await apiClient.delete(`/api/tipo_matricula/${id}/`);
    return response.data;
  },
  /**
   * Obtener lista de tipo de matrículas formateados para Select
   */
  async getForSelect() {
    try {
      const response = await apiClient.get("/api/tipo_matricula/");

      if (!Array.isArray(response.data)) {
        throw new Error("Formato de datos inválido, se esperaba un array");
      }

      return response.data.map((item) => ({
        value: item.id,
        label: item.nombre,
      }));
    } catch (error) {
      console.error("Error al cargar tipo de matrículas:", error);
      throw error; // re-lanza para manejar en el componente
    }
  },

  /**
   * Obtener lista completa de tipo de matrículas
   */
  async list() {
    try {
      const response = await apiClient.get("/api/tipo_matricula/");
      return response.data;
    } catch (error) {
      console.error("Error al listar tipo de matrículas:", error);
      throw error;
    }
  }
};

export default TipoMatriculaAPI;
