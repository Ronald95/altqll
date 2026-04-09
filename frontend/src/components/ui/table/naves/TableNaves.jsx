import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { Edit, Eye, Search, Ship, Anchor, Ruler, User, X, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TableNaves = ({ data, onEdit }) => {
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

  // Estilos personalizados corporativos
  const customStyles = {
    table: {
      style: {
        backgroundColor: 'transparent',
      },
    },
    headRow: {
      style: {
        backgroundColor: '#f9fafb',
        borderBottom: '2px solid #e5e7eb',
        minHeight: '56px',
        borderRadius: '0',
      },
    },
    headCells: {
      style: {
        fontSize: '12px',
        fontWeight: '700',
        textTransform: 'uppercase',
        color: '#4b5563',
        paddingLeft: '16px',
        paddingRight: '16px',
        letterSpacing: '0.05em',
      },
    },
    rows: {
      style: {
        minHeight: '72px',
        fontSize: '14px',
        color: '#1f2937',
        borderBottom: '1px solid #f3f4f6',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: '#f9fafb',
          cursor: 'pointer',
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
        borderTop: '2px solid #e5e7eb',
        minHeight: '64px',
        backgroundColor: '#f9fafb',
        fontSize: '13px',
        color: '#6b7280',
      },
      pageButtonsStyle: {
        borderRadius: '6px',
        height: '36px',
        width: '36px',
        padding: '4px',
        margin: '0 4px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        backgroundColor: 'transparent',
        fill: '#6b7280',
        '&:disabled': {
          cursor: 'not-allowed',
          fill: '#d1d5db',
        },
        '&:hover:not(:disabled)': {
          backgroundColor: '#374151',
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
          <ImageIcon className="h-4 w-4 text-gray-600" />
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
              className="w-60 h-40 object-cover rounded-md border border-gray-200 shadow-sm group-hover:scale-105 transition-transform duration-300"
            />
            {!row.imagen && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-md">
                <Ship className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      name: (
        <div className="flex items-center gap-2">
          <Ship className="h-4 w-4 text-gray-600" />
          <span>Nombre de Nave</span>
        </div>
      ),
      selector: (row) => row.nombre,
      sortable: true,
      width: "300px",
      cell: (row) => (
        <div className="flex items-center gap-3 py-2">
          <div className="bg-gray-100 p-2 rounded-md">
            <Ship className="h-4 w-4 text-gray-600" />
          </div>
          <span className="font-semibold text-gray-800">{row.nombre}</span>
        </div>
      ),
    },
    {
      name: (
        <div className="flex items-center gap-2">
          <Anchor className="h-4 w-4 text-gray-600" />
          <span>Matrícula</span>
        </div>
      ),
      selector: (row) => row.matricula,
      sortable: true,
      width: "150px",
      cell: (row) => (
        <div className="bg-gray-100 px-3 py-1.5 rounded-md border border-gray-200">
          <span className="font-mono font-semibold text-gray-700 text-sm">
            {row.matricula}
          </span>
        </div>
      ),
    },
    {
      name: (
        <div className="flex items-center gap-2">
          <Ship className="h-4 w-4 text-gray-600" />
          <span>Tipo</span>
        </div>
      ),
      selector: (row) => row.tipo_detalle?.nombre,
      sortable: true,
      width: "180px",
      cell: (row) => (
        <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md font-medium text-sm">
          {row.tipo_detalle?.nombre || "Sin tipo"}
        </span>
      ),
    },
    {
      name: (
        <div className="flex items-center gap-2">
          <Ruler className="h-4 w-4 text-gray-600" />
          <span>Eslora (m)</span>
        </div>
      ),
      selector: (row) => row.eslora,
      sortable: true,
      width: "130px",
      cell: (row) => (
        <div className="flex items-center gap-2 justify-end">
          <Ruler className="h-4 w-4 text-gray-500" />
          <span className="font-semibold text-gray-700">
            {row.eslora?.toFixed(2)}
          </span>
        </div>
      ),
    },
    {
      name: (
        <div className="flex items-center gap-2">
          <Ruler className="h-4 w-4 text-gray-600" />
          <span>Manga (m)</span>
        </div>
      ),
      selector: (row) => row.manga,
      sortable: true,
      width: "130px",
      cell: (row) => (
        <div className="flex items-center gap-2 justify-end">
          <Ruler className="h-4 w-4 text-gray-500" />
          <span className="font-semibold text-gray-700">
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
            className="p-2 hover:bg-gray-100 rounded-md transition-all group"
            title="Ver detalle"
          >
            <Eye className="h-5 w-5 text-gray-600 group-hover:text-gray-700" />
          </button>
          <button
            onClick={() => onEdit(row)}
            className="p-2 hover:bg-gray-100 rounded-md transition-all group"
            title="Editar"
          >
            <Edit className="h-5 w-5 text-gray-600 group-hover:text-gray-700" />
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
    <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
      {/* Header con búsqueda */}
      <div className="bg-gray-50 p-6 border-b border-gray-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-gray-100 p-2.5 rounded-lg">
            <Ship className="h-6 w-6 text-gray-700" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600">
              Total de embarcaciones: <span className="font-semibold text-gray-700">{data.length}</span>
            </p>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-md focus:border-gray-600 focus:ring-1 focus:ring-gray-400 outline-none transition-all text-gray-700 placeholder:text-gray-400 bg-white"
            placeholder="Buscar por nombre, matrícula o tipo de nave..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
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

        {/* Indicador de resultados filtrados */}
        {searchText && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md font-medium">
              {filteredData.length} {filteredData.length === 1 ? 'resultado' : 'resultados'}
            </div>
            {filteredData.length !== data.length && (
              <span className="text-gray-500">
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
            <div className="bg-gray-100 rounded-full p-6 mb-4">
              <Ship className="h-12 w-12 text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-700 mb-2">
              No se encontraron naves
            </h4>
            <p className="text-sm text-gray-500">
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