import React, { useState, useEffect } from "react";
import { Plus, FileText } from "lucide-react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Modal } from "../../../components/ui/modal";
import { useModal } from "../../../hooks/useModal";
import { useNave } from "../../../context/NaveContext";
import FormPirotecnia from "../../../components/ui/modal/naves/FormPirotecnia";
import TablePirotecnia from "../../../components/ui/table/naves/TablePirotecnia";
import PirotecniaNaveAPI from "../../../api/pirotecniaNave";
import DeleteConfirmModal from "../../../components/ui/modal/dialog/DeleteConfirm"; // <-- IMPORTANTE
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";

export default function Index() {
  const [pirotecnia, setPirotecnia] = useState([]);
  const [naveInfo, setNaveInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);

  const { naveSeleccionada, setNaveSeleccionada } = useNave();
  const { nave_id } = useParams();
  const { isOpen: isOpenModal, openModal, closeModal } = useModal();

  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState(null);

  // 🔹 Abrir modal de confirmación
  const confirmDelete = (item) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  // 🔹 Eliminar definitivamente luego de confirmar
  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await PirotecniaNaveAPI.deletePirotecnia(itemToDelete.id);

      // Sacar del listado
      setPirotecnia((prev) => prev.filter((p) => p.id !== itemToDelete.id));

      console.log("Eliminado correctamente");
    } catch (error) {
      console.error("Error eliminando:", error);
    }

    setDeleteModalOpen(false); // cerrar modal
    setItemToDelete(null);     // limpiar estado
  };

  // 🔹 Cargar información de la nave
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

  // 🔹 Cargar registros de pirotecnia
  useEffect(() => {
    const fetchPirotecnia = async (id) => {
      try {
        setLoading(true);
        const response = await PirotecniaNaveAPI.getPirotecniaByIdNave(id);
        setPirotecnia(response);
      } catch (error) {
        console.error("Error al cargar pirotecnia:", error);
      } finally {
        setLoading(false);
      }
    };

    const id = naveSeleccionada?.id || naveInfo?.id || nave_id;
    if (id) fetchPirotecnia(id);
  }, [naveSeleccionada, naveInfo, nave_id]);

  // 🔹 Abrir modal en modo edición
  const handleEdit = (item) => {
    setEditingItem(item);
    openModal();
  };

  // 🔹 Actualizar lista luego de guardar/editar
  const handlePirotecniaUpdated = (newItem) => {
    setPirotecnia((prev) => {
      if (newItem.isUpdated && newItem.id) {
        return prev.map((p) => (p.id === newItem.id ? newItem : p));
      }
      return [newItem, ...prev];
    });

    closeModal();
    setEditingItem(null);
  };

  // 🔹 Cerrar modal de formulario
  const handleCloseModal = () => {
    closeModal();
    setEditingItem(null);
  };

  return (
     <div className="space-y-6">
      <PageMeta
        title={"Pirotecnia " + naveSeleccionada.nombre}
        description="Pirotecnia"
      />
      <PageBreadcrumb
        homeLabel="Detalle nave"
        homeLink={`/naves/${naveSeleccionada.id}`}
        pageTitle={"Pirotecnia " + naveSeleccionada.nombre}
      />
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <FileText className="h-7 w-7" />
            <div>
              <h1 className="text-2xl font-bold">Pirotecnia</h1>
            </div>
          </div>

          <button
            onClick={() => {
              setEditingItem(null);
              openModal();
            }}
            disabled={!naveInfo}
            className={`px-4 py-2.5 rounded-lg flex items-center gap-2 font-semibold transition-all shadow-md hover:shadow-lg ${
              naveInfo
                ? "bg-white text-blue-600 hover:bg-blue-50"
                : "bg-blue-400 text-blue-200 cursor-not-allowed"
            }`}
          >
            <Plus className="h-5 w-5" /> Nuevo registro
          </button>
        </div>

        {/* Tabla */}
        <div className="p-6">
          {loading ? (
            <div className="text-center text-slate-500 py-10">Cargando registros...</div>
          ) : (
            <TablePirotecnia
              data={pirotecnia}
              onEdit={handleEdit}
              onDelete={confirmDelete} // <-- aquí llamamos al modal
            />
          )}
        </div>
      </div>

      {/* Modal de formulario */}
      <Modal
        isOpen={isOpenModal}
        onClose={handleCloseModal}
        className="max-w-4xl max-h-[90vh] mx-4"
      >
        <FormPirotecnia
          isOpen={isOpenModal}
          onClose={handleCloseModal}
          item={editingItem}
          onItemUpdated={handlePirotecniaUpdated}
        />
      </Modal>

      {/* Modal de confirmación de eliminación */}
      <DeleteConfirmModal
        open={deleteModalOpen}
        title="Eliminar registro"
        message="¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer."
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
