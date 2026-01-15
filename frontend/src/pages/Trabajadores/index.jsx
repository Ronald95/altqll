import React, { useState, useEffect } from "react";
import { Plus, FileText } from "lucide-react";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import TableTrabajadores from "../../components/ui/table/trabajadores/TableTrababajadores";
import TrabajadoresAPI from "../../api/trabajadores";
import DeleteConfirmModal from "../../components/ui/modal/dialog/DeleteConfirm"; // <-- IMPORTANTE
import FormTrabajadores from "../../components/ui/modal/trabajadores/FormTrabajadores";
import FormMatriculas from "../../components/ui/modal/trabajadores/FormMatriculas";

export default function Index() {
  const [trabajadores, setTrabajadores] = useState([]);
  const [naveInfo, setNaveInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);

  const { isOpen: isOpenModal, openModal, closeModal } = useModal();
  const {
    isOpen: isOpenModalTrabajador,
    openModal: openModalTrabajador,
    closeModal: closeModalTrabajador,
  } = useModal();

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
      await TrabajadoresAPI.deleteTrabajador(itemToDelete.id);
      setTrabajadores((prev) => prev.filter((p) => p.id !== itemToDelete.id));
      console.log("Eliminado correctamente");
    } catch (error) {
      console.error("Error eliminando:", error);
    }

    setDeleteModalOpen(false); // cerrar modal
    setItemToDelete(null); // limpiar estado
  };

  // 🔹 Cargar registros de pirotecnia
  useEffect(() => {
    const fetchTrabajadores = async () => {
      try {
        setLoading(true);
        const response = await TrabajadoresAPI.list();
        setTrabajadores(response);
      } catch (error) {
        console.error("Error al cargar pirotecnia:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrabajadores();
  }, []);

  // 🔹 Abrir modal en modo edición
  const handleEdit = (item) => {
    setEditingItem(item);
    openModal();
  };

  // 🔹 Abrir modal en modo edición
  const handleSelectedItem = (item) => {
    setEditingItem(item);
    openModalTrabajador();
  };

  // 🔹 Actualizar lista luego de guardar/editar
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

  // 🔹 Cerrar modal de formulario
  const handleCloseModal = () => {
    closeModal();
    setEditingItem(null);
  };

  return (
    <div className="max-full mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <FileText className="h-7 w-7" />
            <div>
              <h1 className="text-2xl font-bold">Trabajadores</h1>
              <p className="text-blue-100 text-sm">
                Listado de trabajadores 
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditingItem(null);
              openModal();
            }}
            className={`px-4 py-2.5 rounded-lg flex items-center gap-2 font-semibold transition-all shadow-md hover:shadow-lg ${"bg-white text-blue-600 hover:bg-blue-50"}`}
          >
            <Plus className="h-5 w-5" /> Nuevo registro
          </button>
        </div>

        {/* Tabla */}
        <div className="p-6">
          {loading ? (
            <div className="text-center text-slate-500 py-10">
              Cargando registros...
            </div>
          ) : (
            <TableTrabajadores
              data={trabajadores}
              onEdit={handleEdit}
              onDelete={confirmDelete}
              selectedItem={handleSelectedItem}
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
        <FormMatriculas
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
