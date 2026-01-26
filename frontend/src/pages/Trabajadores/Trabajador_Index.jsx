import React, { useState, useEffect } from "react";
import { Plus, FileText } from "lucide-react";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import TableTrabajadores from "../../components/ui/table/trabajadores/TableTrababajadores";
import TrabajadoresAPI from "../../api/trabajadores";
import DeleteConfirmModal from "../../components/ui/modal/dialog/DeleteConfirm";
import FormTrabajadores from "../../components/ui/modal/trabajadores/FormTrabajadores";
import FormDetalleTrabajador from "../../components/ui/modal/trabajadores/FormDetalleTrabajador";

export default function Trabajador_Index() {
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);

  const { isOpen: isOpenModal, openModal, closeModal } = useModal();
  const {
    isOpen: isOpenModalTrabajador,
    openModal: openModalTrabajador,
    closeModal: closeModalTrabajador,
  } = useModal();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Abrir modal de confirmación
  const confirmDelete = (item) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  // Eliminar registro
  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await TrabajadoresAPI.deleteTrabajador(itemToDelete.id);
      setTrabajadores((prev) => prev.filter((p) => p.id !== itemToDelete.id));
      console.log("Eliminado correctamente");
    } catch (error) {
      console.error("Error eliminando:", error);
    } finally {
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  // Cargar registros
  useEffect(() => {
    const fetchTrabajadores = async () => {
      try {
        setLoading(true);
        const response = await TrabajadoresAPI.list();
        setTrabajadores(response);
      } catch (error) {
        console.error("Error al cargar trabajadores:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrabajadores();
  }, []);

  // Abrir modal de edición
  const handleEdit = (item) => {
    setEditingItem(item);
    openModal();
  };

  // Abrir modal de detalle
  const handleSelectedItem = (item) => {
    setEditingItem(item);
    openModalTrabajador();
  };

  // Actualizar lista luego de guardar/editar
  const handleTrabajadoresUpdated = (newItem) => {
    setTrabajadores((prev) => {
      if (newItem.isUpdated && newItem.id) {
        return prev.map((p) => (p.id === newItem.id ? newItem : p));
      }
      return [newItem, ...prev];
    });

    closeModal();
    setEditingItem(null);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    closeModal();
    setEditingItem(null);
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="w-full max-w-full mx-auto flex flex-col gap-4">
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-white">
            <FileText className="h-7 w-7" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Trabajadores</h1>
              <p className="text-blue-100 text-sm sm:text-base">
                Listado de trabajadores
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditingItem(null);
              openModal();
            }}
            className="px-4 py-2.5 rounded-lg flex items-center gap-2 font-semibold transition-all shadow-md hover:shadow-lg bg-white text-blue-600 hover:bg-blue-50 self-start sm:self-auto"
          >
            <Plus className="h-5 w-5" /> Nuevo registro
          </button>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-b-4 border-gray-300"></div>
            </div>
          ) : (
            <TableTrabajadores
              data={trabajadores}
              onEdit={handleEdit}
              onDelete={confirmDelete}
              selectedItem={handleSelectedItem}
              loading={loading}
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
        <FormTrabajadores
          isOpen={isOpenModal}
          onClose={handleCloseModal}
          item={editingItem}
          onItemUpdated={handleTrabajadoresUpdated}
        />
      </Modal>

      <Modal
        isOpen={isOpenModalTrabajador}
        onClose={closeModalTrabajador}
        className="max-w-3xl max-h-[90vh] mx-4"
      >
        <FormDetalleTrabajador
          isOpen={isOpenModalTrabajador}
          item={editingItem}
          onClose={closeModalTrabajador}
          trabajador={handleSelectedItem}
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
