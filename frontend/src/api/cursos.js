// api/trabajadores.js
import apiClient from "../utils/auth";

const CursosAPI = {

   async create(payload) {
    const response = await apiClient.post("/api/cursos/", payload);
    return response.data;
  },

  async update(id, payload) {
    const response = await apiClient.patch(`/api/cursos/${id}/`, payload);
    return response.data;
  },

  async delete(id) {
    const response = await apiClient.delete(`/api/cursos/${id}/`);
    return response.data;
  },
  /**
   * Obtener lista de matrículas formateados para Select
   */
  async getCursosForSelect() {
    try {
      const response = await apiClient.get("/api/cursos/");

      if (!Array.isArray(response.data)) {
        throw new Error("Formato de datos inválido, se esperaba un array");
      }

      return response.data.map((item) => ({
        value: item.id,
        label: item.nombre,
      }));
    } catch (error) {
      console.error("Error al cargar cursos:", error);
      throw error; // re-lanza para manejar en el componente
    }
  },
    async getCategoriasCursosForSelect() {
    try {
      const response = await apiClient.get("/api/categorias_curso/");

      if (!Array.isArray(response.data)) {
        throw new Error("Formato de datos inválido, se esperaba un array");
      }

      return response.data.map((item) => ({
        value: item.id,
        label: item.nombre,
      }));
    } catch (error) {
      console.error("Error al cargar categorias de cursos:", error);
      throw error; // re-lanza para manejar en el componente
    }
  },

};

export default CursosAPI;
