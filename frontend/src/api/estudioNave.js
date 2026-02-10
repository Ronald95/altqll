import apiClient from "../utils/auth";

const EstudioNaveAPI = {
  async createEstudioNave(payload) {
    const response = await apiClient.post("/api/estudio_nave/", payload);
    return response.data;
  },

  async updateEstudioNave(id, payload) {
    const response = await apiClient.put(`/api/estudio_nave/${id}/`, payload);
    return response.data;
  },

  async deleteEstudioNave(id) {
    const response = await apiClient.delete(`/api/estudio_nave/${id}/`);
    return response.data;
  },

  async getEstudioNaveByIdNave(id) {
    const response = await apiClient.get(`/api/estudio_nave/?nave=${id}`);
    return response.data;
  },
  async getEstudiosNaveForSelect() {
    try {
      const response = await apiClient.get("/api/estudio_nave/");
      if (!Array.isArray(response.data)) {
        throw new Error("Formato de datos inválido");
      }
      return response.data.map((item) => ({
        value: item.id,
        label: item.nombre,
      }));

      console.log(response.data);
    } catch (error) {
      console.error("Error al cargar estudios de nave:", error);
      throw error;
    }
  },
};

export default EstudioNaveAPI;
