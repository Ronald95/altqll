import apiClient from "../utils/auth";

const TipoNaveAPI = {
  async create(payload) {
    const response = await apiClient.post("/api/categorias-naves/", payload);
    return response.data;
  },

  async update(id, payload) {
    const response = await apiClient.put(`/api/categorias-naves/${id}/`, payload);
    return response.data;
  },

  async deleteTipoNave(id) {
    const response = await apiClient.delete(`/api/categorias-naves/${id}/`);
    return response.data;
  },

  async getTiposNave() {
    const response = await apiClient.get("/api/categorias-naves/");
    return response.data;
  },

  async getTiposNaveForSelect() {
    try {
      const response = await apiClient.get("/api/categorias-naves/");
      if (!Array.isArray(response.data)) {
        throw new Error("Formato de datos inválido");
      }
      return response.data.map((item) => ({
        value: item.id,
        label: item.nombre,
      }));
    } catch (error) {
      console.error("Error al cargar categorías de nave:", error);
      throw error;
    }
  },
};

export default TipoNaveAPI;
