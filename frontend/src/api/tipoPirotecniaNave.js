import apiClient from "../utils/auth";

const TipoPirotecniaNaveAPI = {
  async createTipoPirotecnia(payload) {
    const response = await apiClient.post("/api/categorias_pirotecnia/", payload);
    return response.data;
  },

  async updateTipoPirotecnia(id, payload) {
    const response = await apiClient.put(`/api/categorias_pirotecnia/${id}/`, payload);
    return response.data;
  },

  async deleteTipoPirotecnia(id) {
    const response = await apiClient.delete(`/api/categorias_pirotecnia/${id}/`);
    return response.data;
  },

  async getTiposPirotecnia() {
    const response = await apiClient.get("/api/categorias_pirotecnia/");
    return response.data;
  },

  async getTiposPirotecniaForSelect() {
    try {
      const response = await apiClient.get("/api/categorias_pirotecnia/");
      if (!Array.isArray(response.data)) {
        throw new Error("Formato de datos inválido");
      }
      return response.data.map((item) => ({
        value: item.id,
        label: item.nombre,
      }));
    } catch (error) {
      console.error("Error al cargar tipos de pirotecnia:", error);
      throw error;
    }
  },
};

export default TipoPirotecniaNaveAPI;
