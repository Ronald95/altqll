import apiClient from "../utils/auth";

const CertificadoNaveAPI = {
  async createCertificado(payload) {
    const response = await apiClient.post("/api/certificados-nave/", payload);
    return response.data;
  },

  async updateCertificado(id, payload) {
    const response = await apiClient.put(`/api/certificados-nave/${id}/`, payload);
    return response.data;
  },

  async deleteCertificado(id) {
    const response = await apiClient.delete(`/api/certificados-nave/${id}/`);
    return response.data;
  },

  async getCertificado() {
    const response = await apiClient.get("/api/certificados-nave/");
    return response.data;
  },

  // 🔹 Nuevo método: obtener una pirotecnia específica por su ID
  async getCertificadosByIdNave(id) {
    const response = await apiClient.get(`/api/certificados-nave/?nave=${id}`);
    return response.data;
  },

  async getCertificadosForSelect() {
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
      console.error("Error al cargar pirotecnia:", error);
      throw error;
    }
  },
};

export default CertificadoNaveAPI;
