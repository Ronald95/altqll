import apiClient from "../utils/auth";

const CertificadoNaveAPI = {
  async create(payload) {
    const response = await apiClient.post("/api/certificados-nave/", payload);
    return response.data;
  },

  async update(id, payload) {
    const response = await apiClient.put(`/api/certificados-nave/${id}/`, payload);
    return response.data;
  },

  async delete(id) {
    const response = await apiClient.delete(`/api/certificados-nave/${id}/`);
    return response.data;
  },

  async getAll() {
    const response = await apiClient.get("/api/certificados-nave/");
    return response.data;
  },

  // 🔹 Nuevo método: obtener una pirotecnia específica por su ID
  async getAllByIdNave(id) {
    const response = await apiClient.get(`/api/certificados-nave/?nave=${id}`);
    return response.data;
  },

  async getAllForSelect() {
    try {
      const response = await apiClient.get("/api/certificados-nave/");
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      return data.map((item) => ({
        value: item.id,
        label: `${item.tipo_nombre || "Sin tipo"} (${item.cantidad})`,
      }));
    } catch (error) {
      console.error("Error al cargar certificado:", error);
      throw error;
    }
  },
};

export default CertificadoNaveAPI;
