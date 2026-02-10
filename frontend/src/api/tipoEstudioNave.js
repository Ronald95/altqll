import apiClient from "../utils/auth";

const TipoEstudioNaveAPI = {
  async createTipoEstudio(payload) {
    const response = await apiClient.post("/api/tipo_estudio/", payload);
    return response.data;
  },

  async updateTipoEstudio(id, payload) {
    const response = await apiClient.put(`/api/tipo_estudio/${id}/`, payload);
    return response.data;
  },

  async deleteTipoEstudio(id) {
    const response = await apiClient.delete(`/api/tipo_estudio/${id}/`);
    return response.data;
  },

  async getTiposEstudio() {
    const response = await apiClient.get("/api/tipo_estudio/");
    return response.data;
  },

  async getTiposEstudioForSelect() {
    try {
      const response = await apiClient.get("/api/tipo_estudio/");
      if (!Array.isArray(response.data)) {
        throw new Error("Formato de datos inválido");
      }
      return response.data.map((item) => ({
        value: item.id,
        label: item.nombre,
      }));


    } catch (error) {
      console.error("Error al cargar tipos de estudio:", error);
      throw error;
    }
  },
};

export default TipoEstudioNaveAPI;
