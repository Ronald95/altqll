import apiClient from "../utils/auth";

const TipoCertificadoNaveAPI = {
  async createTipoCertificado(payload) {
    const response = await apiClient.post("/api/categorias-certificados/", payload);
    return response.data;
  },

  async updateTipoCertificado(id, payload) {
    const response = await apiClient.put(`/api/categorias-certificados/${id}/`, payload);
    return response.data;
  },

  async deleteTipoCertificado(id) {
    const response = await apiClient.delete(`/api/categorias-certificados/${id}/`);
    return response.data;
  },

  async getTiposCertificado() {
    const response = await apiClient.get("/api/categorias-certificados/");
    return response.data;
  },

  async getTiposCertificadoForSelect() {
    try {
      const response = await apiClient.get("/api/categorias-certificados/");
      if (!Array.isArray(response.data)) {
        throw new Error("Formato de datos inválido");
      }
      return response.data.map((item) => ({
        value: item.id,
        label: item.nombre,
      }));

      console.log(response.data);
    } catch (error) {
      console.error("Error al cargar tipos de certificado:", error);
      throw error;
    }
  },
};

export default TipoCertificadoNaveAPI;
