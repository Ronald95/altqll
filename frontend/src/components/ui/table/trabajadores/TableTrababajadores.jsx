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
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-b-4 border-gray-300"></div>
      </div>
    );
  }

  // --- Estilos personalizados ---
  const customStyles = {
    tableWrapper: {
      style: {
        overflowX: "auto", // Scroll horizontal en móviles
      },
    },
    headRow: {
      style: {
        backgroundColor: "#f0fdf4",
        borderBottom: "2px solid #bbf7d0",
        minHeight: "56px",
      },
    },
    headCells: {
      style: {
        fontSize: "12px",
        fontWeight: "700",
        textTransform: "uppercase",
        color: "#166534",
        paddingLeft: "12px",
        paddingRight: "12px",
        letterSpacing: "0.05em",
      },
    },
    rows: {
      style: {
        minHeight: "56px",
        fontSize: "14px",
        color: "#1e293b",
        borderBottom: "1px solid #f1f5f9",
        transition: "all 0.2s ease",
        "&:hover": {
          backgroundColor: "#f0fdf4",
          cursor: "pointer",
          transform: "scale(1.001)",
          boxShadow: "0 2px 8px rgba(34, 197, 94, 0.1)",
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
        borderTop: "2px solid #bbf7d0",
        minHeight: "64px",
        backgroundColor: "#f0fdf4",
        fontSize: "13px",
        color: "#64748b",
      },
      pageButtonsStyle: {
        borderRadius: "8px",
        height: "36px",
        width: "36px",
        padding: "4px",
        margin: "0 4px",
        cursor: "pointer",
        transition: "all 0.2s",
        backgroundColor: "transparent",
        fill: "#64748b",
        "&:disabled": {
          cursor: "not-allowed",
          fill: "#cbd5e1",
        },
        "&:hover:not(:disabled)": {
          backgroundColor: "#22c55e",
          fill: "white",
        },
      },
    },
  };

  // --- Columnas adaptativas ---
  const columns = [
    {
      name: <div className="flex items-center gap-2"><User className="h-4 w-4 text-green-600" />Nombre</div>,
      selector: row => row.nombre,
      sortable: true,
      cell: row => (
        <div className="flex items-center gap-2 sm:gap-3 py-2">
          <User className="h-4 w-4 text-green-600" />
          <span className="font-medium text-slate-800">{row.nombre || "—"}</span>
        </div>
      ),
    },
    {
      name: <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-green-600" />Rut</div>,
      selector: row => row.rut,
      sortable: true,
      cell: row => (
        <div className="flex items-center gap-2 sm:gap-3 py-2">
          <CreditCard className="h-4 w-4 text-blue-600" />
          <span className="text-slate-700">{row.rut || "—"}</span>
        </div>
      ),
    },
    {
      name: <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-green-600" />Correo</div>,
      selector: row => row.correo,
      sortable: true,
      omit: window.innerWidth < 640, // ocultar en móviles
      cell: row => <span className="text-slate-600 text-sm">{row.correo || "—"}</span>,
    },
    {
      name: <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-green-600" />Teléfono</div>,
      selector: row => row.telefono,
      sortable: true,
      width: "150px",
      cell: row => <span className="text-slate-600 text-sm">{row.telefono || "—"}</span>,
    },
    {
      name: <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-green-600" />Observación</div>,
      selector: row => row.observacion || "—",
      omit: window.innerWidth < 640, // ocultar en móviles
      cell: row => (
        <span className="text-slate-500 text-sm truncate" title={row.observacion}>
          {row.observacion || "—"}
        </span>
      ),
    },
    {
      name: "Acciones",
      width: "120px",
      cell: row => (
        <div className="flex gap-1 sm:gap-2 items-center justify-center">
          <button onClick={e => { e.stopPropagation(); onEdit(row); }} className="p-2 hover:bg-green-50 rounded-xl transition-all hover:scale-110">
            <Edit className="h-5 w-5 text-green-600" />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(row); }} className="p-2 hover:bg-red-50 rounded-xl transition-all hover:scale-110">
            <MdDeleteOutline className="h-5 w-5 text-red-600" />
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
    <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 overflow-hidden">
      {/* Header con búsqueda */}
      <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 p-4 sm:p-6 border-b-2 border-green-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800">Registro de Trabajadores</h3>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              Total de registros:{" "}
              <span className="font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-lg">
                {data.length}
              </span>
            </p>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative w-full mb-2">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            className="w-full pl-12 pr-12 py-3 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-slate-700 placeholder:text-slate-400 bg-white shadow-sm hover:shadow-md"
            placeholder="Buscar por nombre, rut, correo o teléfono..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          {searchText && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors hover:bg-slate-100 rounded-lg p-1"
              title="Limpiar búsqueda"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Indicador resultados */}
        {searchText && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-lg font-semibold">
              {filteredData.length} {filteredData.length === 1 ? "resultado" : "resultados"}
            </div>
            {filteredData.length !== data.length && (
              <span className="text-slate-600">de {data.length} total</span>
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
            <div className="bg-slate-100 rounded-full p-6 mb-4">
              <Sparkles className="h-12 w-12 text-slate-400" />
            </div>
            <h4 className="text-lg font-semibold text-slate-700 mb-2">
              No se encontraron registros
            </h4>
            <p className="text-sm text-slate-500">
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
