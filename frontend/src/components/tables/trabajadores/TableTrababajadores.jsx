import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import {
  Edit,
  Search,
  Sparkles,
  User,
  CreditCard,
  Briefcase,
  Mail,
  Users,
  Phone,
  FileText,
  Hash,
  MessageSquare,
  X,
} from "lucide-react";
import { MdDeleteOutline } from "react-icons/md";


const TableTrabajadores = ({ data, onEdit, onDelete ,selectedItem }) => {
  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState("");

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
        row.cargo?.toLowerCase().includes(text) ||
        row.correo?.toLowerCase().includes(text) ||
        row.telefono?.toLowerCase().includes(text)
    );
    setFilteredData(filtered);
  }, [searchText, data]);

  const clearSearch = () => setSearchText("");

  // Estilos personalizados de la tabla
  const customStyles = {
    table: {
      style: {
        backgroundColor: "transparent",
      },
    },
    headRow: {
      style: {
        backgroundColor: "#f0fdf4",
        borderBottom: "2px solid #bbf7d0",
        minHeight: "56px",
        borderRadius: "0",
      },
    },
    headCells: {
      style: {
        fontSize: "13px",
        fontWeight: "700",
        textTransform: "uppercase",
        color: "#166534",
        paddingLeft: "16px",
        paddingRight: "16px",
        letterSpacing: "0.05em",
      },
    },
    rows: {
      style: {
        minHeight: "64px",
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
        paddingLeft: "16px",
        paddingRight: "16px",
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

  // Columnas
  const columns = [
    {
      name: (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-green-600" />
          <span>Nombre</span>
        </div>
      ),
      selector: (row) => row.nombre,
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3 py-2">
          <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-2.5 rounded-xl shadow-sm">
            <User className="h-4 w-4 text-green-600" />
          </div>
          <span className="font-semibold text-slate-800">
            {row.nombre || "—"}
          </span>
        </div>
      ),
    },
    {
      name: (
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-green-600" />
          <span>Rut</span>
        </div>
      ),
      selector: (row) => row.rut,
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3 py-2">
          <div className="bg-gradient-to-br from-blue-100 to-cyan-100 p-2.5 rounded-xl shadow-sm">
            <CreditCard className="h-4 w-4 text-blue-600" />
          </div>
          <span className="font-medium text-slate-700">{row.rut || "—"}</span>
        </div>
      ),
    },
    {
      name: (
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-green-600" />
          <span>Cargo</span>
        </div>
      ),
      selector: (row) => row.cargo,
      sortable: true,
      width: "160px",
      cell: (row) => (
        <div className="flex items-center justify-center">
          <span className="px-3 py-1 rounded-lg border border-green-500 text-green-600 text-sm font-semibold">
            {row.cargo}
          </span>
        </div>
      ),
    },
    {
      name: (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-green-600" />
          <span>Correo</span>
        </div>
      ),
      selector: (row) => row.correo,
      sortable: true,
      width: "200px",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-slate-400" />
          <span className="text-slate-600 text-sm">{row.correo || "—"}</span>
        </div>
      ),
    },
    {
      name: (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-green-600" />
          <span>Teléfono</span>
        </div>
      ),
      selector: (row) => row.telefono,
      sortable: true,
      width: "150px",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-slate-400" />
          <span className="text-slate-600 text-sm font-medium">
            {row.telefono || "—"}
          </span>
        </div>
      ),
    },
    {
      name: (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-green-600" />
          <span>Observación</span>
        </div>
      ),
      selector: (row) => row.observacion || "—",
      sortable: false,
      cell: (row) => (
        <span
          className="text-slate-500 text-sm truncate"
          title={row.observacion}
        >
          {row.observacion || "—"}
        </span>
      ),
    },
    {
      name: "Acciones",
      width: "140px",
      cell: (row) => (
        <div className="flex gap-2 items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(row);
            }}
            className="p-2 hover:bg-green-50 rounded-xl transition-all hover:scale-110 group"
            title="Editar"
          >
            <Edit className="h-5 w-5 text-green-600 group-hover:text-green-700" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(row);
            }}
            className="p-2 hover:bg-red-50 rounded-xl transition-all hover:scale-110 group"
            title="Eliminar"
          >
            <MdDeleteOutline className="h-5 w-5 text-red-600 group-hover:text-red-700" />
          </button>
        </div>
      ),
    },
  ];

  const paginationOptions = {
    rowsPerPageText: "Filas por página:",
    rangeSeparatorText: "de",
    noRowsPerPage: false,
    selectAllRowsItem: false,
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 overflow-hidden">
      {/* Header con búsqueda */}
      <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 p-6 border-b-2 border-green-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-800">
              Registro de Trabajadores
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Total de registros:{" "}
              <span className="font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-lg">
                {data.length}
              </span>
            </p>
          </div>
        </div>

        {/* Barra de búsqueda mejorada */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            className="w-full pl-12 pr-12 py-3.5 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-slate-700 placeholder:text-slate-400 bg-white shadow-sm hover:shadow-md"
            placeholder="Buscar por nombre, rut, cargo, correo o teléfono..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
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

        {/* Indicador de resultados filtrados */}
        {searchText && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-lg font-semibold">
              {filteredData.length}{" "}
              {filteredData.length === 1 ? "resultado" : "resultados"}
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
        paginationRowsPerPageOptions={[5, 10, 15, 20, 30]}
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
              {searchText
                ? "Intenta con otros términos de búsqueda"
                : "No hay registros de trabajadores disponibles"}
            </p>
          </div>
        }
        highlightOnHover
        pointerOnHover
        onRowClicked={(row) => selectedItem(row)}
        customStyles={customStyles}
      />
    </div>
  );
};

export default TableTrabajadores;
