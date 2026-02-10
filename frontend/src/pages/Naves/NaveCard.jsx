import React, { useState } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";


const getColor = (percentage) => {
  if (percentage >= 100) return "#10b981"; // Verde más suave
  if (percentage >= 70) return "#f59e0b";
  return "#ef4444"; // Rojo más suave
};

const getEstado = (percentage) => {
  if (percentage >= 100) return "COMPLETO";
  if (percentage >= 70) return "EN PROGRESO";
  return "PENDIENTE";
};

const getEstadoIcon = (percentage) => {
  if (percentage >= 100) return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
  if (percentage >= 70) return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>
  );
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );
};

export default function NaveCard({ nave }) {
  const { nombre, porcentaje_completado, certificados = [] } = nave;

  const { isOpen: isOpenModal, openModal, closeModal } = useModal();

  return (
    <>
      <div
        className="group relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 p-6 flex flex-col items-center justify-between h-full cursor-pointer"
        onClick={openModal}
      >
        {/* Card Header */}
        <div className="w-full mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 truncate pr-2">{nombre}</h2>
            <span className={`p-2 rounded-lg ${
              porcentaje_completado >= 100
                ? "bg-emerald-50 text-emerald-600"
                : porcentaje_completado >= 70
                ? "bg-amber-50 text-amber-600"
                : "bg-red-50 text-red-600"
            }`}>
              {getEstadoIcon(porcentaje_completado)}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progreso</span>
              <span className="font-semibold text-gray-900">{porcentaje_completado}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{
                  width: `${porcentaje_completado}%`,
                  backgroundColor: getColor(porcentaje_completado),
                }}
              />
            </div>
          </div>
        </div>

        {/* Progress Circle */}
        <div className="relative w-40 h-40 mb-6">
          <CircularProgressbar
            value={porcentaje_completado}
            text={`${porcentaje_completado}%`}
            strokeWidth={10}
            styles={buildStyles({
              textSize: "24px",
              pathColor: getColor(porcentaje_completado),
              textColor: "#111827",
              trailColor: "#f3f4f6",
              pathTransitionDuration: 1,
              textStyle: {
                fontWeight: "bold"
              }
            })}
          />
        </div>

        {/* Footer */}
        <div className="w-full mt-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">Estado:</span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
              porcentaje_completado >= 100
                ? "bg-emerald-50 text-emerald-700"
                : porcentaje_completado >= 70
                ? "bg-amber-50 text-amber-700"
                : "bg-red-50 text-red-700"
            }`}>
              {getEstado(porcentaje_completado)}
            </span>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
            <span>Click para ver detalles</span>
            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
  <Modal
        isOpen={isOpenModal}
        onClose={closeModal}
        className="max-w-3xl max-h-[90vh] mx-4"
      >
        <div>
         <>
      {/* Overlay con backdrop-blur - z-index 1050 */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1050] transition-opacity"
        onClick={() => openModal()}
      />
      
      {/* Modal container - z-index 1060 */}
      <div className="fixed inset-0 flex items-center justify-center p-4 z-[1060]">
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{nombre}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold ${
                    porcentaje_completado >= 100
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : porcentaje_completado >= 70
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                    {getEstadoIcon(porcentaje_completado)}
                    {getEstado(porcentaje_completado)}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-600 font-medium">
                    {porcentaje_completado}% completado
                  </span>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors z-[1061] relative"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column - Progress Overview */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Progreso General</h3>
                  <div className="flex justify-center">
                    <div className="w-48 h-48">
                      <CircularProgressbar
                        value={porcentaje_completado}
                        text={`${porcentaje_completado}%`}
                        strokeWidth={10}
                        styles={buildStyles({
                          textSize: "28px",
                          pathColor: getColor(porcentaje_completado),
                          textColor: "#111827",
                          trailColor: "#f3f4f6",
                          pathTransitionDuration: 1,
                          textStyle: {
                            fontWeight: "bold"
                          }
                        })}
                      />
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Certificados totales:</span>
                        <span className="font-semibold">{certificados.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Certificados aprobados:</span>
                        <span className="font-semibold text-emerald-600">
                          {certificados.filter(c => c.estado === "OK").length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Certificados pendientes:</span>
                        <span className="font-semibold text-amber-600">
                          {certificados.filter(c => c.estado !== "OK").length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Certificates List */}
              <div>
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Certificados</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Estado de certificaciones requeridas
                    </p>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                    {certificados.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-500">No hay certificados requeridos</p>
                      </div>
                    ) : (
                      certificados.map((cert, idx) => (
                        <div key={idx} className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{cert.nombre}</h4>
                              {cert.fecha && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {cert.fecha}
                                </p>
                              )}
                              {cert.descripcion && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {cert.descripcion}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                                cert.estado === "OK"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-red-50 text-red-700 border border-red-200"
                              }`}>
                                {cert.estado === "OK" ? (
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {cert.estado}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
        </div>
      </Modal>
    </>
  );
}