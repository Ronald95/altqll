import apiClient from "../utils/auth";

const PDF_SCAN = {
  // POST → procesar PDF
  async procesarPDF(file) {
    try {
      const formData = new FormData();
      formData.append("archivo", file);

      const response = await apiClient.post(
        "/api/procesar-pdf/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error procesando PDF:", error);
      throw error;
    }
  },

  // GET → obtener todos los PDFs del usuario
  async listarPDFs() {
    try {
      const response = await apiClient.get("/api/procesar-pdf/");
      return response.data; // Espera que el backend devuelva un array
    } catch (error) {
      console.error("Error obteniendo PDFs:", error);
      throw error;
    }
  },

  // DELETE → eliminar PDF por ID
  async eliminarPDF(id) {
    try {
      const response = await apiClient.delete(`/api/procesar-pdf/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error eliminando PDF con id ${id}:`, error);
      throw error;
    }
  },
};

export default PDF_SCAN;
