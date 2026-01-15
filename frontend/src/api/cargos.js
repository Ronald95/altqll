import apiClient from "../utils/auth";

const CargosApi = {
  async createCargo(payload) {
    const response = await apiClient.post("/api/cargos/", payload);
    return response.data;
  },

  async updateCargo(id, payload) {
    const response = await apiClient.put(`/api/cargos/${id}/`, payload);
    return response.data;
  },

  async deleteCargo(id) {
    const response = await apiClient.delete(`/api/cargos/${id}/`);
    return response.data;
  },

  async getCargos() {
    const response = await apiClient.get("/api/cargos/");
    return response.data;
  },

  async getCargosForSelect() {
    try {
      const response = await apiClient.get("/api/cargos/");
      if (!Array.isArray(response.data)) {
        throw new Error("Formato de datos inválido");
      }
      return response.data.map((item) => ({
        value: item.id,
        label: item.nombre,
      }));


    } catch (error) {
      console.error("Error al cargar cargos:", error);
      throw error;
    }
  },
};

export default CargosApi;
