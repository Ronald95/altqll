import React, { useState, useEffect } from "react";
import { Plus, FileText } from "lucide-react";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import NavesAPI from "../../api/naves";
import TableNaves from "../../components/ui/table/naves/TableNaves";
import FormNave from "../../components/ui/modal/naves/FormNave";
import { useNave } from "../../context/NaveContext"; // 👈 importa tu contexto

export default function NavesIndex() {
  const [naves, setNaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isOpen: isOpenModal, openModal, closeModal } = useModal();
  // ✅ EXTRAEMOS naveSeleccionada + setter desde el contexto
  const { naveSeleccionada, setNaveSeleccionada } = useNave();

  // Limpiar la nave seleccionada al entrar a la ruta /naves
  useEffect(() => {
    const resetData = async () => {
      setLoading(true);
      setNaveSeleccionada(null);
      sessionStorage.removeItem("naveSeleccionada");
      setLoading(false);
    };

    resetData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setNaveSeleccionada]);

  // Cargar las naves al montar
  useEffect(() => {
    fetchNaves();
  }, []); // eslint-disable-line

  const fetchNaves = async () => {
    setLoading(true);
    try {
      const data = await NavesAPI.getNaves();
      setNaves(data);
    } catch (err) {
      console.error("Error al obtener las naves:", err);
      setError("No se pudieron cargar las naves.");
    } finally {
      setLoading(false);
    }
  };

  const handleNavesUpdated = (newItem) => {
    setNaves((prev) => {
      // si es update, reemplaza
      if (newItem.isUpdated && newItem.id) {
        return prev.map((item) => (item.id === newItem.id ? newItem : item));
      }
      // si es nuevo, agregar al inicio
      return [newItem, ...prev];
    });
    // limpiar selección y cerrar modal
    setNaveSeleccionada(null);
    closeModal();
  };

  // Cuando el usuario clickea editar en la tabla
  const handleEditNave = (nave) => {
    setNaveSeleccionada(nave); // <-- guarda la nave en el contexto
    openModal();
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="w-full h-full bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
        {/* Encabezado */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-slate-700" />
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Gestión de Naves</h1>
              <p className="text-sm text-slate-500">
                Listado y administración de naves registradas
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setNaveSeleccionada(null); // nueva nave: limpiar selección
              openModal();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition"
          >
            <Plus className="h-4 w-4" /> Nueva Nave
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 p-4 lg:p-6 overflow-x-auto">
          {loading ? (
            <p className="text-sm text-slate-500">Cargando naves...</p>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : naves.length === 0 ? (
            <p className="text-sm text-slate-500">No hay naves registradas.</p>
          ) : (
            <div className="w-full">
              {/* pasamos onEdit para que la tabla invoque handleEditNave */}
              <TableNaves data={naves} onEdit={handleEditNave} />
            </div>
          )}
        </div>
      </div>

      {/* Modal Nueva/Editar Nave */}
      <Modal
        isOpen={isOpenModal}
        onClose={() => {
          setNaveSeleccionada(null);
          closeModal();
        }}
        className="max-w-6xl w-full max-h-[90vh] mx-4 sm:mx-auto"
      >
        <FormNave
          isOpen={isOpenModal}
          onClose={() => {
            setNaveSeleccionada(null);
            closeModal();
          }}
          nave={naveSeleccionada} // <-- aquí pasamos la nave desde el contexto
          onItemUpdated={handleNavesUpdated}
        />
      </Modal>
    </div>
  );
}
