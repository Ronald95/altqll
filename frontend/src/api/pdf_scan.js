import apiClient from "../utils/auth";

const PDF_SCAN = {
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
};

export default PDF_SCAN;
