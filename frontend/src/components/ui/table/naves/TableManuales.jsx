import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { MdEditNote } from "react-icons/md";
import { AiOutlineFileSearch } from "react-icons/ai";
import ButtonIcon from "../../button/ButtoIcon";
import { Modal } from "../../../ui/modal";
import { useModal } from "../../../../hooks/useModal";
import FormPirotecnia from "../../modal/naves/FormPirotecnia";

const TablePirotecnia = ({ data, onEdit }) => {
  const [filteredData, setFilteredData] = useState(data);
  const [searchText, setSearchText] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const { isOpen: isOpenModal, openModal, closeModal } = useModal();

  // 🔁 Sincronizar con data externa
  useEffect(() => {
    setFilteredData(data || []);
  }, [data]);

  // 🔍 Filtro de búsqueda
  useEffect(() => {
    if (!searchText) {
      setFilteredData(data || []);
      return;
    }
    const text = searchText.toLowerCase();
    const filtered = data.filter(
      (row) =>
        row.tipo_nombre?.toLowerCase().includes(text) ||
        row.nave_nombre?.toLowerCase().includes(text) ||
        row.observacion?.toLowerCase().includes(text)
    );
    setFilteredData(filtered);
  }, [searchText, data]);

  // ⚙️ Abrir modal (detalle o edición)
  const handleOpenModal = (item, editMode = false) => {
    setSelectedItem(item);
    setIsEditMode(editMode);
    openModal();
  };

  // 🔄 Actualizar después de editar
  const handlePirotecniaUpdated = () => {
    closeModal();
    // Aquí podrías volver a solicitar los datos o actualizar el estado local
  };

  // 🎨 Estilos personalizados de la tabla
  const customStyles = {
    headRow: {
      style: {
        backgroundColor: "#f8fafc",
        fontWeight: "bold",
        textTransform: "uppercase",
        borderBottom: "1px solid #e2e8f0",
      },
    },
    rows: {
      style: {
        cursor: "pointer",
        "&:hover": { backgroundColor: "#f1f5f9" },
      },
    },
  };

  // 📋 Columnas
  const columns = [
    {
      name: "Nave",
      selector: (row) => row.nave_nombre,
      sortable: true,
      cell: (row) => (
        <span className="font-medium text-slate-700">{row.nave_nombre}</span>
      ),
    },
    {
      name: "Tipo Bengala",
      selector: (row) => row.tipo_nombre,
      sortable: true,
      cell: (row) => (
        <span className="text-slate-700">{row.tipo_nombre || "—"}</span>
      ),
    },
    {
      name: "Cantidad",
      selector: (row) => row.cantidad,
      sortable: true,
      width: "120px",
      cell: (row) => <span className="text-slate-600">{row.cantidad}</span>,
    },
    {
      name: "Fecha",
      selector: (row) => row.fecha,
      sortable: true,
      width: "160px",
      cell: (row) => (
        <span className="text-slate-600">
          {new Date(row.fecha).toLocaleDateString("es-CL")}
        </span>
      ),
    },
    {
      name: "Observación",
      selector: (row) => row.observacion || "—",
      sortable: false,
      cell: (row) => (
        <span className="text-slate-600">{row.observacion || "—"}</span>
      ),
    },
    {
      name: "Acciones",
      width: "140px",
      cell: (row) => (
        <div className="flex gap-2">
          <ButtonIcon
            className="text-cyan-500"
            startIcon={<AiOutlineFileSearch size={22} />}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenModal(row, false); // 👁️ Ver detalle
            }}
          />
          <ButtonIcon
            className="text-amber-500"
            startIcon={<MdEditNote size={22} />}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenModal(row, true); // ✏️ Editar
            }}
          />
        </div>
      ),
    },
  ];

  const paginationOptions = {
    rowsPerPageText: "Filas por página",
    rangeSeparatorText: "de",
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative">
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Buscar por tipo, nave o observación..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-slate-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredData}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[5, 10, 15, 20]}
          paginationComponentOptions={paginationOptions}
          noDataComponent={
            <div className="p-8 text-center text-slate-500">
              No se encontraron registros de pirotecnia
            </div>
          }
          highlightOnHover
          striped
          pointerOnHover
          onRowClicked={(row) => handleOpenModal(row, false)}
          customStyles={customStyles}
          className="text-sm"
        />
      </div>

      {/* 🪟 Modal de Detalle / Edición */}
      <Modal
        isOpen={isOpenModal}
        onClose={closeModal}
        className="max-w-4xl max-h-[90vh] mx-4"
      >
        <FormPirotecnia
          isOpen={isOpenModal}
          onClose={closeModal}
          item={selectedItem}
          editMode={isEditMode}
          onItemUpdated={handlePirotecniaUpdated}
        />
      </Modal>
    </>
  );
};

export default TablePirotecnia;
