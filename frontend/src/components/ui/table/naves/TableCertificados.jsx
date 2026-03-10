import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { Edit, Eye, Search, Award, Calendar, MessageSquare, X, FileCheck } from "lucide-react";
import ButtonIcon from "../../button/ButtoIcon";

const TableCertificados = ({ data, onEdit}) => {
  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    setFilteredData(data || []);
  }, [data]);

useEffect(() => {
  if (!searchText) {
    setFilteredData(data || []);
    return;
  }
  const text = searchText.toLowerCase();
  const filtered = data.filter(
    (row) =>
      row.categoria?.nombre?.toLowerCase().includes(text) ||
      row.observacion?.toLowerCase().includes(text)
  );
  setFilteredData(filtered);
}, [searchText, data]);


  const clearSearch = () => setSearchText("");

  // Estilos personalizados de la tabla
  const customStyles = {
    table: {
      style: {
        backgroundColor: 'transparent',
      },
    },
    headRow: {
      style: {
        backgroundColor: '#f8fafc',
        borderBottom: '2px solid #e2e8f0',
        minHeight: '56px',
        borderRadius: '0',
      },
    },
    headCells: {
      style: {
        fontSize: '13px',
        fontWeight: '700',
        textTransform: 'uppercase',
        color: '#475569',
        paddingLeft: '16px',
        paddingRight: '16px',
        letterSpacing: '0.05em',
      },
    },
    rows: {
      style: {
        minHeight: '64px',
        fontSize: '14px',
        color: '#334155',
        borderBottom: '1px solid #f1f5f9',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: '#ecfdf5',
          cursor: 'pointer',
          transform: 'scale(1.001)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        },
      },
    },
    cells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
    pagination: {
      style: {
        borderTop: '2px solid #e2e8f0',
        minHeight: '64px',
        backgroundColor: '#f8fafc',
        fontSize: '13px',
        color: '#64748b',
      },
      pageButtonsStyle: {
        borderRadius: '8px',
        height: '36px',
        width: '36px',
        padding: '4px',
        margin: '0 4px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        backgroundColor: 'transparent',
        fill: '#64748b',
        '&:disabled': {
          cursor: 'not-allowed',
          fill: '#cbd5e1',
        },
        '&:hover:not(:disabled)': {
          backgroundColor: '#0891b2',
          fill: 'white',
        },
      },
    },
  };

  // Columnas
const columns = [
  {
    name: (
      <div className="flex items-center gap-2">
        <Award className="h-4 w-4 text-cyan-500" />
        <span>Certificado / Documento</span>
      </div>
    ),
    selector: (row) => row.categoria?.nombre,
    sortable: true,
    grow: 2,
    cell: (row) => (
      <div className="flex items-center gap-3 py-2">
        <div className="bg-cyan-100 p-2 rounded-lg">
          <FileCheck className="h-4 w-4 text-cyan-600" />
        </div>
        <span className="font-semibold text-slate-700">
          {row.categoria?.nombre || "—"}
        </span>
      </div>
    ),
  },
  {
    name: (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-cyan-500" />
        <span>Fecha de Expiración</span>
      </div>
    ),
    selector: (row) => row.fecha_vigencia,
    sortable: true,
    width: "200px",
    cell: (row) => {
      if (!row.fecha_vigencia) {
        return <span className="text-slate-400 italic text-sm">Sin fecha</span>;
      }

      const fecha = new Date(row.fecha_vigencia);
      if (isNaN(fecha.getTime())) {
        return <span className="text-slate-400 italic text-sm">Fecha inválida</span>;
      }

      const hoy = new Date();
      const diasRestantes = Math.floor((fecha - hoy) / (1000 * 60 * 60 * 24));
      const isExpired = diasRestantes < 0;
      const isExpiringSoon = diasRestantes >= 0 && diasRestantes <= 30;

      return (
        <div className="flex items-center gap-2">
          <Calendar
            className={`h-4 w-4 ${
              isExpired ? "text-red-600" : isExpiringSoon ? "text-amber-600" : "text-cyan-600"
            }`}
          />
          <div className="flex flex-col">
            <span
              className={`font-medium text-sm ${
                isExpired ? "text-red-700" : isExpiringSoon ? "text-amber-700" : "text-slate-700"
              }`}
            >
              {fecha.toLocaleDateString("es-CL", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </span>
            {isExpired && <span className="text-xs text-red-600 font-semibold">Vencido</span>}
            {isExpiringSoon && (
              <span className="text-xs text-amber-600 font-semibold">
                {diasRestantes} {diasRestantes === 1 ? "día" : "días"}
              </span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    name: (
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-cyan-500" />
        <span>Observación</span>
      </div>
    ),
    selector: (row) => row.observacion || "—",
    sortable: false,
    grow: 1.5,
    cell: (row) => (
      <span className="text-slate-600 text-sm truncate" title={row.observacion}>
        {row.observacion || "—"}
      </span>
    ),
  },
  {
    name: "Acciones",
    width: "140px",
    center: true,
    cell: (row) => (
      <div className="flex gap-2 items-center justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(row);
          }}
          className="p-2 hover:bg-cyan-50 rounded-lg transition-all hover:scale-110 group"
          title="Editar"
        >
          <Edit className="h-5 w-5 text-cyan-600 group-hover:text-cyan-700" />
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
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-6 border-b-2 border-cyan-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-cyan-100 p-2.5 rounded-xl">
            <Award className="h-6 w-6 text-cyan-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-800">Certificados y Documentos</h3>
            <p className="text-sm text-slate-600">
              Total de registros: <span className="font-semibold text-cyan-600">{data?.length || 0}</span>
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
            className="w-full pl-12 pr-12 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all text-slate-700 placeholder:text-slate-400 bg-white shadow-sm"
            placeholder="Buscar por certificado, nave o observación..."
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
            <div className="bg-cyan-100 text-cyan-700 px-3 py-1 rounded-lg font-semibold">
              {filteredData.length} {filteredData.length === 1 ? 'resultado' : 'resultados'}
            </div>
            {filteredData.length !== (data?.length || 0) && (
              <span className="text-slate-600">
                de {data?.length || 0} total
              </span>
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
              <Award className="h-12 w-12 text-slate-400" />
            </div>
            <h4 className="text-lg font-semibold text-slate-700 mb-2">
              No se encontraron registros
            </h4>
            <p className="text-sm text-slate-500">
              {searchText
                ? "Intenta con otros términos de búsqueda"
                : "No hay certificados disponibles"}
            </p>
          </div>
        }
        highlightOnHover
        pointerOnHover
        onRowClicked={(row) => onEdit(row)}
        customStyles={customStyles}
      />
    </div>
  );
};

export default TableCertificados;