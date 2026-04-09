import apiClient from "../utils/auth";

const SUELDOS_API = {
  /**
   * Procesar PDF y Excel para generar comparación de sueldos
   * @param {File} pdfFile - Archivo PDF con liquidaciones
   * @param {File} excelFile - Archivo Excel con sueldos
   * @returns {Blob} - Archivo Excel resultante
   */
  async compararSueldos(pdfFile, excelFile) {
    try {
      const formData = new FormData();
      formData.append("pdf", pdfFile);
      formData.append("excel", excelFile);

      // Enviar al backend
      const response = await apiClient.post("/api/comparar-sueldos/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        responseType: "blob", // importante para archivos binarios
      });

      // Retornar el blob para descargar
      return response.data;
    } catch (error) {
      console.error("Error comparando sueldos:", error);
      throw error;
    }
  },
};

export default SUELDOS_API;