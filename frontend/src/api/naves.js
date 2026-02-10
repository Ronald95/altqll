import apiClient from "../utils/auth";

const NavesAPI = {
  async createNave(payload, isFormData = false) {
    const config = isFormData
      ? { headers: { "Content-Type": "multipart/form-data" } }
      : {};

    const response = await apiClient.post("/api/naves/", payload, config);
    return response.data;
  },

  async updateNave(id, payload, isFormData = false) {
    const config = isFormData
      ? { headers: { "Content-Type": "multipart/form-data" } }
      : {};

    const response = await apiClient.put(`/api/naves/${id}/`, payload, config);
    return response.data;
  },

  async deleteNave(id) {
    const response = await apiClient.delete(`/api/naves/${id}/`);
    return response.data;
  },

  async getNaves() {
    const response = await apiClient.get("/api/naves/");
    return response.data;
  },
   async getDashboard() {
    const response = await apiClient.get("/api/dashboard/naves/");
    return response;
  },

    async getNavesForSelect() {
      try {
        const response = await apiClient.get("/api/naves/select/");
        if (!Array.isArray(response.data)) {
          throw new Error("Formato de datos inválido, se esperaba un array");
        }
        return response.data.map((item) => ({
          value: item.id,
          label: item.nombre,
        }));
      } catch (error) {
        console.error("Error al cargar naves:", error);
        throw error;
      }
    },

  async getNaveById(id) {
    try {
      const response = await apiClient.get(`/api/naves/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error al cargar la nave con id ${id}:`, error);
      throw error;
    }
  },

  async getNavesDetalles() {
    try {
      const response = await apiClient.get(`/api/naves/detalles/`);
      return response.data;
    } catch (error) {
      console.error(`Error al cargar detalles de naves:`, error);
      throw error;
    }
  },
};

export default NavesAPI;
