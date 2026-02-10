import apiClient from "../utils/auth";

const PirotecniaNaveAPI = {
  async createPirotecnia(payload) {
    const response = await apiClient.post("/api/pirotecnia/", payload);
    return response.data;
  },

  async updatePirotecnia(id, payload) {
    const response = await apiClient.put(`/api/pirotecnia/${id}/`, payload);
    return response.data;
  },

  async deletePirotecnia(id) {
    const response = await apiClient.delete(`/api/pirotecnia/${id}/`);
    return response.data;
  },
  // 🔹 Nuevo método: obtener una pirotecnia específica por su ID
  async getPirotecniaByIdNave(id) {
    const response = await apiClient.get(`/api/pirotecnia/?nave=${id}`);
    return response.data;
  },

  async getPirotecniaForSelect() {
    try {
      const response = await apiClient.get("/api/pirotecnia/");
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      return data.map((item) => ({
        value: item.id,
        label: `${item.tipo_nombre || "Sin tipo"} (${item.cantidad})`,
      }));
    } catch (error) {
      console.error("Error al cargar pirotecnia:", error);
      throw error;
    }
  },
};

export default PirotecniaNaveAPI;
