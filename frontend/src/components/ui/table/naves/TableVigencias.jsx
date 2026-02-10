import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import {
  Edit,
  Eye,
  Search,
  Ship,
  Anchor,
  Ruler,
  User,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ButtonIcon from "../../button/ButtoIcon";

const TableVigencias = ({ data }) => {
  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();

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
        row.nave.toLowerCase().includes(text) ||
        row.categoria.toLowerCase().includes(text) ||
        row.observacion?.toLowerCase().includes(text) ||
        row.detalle.toLowerCase().includes(text)
    );

    setFilteredData(filtered);
  }, [searchText, data]);

  const clearSearch = () => setSearchText("");

  const handleRowClick = (row) => {
    navigate(`/naves/${row.id}`);
  };

  // Estilos personalizados de la tabla
  const customStyles = {
    table: {
      style: {
        backgroundColor: "transparent",
      },
    },
    headRow: {
      style: {
        backgroundColor: "#f8fafc",
        borderBottom: "2px solid #e2e8f0",
        minHeight: "56px",
        borderRadius: "0",
      },
    },
    headCells: {
      style: {
        fontSize: "13px",
        fontWeight: "700",
        textTransform: "uppercase",
        color: "#475569",
        paddingLeft: "16px",
        paddingRight: "16px",
        letterSpacing: "0.05em",
      },
    },
    rows: {
      style: {
        minHeight: "72px",
        fontSize: "14px",
        color: "#334155",
        borderBottom: "1px solid #f1f5f9",
        transition: "all 0.2s ease",
        "&:hover": {
          backgroundColor: "#e0f2fe",
          cursor: "pointer",
          transform: "scale(1.001)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
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
        borderTop: "2px solid #e2e8f0",
        minHeight: "64px",
        backgroundColor: "#f8fafc",
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
          backgroundColor: "#0284c7",
          fill: "white",
        },
      },
    },
  };

  // Columnas de la tabla
  const columns = [
    {
      name: "Nave",
      selector: (row) => row.nave,
      sortable: true,
      cell: (row) => (
        <span className="font-bold text-slate-800">{row.nave}</span>
      ),
    },
    {
      name: "Categoría",
      selector: (row) => row.categoria,
      sortable: true,
      width: "150px",
      cell: (row) => (
        <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-semibold text-sm">
          {row.categoria}
        </span>
      ),
    },
    {
      name: "Detalle",
      selector: (row) => row.detalle,
      sortable: true,
      cell: (row) => <span className="text-slate-700">{row.detalle}</span>,
    },
{
  name: "Vigencia",
  selector: (row) => row.vigencia || "",
  sortable: true,
  sortFunction: (a, b) => {
    const dateA = a.vigencia ? new Date(a.vigencia) : null;
    const dateB = b.vigencia ? new Date(b.vigencia) : null;

    if (!dateA && !dateB) return 0;
    if (!dateA) return 1; // sin fecha al final
    if (!dateB) return -1;

    return dateA - dateB;
  },
  width: "160px",
  cell: (row) => {
    if (!row.vigencia) {
      return (
        <span className="bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-semibold text-sm">
          —
        </span>
      );
    }

    const fecha = new Date(row.vigencia);
    const hoy = new Date();
    const diffTime = fecha - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let color = "bg-slate-200 text-slate-600"; // default
    if (diffDays < 0) {
      color = "bg-red-100 text-red-700"; // vencido
    } else if (diffDays <= 30) {
      color = "bg-yellow-100 text-yellow-700"; // por vencer
    } else {
      color = "bg-green-100 text-green-700"; // vigente
    }

    return (
      <span className={`${color} px-3 py-1.5 rounded-lg font-semibold text-sm`}>
        {row.vigencia}
      </span>
    );
  },
},
    {
      name: "Observación",
      selector: (row) => row.observacion,
      sortable: true,
      cell: (row) => (
        <span className="text-slate-600 italic">{row.observacion || "—"}</span>
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
      <div className="bg-gradient-to-r from-sky-50 to-blue-50 p-6 border-b-2 border-sky-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-sky-100 p-2.5 rounded-xl">
            <Ship className="h-6 w-6 text-sky-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-800">Resumen de vigencias</h3>
            <p className="text-sm text-slate-600">
              Total de registros:{" "}
              <span className="font-semibold text-sky-600">{data.length}</span>
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
            className="w-full pl-12 pr-12 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-slate-700 placeholder:text-slate-400 bg-white shadow-sm"
            placeholder="Buscar por nombre, categoria, detalle..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {searchText && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              title="Limpiar búsqueda"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Indicador de resultados filtrados */}
        {searchText && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <div className="bg-sky-100 text-sky-700 px-3 py-1 rounded-lg font-semibold">
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
              <Ship className="h-12 w-12 text-slate-400" />
            </div>
            <h4 className="text-lg font-semibold text-slate-700 mb-2">
              No se encontraron naves
            </h4>
            <p className="text-sm text-slate-500">
              {searchText
                ? "Intenta con otros términos de búsqueda"
                : "No hay embarcaciones registradas"}
            </p>
          </div>
        }
        highlightOnHover
        pointerOnHover
        onRowClicked={handleRowClick}
        customStyles={customStyles}
      />
    </div>
  );
};

export default TableVigencias;
