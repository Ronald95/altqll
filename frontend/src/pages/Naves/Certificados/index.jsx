import React, { useState, useEffect } from "react";
import { Plus, FileText } from "lucide-react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Modal } from "../../../components/ui/modal";
import { useModal } from "../../../hooks/useModal";
import { useNave } from "../../../context/NaveContext";
import FormCertificado from "../../../components/ui/modal/naves/FormCertificado";
import TableCertificado from "../../../components/ui/table/naves/TableCertificados";
import CertificadoAPI from "../../../api/certificadoNave";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";

export default function Index() {
  const [certificados, setCertificados] = useState([]);
  const [naveInfo, setNaveInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);

  const { naveSeleccionada, setNaveSeleccionada } = useNave();
  const { nave } = useParams();
  const { isOpen: isOpenModal, openModal, closeModal } = useModal();

  // 🔹 Cargar información de la nave
  useEffect(() => {
    const loadNave = async () => {
      try {
        if (naveSeleccionada) {
          setNaveInfo(naveSeleccionada);
        } else if (nave) {
          const res = await axios.get(`/api/naves/${nave}/`);
          setNaveInfo(res.data);
          setNaveSeleccionada(res.data);
        }
      } catch (error) {
        console.error("Error al cargar la nave:", error);
        setNaveInfo(null);
      }
    };

    loadNave();
  }, [naveSeleccionada, nave, setNaveSeleccionada]);

  // 🔹 Cargar registros de certificados
  useEffect(() => {
    const fetchCertificados = async (id) => {
      try {
        setLoading(true);
        const response = await CertificadoAPI.getAllByIdNave(id);
        setCertificados(response);
      } catch (error) {
        console.error("Error al cargar certificados:", error);
      } finally {
        setLoading(false);
      }
    };

    const id = naveSeleccionada?.id || naveInfo?.id || nave;
    if (id) fetchCertificados(id);
  }, [naveSeleccionada, naveInfo, nave]);

  // 🔹 Abrir modal en modo edición
  const handleEdit = (item) => {
    setEditingItem(item);
    console.log(item);
    openModal();
  };

  // 🔹 Actualizar lista después de crear/editar
  const handleCertificadoUpdated = (newItem) => {
    setCertificados((prev) => {
      if (newItem.isUpdated && newItem.id) {
        return prev.map((item) => (item.id === newItem.id ? newItem : item));
      }
      return [newItem, ...prev];
    });
    closeModal();
    setEditingItem(null);
  };

  // 🔹 Cerrar modal (manual o botón)
  const handleCloseModal = () => {
    closeModal();
    setEditingItem(null);
  };

  return (
     <div className="space-y-6">
      <PageMeta
        title={"Certificados " + naveSeleccionada.nombre}
        description="Certificados"
      />
      <PageBreadcrumb
        homeLabel="Detalle nave"
        homeLink={`/naves/${naveSeleccionada.id}`}
        pageTitle={"Certificados " + naveSeleccionada.nombre}
      />
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* 🔹 Encabezado */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-slate-700" />
            <div>
              <h1 className="text-lg font-semibold">Certificados</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingItem(null);
                openModal();
              }}
              disabled={!naveInfo}
              className={`px-3 py-2 rounded-md flex items-center gap-2 ${
                naveInfo
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <Plus className="h-4 w-4" /> Nuevo certificado
            </button>
          </div>
        </div>

        {/* 🔹 Contenido principal */}
        <div className="p-6">
          {loading ? (
            <div className="text-center text-slate-500 py-10">
              Cargando certificados...
            </div>
          ) : (
            <TableCertificado data={certificados} onEdit={handleEdit} />
          )}
        </div>
      </div>

      {/* 🔹 Modal genérico */}
      <Modal
        isOpen={isOpenModal}
        onClose={handleCloseModal}
        className="max-w-4xl max-h-[90vh] mx-4"
      >
        <FormCertificado
          isOpen={isOpenModal}
          onClose={handleCloseModal}
          item={editingItem}
          onItemUpdated={handleCertificadoUpdated}
        />
      </Modal>
    </div>
  );
}
