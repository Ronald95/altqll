// src/api/posat.js

import apiClient from "../utils/auth";

const PosatAPI = {
  // ─────────────────────────────
  // POSICIONES ACTUALES
  // ─────────────────────────────
  async getPosiciones() {
    try {
      const response = await apiClient.get("/api/cunlogan/posiciones/");
      return response.data;
    } catch (error) {
      console.error("❌ Error obteniendo posiciones:", error);
      throw error;
    }
  },

  // ─────────────────────────────
  // REPORTE SIMPLIFICADO
  // ─────────────────────────────
  async getReporte({ mobs, fecha_inicio, fecha_fin }) {
    try {
      const params = new URLSearchParams();

      if (mobs) params.append("mobs", mobs);
      if (fecha_inicio) params.append("fecha_inicio", fecha_inicio);
      if (fecha_fin) params.append("fecha_fin", fecha_fin);

      const response = await apiClient.get(
        `api/posat/reporte/?${params.toString()}`
      );

      return response.data;
    } catch (error) {
      console.error("❌ Error obteniendo reporte POSAT:", error);
      throw error;
    }
  },

  // ─────────────────────────────
  // 🔥 HELPER: APLANAR REPORTES
  // ─────────────────────────────
  async getReportePlano({ mobs, fecha_inicio, fecha_fin }) {
    const data = await this.getReporte({ mobs, fecha_inicio, fecha_fin });

    if (!data.success) {
      throw new Error("Respuesta inválida del servidor");
    }

    const dias = data.data.dias;

    // 🔥 flatten
    let puntos = [];

    dias.forEach((dia) => {
      dia.reportes.forEach((r) => {
        puntos.push({
          ...r,
          fecha: dia.fecha,
          fecha_display: dia.fecha_display,
          dia_semana: dia.dia_semana,
        });
      });
    });

    return {
      meta: {
        total_posiciones: data.data.total_posiciones,
        minutos_navegacion: data.data.minutos_navegacion,
        horas_navegacion: data.data.horas_navegacion,
        distancia_km: data.data.distancia_km,
        millas: data.data.millas_recorridas,
      },
      puntos,
    };
  },
};

export default PosatAPI;