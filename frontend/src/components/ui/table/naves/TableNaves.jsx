import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { Edit, Eye, Search, Ship, Anchor, Ruler, User, X, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ButtonIcon from "../../button/ButtoIcon";

const TableNaves = ({ data , onEdit}) => {
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
        row.nombre?.toLowerCase().includes(text) ||
        row.matricula?.toLowerCase().includes(text) ||
        row.tipo?.nombre?.toLowerCase().includes(text)
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
        minHeight: '72px',
        fontSize: '14px',
        color: '#334155',
        borderBottom: '1px solid #f1f5f9',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: '#e0f2fe',
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
          backgroundColor: '#0284c7',
          fill: 'white',
        },
      },
    },
  };

  // Columnas de la tabla
  const columns = [
    {
      name: (
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-sky-500" />
          <span>Imagen</span>
        </div>
      ),
      selector: (row) => row.imagen,
      cell: (row) => (
        <div className="flex justify-center items-center py-2">
          <div className="relative group">
            <img
              src={
                row.imagen
                  ? row.imagen
                  : "https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png"
              }
              alt={row.nombre}
              onClick={() => handleRowClick(row)}
              className="w-60 h-40 object-cover rounded-xl border-2 border-sky-200 shadow-sm group-hover:scale-110 transition-transform duration-300"
            />
            {!row.imagen && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-xl">
                <Ship className="h-6 w-6 text-slate-400" />
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      name: (
        <div className="flex items-center gap-2">
          <Ship className="h-4 w-4 text-sky-500" />
          <span>Nombre de Nave</span>
        </div>
      ),
      selector: (row) => row.nombre,
      sortable: true,
      width: "300px",
      cell: (row) => (
        <div className="flex items-center gap-3 py-2">
          <div className="bg-sky-100 p-2 rounded-lg">
            <Ship className="h-4 w-4 text-sky-600" />
          </div>
          <span className="font-bold text-slate-800">{row.nombre}</span>
        </div>
      ),
    },
    {
      name: (
        <div className="flex items-center gap-2">
          <Anchor className="h-4 w-4 text-sky-500" />
          <span>Matrícula</span>
        </div>
      ),
      selector: (row) => row.matricula,
      sortable: true,
      width: "150px",
      cell: (row) => (
        <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <span className="font-mono font-semibold text-slate-700 text-sm">
            {row.matricula}
          </span>
        </div>
      ),
    },
    {
      name: (
        <div className="flex items-center gap-2">
          <Ship className="h-4 w-4 text-sky-500" />
          <span>Tipo</span>
        </div>
      ),
      selector: (row) => row.tipo_detalle?.nombre,
      sortable: true,
      width: "180px",
      cell: (row) => (
        <span className="bg-sky-100 text-sky-700 px-3 py-1.5 rounded-lg font-semibold text-sm">
          {row.tipo_detalle?.nombre || "Sin tipo"}
        </span>
      ),
    },
    {
      name: (
        <div className="flex items-center gap-2">
          <Ruler className="h-4 w-4 text-sky-500" />
          <span>Eslora (m)</span>
        </div>
      ),
      selector: (row) => row.eslora,
      sortable: true,
      width: "130px",
      cell: (row) => (
        <div className="flex items-center gap-2 justify-end">
          <Ruler className="h-4 w-4 text-sky-600" />
          <span className="font-semibold text-slate-700">
            {row.eslora?.toFixed(2)}
          </span>
        </div>
      ),
    },
    {
      name: (
        <div className="flex items-center gap-2">
          <Ruler className="h-4 w-4 text-sky-500" />
          <span>Manga (m)</span>
        </div>
      ),
      selector: (row) => row.manga,
      sortable: true,
      width: "130px",
      cell: (row) => (
        <div className="flex items-center gap-2 justify-end">
          <Ruler className="h-4 w-4 text-sky-600" />
          <span className="font-semibold text-slate-700">
            {row.manga?.toFixed(2)}
          </span>
        </div>
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
              navigate(`/naves/${row.id}`);
            }}
            className="p-2 hover:bg-blue-50 rounded-lg transition-all hover:scale-110 group"
            title="Ver detalle"
          >
            <Eye className="h-5 w-5 text-blue-600 group-hover:text-blue-700" />
          </button>
          <button
            onClick={() => onEdit(row)}
            className="p-2 hover:bg-sky-50 rounded-lg transition-all hover:scale-110 group"
            title="Editar"
          >
            <Edit className="h-5 w-5 text-sky-600 group-hover:text-sky-700" />
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
      <div className="bg-gradient-to-r from-sky-50 to-blue-50 p-6 border-b-2 border-sky-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-sky-100 p-2.5 rounded-xl">
            <Ship className="h-6 w-6 text-sky-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-800">Flota de Naves</h3>
            <p className="text-sm text-slate-600">
              Total de embarcaciones: <span className="font-semibold text-sky-600">{data.length}</span>
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
            placeholder="Buscar por nombre, matrícula o tipo de nave..."
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
              {filteredData.length} {filteredData.length === 1 ? 'resultado' : 'resultados'}
            </div>
            {filteredData.length !== data.length && (
              <span className="text-slate-600">
                de {data.length} total
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

export default TableNaves;