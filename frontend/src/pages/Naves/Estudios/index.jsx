import React, { useState, useEffect } from "react";
import {
  Plus,
  FileText,
  Calendar,
  Package,
  Weight,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Ship,
  AlertCircle,
} from "lucide-react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Modal } from "../../../components/ui/modal";
import { useModal } from "../../../hooks/useModal";
import { useNave } from "../../../context/NaveContext";
import EstudioNaveAPI from "../../../api/estudioNave";
import FormEstudios from "../../../components/ui/modal/naves/FormEstudios";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";

export default function Index() {
  const [estudios, setEstudios] = useState([]);
  const [naveInfo, setNaveInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const { naveSeleccionada, setNaveSeleccionada } = useNave();
  const { nave_id } = useParams();
  const { isOpen: isOpenModal, openModal, closeModal } = useModal();

  useEffect(() => {
    const loadNave = async () => {
      try {
        if (naveSeleccionada) {
          setNaveInfo(naveSeleccionada);
        } else if (nave_id) {
          const res = await axios.get(`/api/naves/${nave_id}/`);
          setNaveInfo(res.data);
          setNaveSeleccionada(res.data);
        }
      } catch (error) {
        console.error("Error al cargar la nave:", error);
        setNaveInfo(null);
      }
    };

    loadNave();
  }, [naveSeleccionada, nave_id, setNaveSeleccionada]);

  useEffect(() => {
    const fetchEstudios = async (id) => {
      try {
        setLoading(true);
        const response = await EstudioNaveAPI.getEstudioNaveByIdNave(id);
        setEstudios(response);
      } catch (error) {
        console.error("Error al cargar estudios:", error);
      } finally {
        setLoading(false);
      }
    };

    const id = naveSeleccionada?.id || naveInfo?.id || nave_id;
    if (id) fetchEstudios(id);
  }, [naveSeleccionada, naveInfo, nave_id]);

  const handleEdit = (item) => {
    setEditingItem(item);
    openModal();
  };

  const handleManualesUpdated = (newItem) => {
    setEstudios((prev) => {
      if (newItem.isUpdated && newItem.id) {
        return prev.map((item) => (item.id === newItem.id ? newItem : item));
      }
      return [newItem, ...prev];
    });
    closeModal();
    setEditingItem(null);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Sin fecha";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const calcularPesoTotal = (detalles) => {
    if (!detalles || detalles.length === 0) return "0.00";
    return detalles
      .reduce((sum, det) => sum + parseFloat(det.peso_total_tons || 0), 0)
      .toFixed(2);
  };

  return (
    <div className="space-y-6">
      <PageMeta
        title={"Estudios y manuales " + naveSeleccionada.nombre}
        description="Estudios y manuales"
      />
      <PageBreadcrumb
        homeLabel="Detalle nave"
        homeLink={`/naves/${naveSeleccionada.id}`}
        pageTitle={"Estudios y manuales " + naveSeleccionada.nombre}
      />
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header Principal */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <FileText className="h-7 w-7" />
              <div>
                <h1 className="text-2xl font-bold">Estudios y manuales</h1>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingItem(null);
                openModal();
              }}
              disabled={!naveInfo}
              className={`px-6 py-3 rounded-xl flex items-center gap-2.5 font-semibold transition-all duration-300 shadow-lg ${
                naveInfo
                  ? "bg-white text-blue-600 hover:bg-blue-50 hover:shadow-xl hover:scale-105"
                  : "bg-blue-400/50 text-blue-200 cursor-not-allowed"
              }`}
            >
              <Plus className="h-5 w-5" />
              <span>Nuevo Documento</span>
            </button>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="p-8">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0 left-0"></div>
              </div>
              <p className="text-slate-500 mt-4 font-medium">
                Cargando documentos...
              </p>
            </div>
          ) : estudios.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-slate-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <FileText className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">
                No hay documentos registrados
              </h3>
              <p className="text-slate-500 mb-6">
                Comienza agregando un nuevo registro de estudio o manual
              </p>
              <button
                onClick={() => {
                  setEditingItem(null);
                  openModal();
                }}
                disabled={!naveInfo}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-5 w-5" />
                Crear primer documento
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {estudios.map((estudio) => {
                const isExpanded = expandedId === estudio.id;
                const pesoTotal = calcularPesoTotal(estudio.detalles);
                const cantidadItems = estudio.detalles?.length || 0;

                return (
                  <div
                    key={estudio.id}
                    className="group border-2 border-slate-200 rounded-2xl overflow-hidden hover:border-blue-300 hover:shadow-2xl transition-all duration-300 bg-white"
                  >
                    {/* Cabecera del Estudio */}
                    <div className="bg-gradient-to-r from-slate-50 via-white to-blue-50 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-4 mb-3">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                              <FileCheck className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-slate-800 mb-2">
                                {estudio.categoria?.nombre || "Sin categoría"}
                              </h3>
                              <div className="flex flex-wrap items-center gap-4 text-sm">
                                <span className="flex items-center gap-2 text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                                  <Calendar className="h-4 w-4 text-blue-600" />
                                  <span className="font-medium">Aprobado:</span>
                                  <span>
                                    {formatDate(estudio.fecha_aprobacion)}
                                  </span>
                                </span>
                                <span className="flex items-center gap-2 text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                                  <Package className="h-4 w-4 text-blue-600" />
                                  <span className="font-bold">
                                    {cantidadItems}
                                  </span>
                                  <span>
                                    {cantidadItems === 1 ? "item" : "items"}
                                  </span>
                                </span>
                                {pesoTotal !== "0.00" && (
                                  <span className="flex items-center gap-2 text-blue-700 bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 font-semibold">
                                    <Weight className="h-4 w-4" />
                                    <span>{pesoTotal} tons</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {estudio.observacion && (
                            <div className="ml-16 mt-3 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                              <p className="text-sm text-slate-700 italic">
                                <span className="font-semibold text-amber-700">
                                  Nota:
                                </span>{" "}
                                {estudio.observacion}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Botones de Acción */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(estudio)}
                            className="p-2.5 hover:bg-blue-50 rounded-xl transition-all hover:scale-110 group/edit"
                            title="Editar documento"
                          >
                            <Edit className="h-5 w-5 text-slate-600 group-hover/edit:text-blue-600" />
                          </button>
                          <button
                            className="p-2.5 hover:bg-red-50 rounded-xl transition-all hover:scale-110 group/delete"
                            title="Eliminar documento"
                          >
                            <Trash2 className="h-5 w-5 text-slate-600 group-hover/delete:text-red-600" />
                          </button>
                          {cantidadItems > 0 && (
                            <button
                              onClick={() => toggleExpand(estudio.id)}
                              className="ml-2 p-2.5 hover:bg-blue-50 rounded-xl transition-all hover:scale-110"
                              title={
                                isExpanded
                                  ? "Contraer detalles"
                                  : "Expandir detalles"
                              }
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-6 w-6 text-blue-600" />
                              ) : (
                                <ChevronDown className="h-6 w-6 text-blue-600" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detalles Expandibles */}
                    {isExpanded &&
                      estudio.detalles &&
                      estudio.detalles.length > 0 && (
                        <div className="border-t-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                          <div className="p-6">
                            <div className="flex items-center gap-2 mb-5">
                              <Package className="h-5 w-5 text-blue-600" />
                              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                Detalles de Carga
                              </h4>
                              <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-200 to-transparent"></div>
                            </div>
                            <div className="grid gap-4">
                              {estudio.detalles.map((detalle, idx) => (
                                <div
                                  key={detalle.id}
                                  className="bg-white border-2 border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                                >
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-blue-100 text-blue-700 font-bold text-sm px-3 py-1.5 rounded-lg">
                                      #{idx + 1}
                                    </div>
                                    <h5 className="font-bold text-slate-800 text-lg flex-1">
                                      {detalle.nombre}
                                    </h5>
                                  </div>
                                  {detalle.descripcion && (
                                    <p className="text-sm text-slate-600 mb-4 pl-12 italic">
                                      {detalle.descripcion}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-3 pl-12">
                                    <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md">
                                      Cantidad: {detalle.cantidad}
                                    </span>
                                    {detalle.peso_total_tons && (
                                      <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md">
                                        <Weight className="inline h-4 w-4 mr-1" />
                                        {detalle.peso_total_tons} tons
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={isOpenModal} onClose={closeModal} className="max-w-6xl">
        <FormEstudios
          isOpen={isOpenModal}
          onClose={closeModal}
          item={editingItem}
          onItemUpdated={handleManualesUpdated}
        />
      </Modal>
    </div>
  );
}
