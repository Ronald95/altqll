// api/trabajadores.js
import apiClient from "../utils/auth";

const TrabajadoresAPI = {

   async createTrabajador(payload) {
    const response = await apiClient.post("/api/trabajadores/", payload);
    return response.data;
  },

  async updateTrabajador(id, payload) {
    const response = await apiClient.patch(`/api/trabajadores/${id}/`, payload);
    return response.data;
  },

  async deleteTrabajador(id) {
    const response = await apiClient.delete(`/api/trabajadores/${id}/`);
    return response.data;
  },
  /**
   * Obtener lista de trabajadores formateados para Select
   */
  async getTrabajadoresForSelect() {
    try {
      const response = await apiClient.get("/api/trabajadores/");

      if (!Array.isArray(response.data)) {
        throw new Error("Formato de datos inválido, se esperaba un array");
      }

      return response.data.map((item) => ({
        value: item.id,
        label: item.nombre,
      }));
    } catch (error) {
      console.error("Error al cargar trabajadores:", error);
      throw error; // re-lanza para manejar en el componente
    }
  },
async getTrabajadorId(id) {
  try {
    const response = await apiClient.get("/api/trabajadores/" + id + "/");

    // Si es un array, devolverlo tal cual
    if (Array.isArray(response.data)) {
      return response.data[0] || null;
    }

    // Si es un objeto (retrieve), devolverlo directamente
    if (typeof response.data === "object" && response.data !== null) {
      return response.data;
    }

    throw new Error("Formato de datos inesperado");
  } catch (error) {
    console.error("Error al cargar trabajador:", error);
    throw error;
  }
},


  /**
   * Obtener lista completa de trabajadores
   */
  async list() {
    try {
      const response = await apiClient.get("/api/trabajadores/");
      return response.data;
    } catch (error) {
      console.error("Error al listar trabajadores:", error);
      throw error;
    }
  }
};

export default TrabajadoresAPI;
