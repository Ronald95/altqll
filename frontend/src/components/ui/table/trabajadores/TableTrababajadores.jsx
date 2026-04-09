import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import {
  Edit,
  Search,
  Sparkles,
  User,
  CreditCard,
  Mail,
  Phone,
  FileText,
  Users,
  X,
} from "lucide-react";
import { MdDeleteOutline } from "react-icons/md";

// --- Componente Principal ---
const TableTrabajadores = ({ data = [], onEdit, onDelete, selectedItem, loading = false }) => {
  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState("");

  // Filtrar datos
  useEffect(() => {
    setFilteredData(data);
  }, [data]);

  useEffect(() => {
    if (!searchText) {
      setFilteredData(data);
      return;
    }
    const text = searchText.toLowerCase();
    const filtered = data.filter(
      (row) =>
        row.nombre?.toLowerCase().includes(text) ||
        row.rut?.toLowerCase().includes(text) ||
        row.correo?.toLowerCase().includes(text) ||
        row.telefono?.toLowerCase().includes(text)
    );
    setFilteredData(filtered);
  }, [searchText, data]);

  const clearSearch = () => setSearchText("");

  // --- Spinner mientras carga ---
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-gray-700"></div>
      </div>
    );
  }

  // --- Estilos personalizados corporativos ---
  const customStyles = {
    tableWrapper: {
      style: {
        overflowX: "auto",
      },
    },
    headRow: {
      style: {
        backgroundColor: "#f9fafb",
        borderBottom: "2px solid #e5e7eb",
        minHeight: "56px",
      },
    },
    headCells: {
      style: {
        fontSize: "12px",
        fontWeight: "700",
        textTransform: "uppercase",
        color: "#4b5563",
        paddingLeft: "12px",
        paddingRight: "12px",
        letterSpacing: "0.05em",
      },
    },
    rows: {
      style: {
        minHeight: "56px",
        fontSize: "14px",
        color: "#1f2937",
        borderBottom: "1px solid #f3f4f6",
        transition: "all 0.2s ease",
        "&:hover": {
          backgroundColor: "#f9fafb",
          cursor: "pointer",
        },
      },
    },
    cells: {
      style: {
        paddingLeft: "8px",
        paddingRight: "8px",
      },
    },
    pagination: {
      style: {
        borderTop: "2px solid #e5e7eb",
        minHeight: "64px",
        backgroundColor: "#f9fafb",
        fontSize: "13px",
        color: "#6b7280",
      },
      pageButtonsStyle: {
        borderRadius: "6px",
        height: "36px",
        width: "36px",
        padding: "4px",
        margin: "0 4px",
        cursor: "pointer",
        transition: "all 0.2s",
        backgroundColor: "transparent",
        fill: "#6b7280",
        "&:disabled": {
          cursor: "not-allowed",
          fill: "#d1d5db",
        },
        "&:hover:not(:disabled)": {
          backgroundColor: "#374151",
          fill: "white",
        },
      },
    },
  };

  // --- Columnas adaptativas ---
  const columns = [
    {
      name: <div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-600" />Nombre</div>,
      selector: row => row.nombre,
      sortable: true,
      cell: row => (
        <div className="flex items-center gap-2 sm:gap-3 py-2">
          <User className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-gray-800">{row.nombre || "—"}</span>
        </div>
      ),
    },
    {
      name: <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-gray-600" />Rut</div>,
      selector: row => row.rut,
      sortable: true,
      cell: row => (
        <div className="flex items-center gap-2 sm:gap-3 py-2">
          <CreditCard className="h-4 w-4 text-gray-500" />
          <span className="text-gray-700">{row.rut || "—"}</span>
        </div>
      ),
    },
    {
      name: <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-gray-600" />Correo</div>,
      selector: row => row.correo,
      sortable: true,
      omit: window.innerWidth < 640,
      cell: row => <span className="text-gray-600 text-sm">{row.correo || "—"}</span>,
    },
    {
      name: <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-600" />Teléfono</div>,
      selector: row => row.telefono,
      sortable: true,
      width: "150px",
      cell: row => <span className="text-gray-600 text-sm">{row.telefono || "—"}</span>,
    },
    {
      name: <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-gray-600" />Observación</div>,
      selector: row => row.observacion || "—",
      omit: window.innerWidth < 640,
      cell: row => (
        <span className="text-gray-500 text-sm truncate" title={row.observacion}>
          {row.observacion || "—"}
        </span>
      ),
    },
    {
      name: "Acciones",
      width: "120px",
      cell: row => (
        <div className="flex gap-1 sm:gap-2 items-center justify-center">
          <button 
            onClick={e => { e.stopPropagation(); onEdit(row); }} 
            className="p-2 hover:bg-gray-100 rounded-md transition-all"
          >
            <Edit className="h-5 w-5 text-gray-600" />
          </button>
          <button 
            onClick={e => { e.stopPropagation(); onDelete(row); }} 
            className="p-2 hover:bg-red-50 rounded-md transition-all"
          >
            <MdDeleteOutline className="h-5 w-5 text-red-500" />
          </button>
        </div>
      ),
    },
  ];

  const paginationOptions = {
    rowsPerPageText: "Filas por página:",
    rangeSeparatorText: "de",
  };

  return (
    <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
      {/* Header con búsqueda */}
      <div className="bg-gray-50 p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
          <div className="bg-gray-100 p-3 rounded-lg">
            <Users className="h-6 w-6 text-gray-700" />
          </div>
          <div className="flex-1">
            
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Total de registros:{" "}
              <span className="font-bold text-gray-700 bg-gray-200 px-2 py-0.5 rounded-md">
                {data.length}
              </span>
            </p>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative w-full mb-2">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-md focus:border-gray-600 focus:ring-1 focus:ring-gray-400 outline-none transition-all text-gray-700 placeholder:text-gray-400 bg-white"
            placeholder="Buscar por nombre, rut, correo o teléfono..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          {searchText && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-md p-1"
              title="Limpiar búsqueda"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Indicador resultados */}
        {searchText && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md font-medium">
              {filteredData.length} {filteredData.length === 1 ? "resultado" : "resultados"}
            </div>
            {filteredData.length !== data.length && (
              <span className="text-gray-500">de {data.length} total</span>
            )}
          </div>
        )}
      </div>

      {/* Tabla */}
      <DataTable
        columns={columns}
        data={filteredData}
        pagination
        paginationPerPage={10}
        paginationRowsPerPageOptions={[5, 10, 15, 20]}
        paginationComponentOptions={paginationOptions}
        noDataComponent={
          <div className="flex flex-col items-center justify-center py-16">
            <div className="bg-gray-100 rounded-full p-6 mb-4">
              <Sparkles className="h-12 w-12 text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-700 mb-2">
              No se encontraron registros
            </h4>
            <p className="text-sm text-gray-500">
              {searchText ? "Intenta con otros términos de búsqueda" : "No hay registros de trabajadores disponibles"}
            </p>
          </div>
        }
        highlightOnHover
        pointerOnHover
        onRowClicked={row => selectedItem(row)}
        customStyles={customStyles}
      />
    </div>
  );
};

export default TableTrabajadores;