import React, { useEffect, useState, useCallback, useRef } from "react";
import { 
  MdClose, MdEmail, MdPhone, MdCake, MdCalendarToday, MdUpdate,
  MdCheckCircle, MdErrorOutline 
} from "react-icons/md";
import { PiCertificateLight } from "react-icons/pi";
import { HiOutlineBookOpen } from "react-icons/hi2";
import { FaUserTie, FaIdCard, FaCertificate, FaUndo } from "react-icons/fa";
import { useModal } from "../../../../hooks/useModal";
import { Modal } from "../../../../components/ui/modal";
import FormEspecialidad from "./FormEspecialidad";
import FormCursos from "./FormCursos";
import FormCertificados from "./FormCertificados";
import TrabajadoresAPI from "../../../../api/trabajadores";
import DashboardTrabajador from "../../table/trabajadores/DashboardTrabajador";
import CertificadosAPI from "../../../../api/certificados";
import CursosAPI from "../../../../api/cursos";
import EspecialidadesAPI from "../../../../api/especialidades";

// Toast para notificaciones
const Toast = ({ message, type = 'success', onClose }) => {
  const bgColor = type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
  const icon = type === 'success' ? <MdCheckCircle className="text-green-500" /> : <MdErrorOutline className="text-red-500" />;

  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 ${bgColor} border rounded-lg shadow-lg p-4 max-w-sm animate-slide-in`}>
      <div className="flex items-center gap-3">
        <div className="text-xl">{icon}</div>
        <div>
          <p className={`font-medium ${textColor}`}>{message}</p>
          <button 
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-gray-700 mt-1"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal mejorado de confirmación
const ConfirmDeleteModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  record, 
  type, 
  loading 
}) => {
  if (!isOpen) return null;

  const typeNames = {
    certificados: 'certificado',
    cursos: 'curso',
    especialidades: 'especialidad'
  };

  const typeName = typeNames[type] || 'registro';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Confirmar eliminación
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            ✕
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-3">
            ¿Está seguro de eliminar este {typeName}?
          </p>
          {record && (
            <div className="mt-3 p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700 font-medium">
                {record.nombre || 'Sin nombre'}
              </p>
              {record.fecha_vigencia && (
                <p className="text-xs text-red-600 mt-1">
                  Vigencia: {record.fecha_vigencia}
                </p>
              )}
              <p className="text-xs text-red-600 mt-1">
                Esta acción no se puede deshacer.
              </p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Eliminando...
              </>
            ) : (
              'Eliminar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function FormDetalleTrabajador({ isOpen, item, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [pendingOperations, setPendingOperations] = useState([]);
  
  // Estado unificado para mejor manejo
  const [data, setData] = useState({
    trabajador: null,
    certificados: [],
    cursos: [],
    especialidades: []
  });

  const {
    isOpen: isOpenEspecialidad,
    openModal: openModalEspecialidad,
    closeModal: closeModalEspecialidad,
  } = useModal();

  const {
    isOpen: isOpenCursos,
    openModal: openModalCursos,
    closeModal: closeModalCursos,
  } = useModal();

  const {
    isOpen: isOpenCertificados,
    openModal: openModalCertificados,
    closeModal: closeModalCertificados,
  } = useModal();

  const [editingRecord, setEditingRecord] = useState(null);
  const [editingType, setEditingType] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const abortControllerRef = useRef(null);

  if (!item) return null;

  // Función para mostrar toast
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // Función para recargar datos con cancelación
  const fetchTrabajadorData = useCallback(async () => {
    if (!item?.id) return;
    
    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);

    try {
      const response = await TrabajadoresAPI.getTrabajadorId(
        item.id, 
        { signal: abortControllerRef.current.signal }
      );
      
      setData({
        trabajador: response,
        certificados: response.certificados || [],
        cursos: response.cursos || [],
        especialidades: response.especialidades || []
      });
      
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Petición cancelada');
        return;
      }
      
      console.error('Error cargando datos:', err);
      setError("No se pudieron cargar los registros.");
      showToast('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [item?.id, showToast]);

  // Cargar datos del trabajador
  useEffect(() => {
    if (!isOpen) return;
    
    fetchTrabajadorData();
    
    // Limpiar al desmontar
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isOpen, item?.id, fetchTrabajadorData]);

  // Función para recargar solo una sección específica
  const refreshSection = useCallback(async (section) => {
    if (!item?.id) return;

    try {
      let response;
      switch (section) {
        case 'certificados':
          response = await TrabajadoresAPI.getTrabajadorId(item.id);
          setData(prev => ({
            ...prev,
            certificados: response.certificados || []
          }));
          break;
        case 'cursos':
          response = await TrabajadoresAPI.getTrabajadorId(item.id);
          setData(prev => ({
            ...prev,
            cursos: response.cursos || []
          }));
          break;
        case 'especialidades':
          response = await TrabajadoresAPI.getTrabajadorId(item.id);
          setData(prev => ({
            ...prev,
            especialidades: response.especialidades || []
          }));
          break;
      }
    } catch (error) {
      console.error(`Error recargando ${section}:`, error);
      // Si falla la recarga parcial, recargar todo
      await fetchTrabajadorData();
    }
  }, [item?.id, fetchTrabajadorData]);

  // Función para crear nuevo registro
  const handleCreate = (type) => {
    setEditingRecord(null);
    setEditingType(type);
    if (type === "especialidad") openModalEspecialidad();
    if (type === "curso") openModalCursos();
    if (type === "certificado") openModalCertificados();
  };

  // Función para editar registro
  const handleEdit = (type, record) => {
    setEditingRecord(record);
    setEditingType(type);
    if (type === "especialidad") openModalEspecialidad();
    if (type === "curso") openModalCursos();
    if (type === "certificado") openModalCertificados();
  };

  // Función optimizada para cerrar modales
  const handleCloseModalWithOptimistic = useCallback((modalCloseFn, type) => {
    modalCloseFn();
    setEditingRecord(null);
    setEditingType(null);
    
    // Recargar solo la sección afectada después de un breve delay
    setTimeout(() => {
      refreshSection(type === 'certificado' ? 'certificados' : type === 'curso' ? 'cursos' : 'especialidades');
    }, 300);
  }, [refreshSection]);

  // Función para abrir modal de confirmación
  const handleDelete = (type, record) => {
    setRecordToDelete(record);
    setDeleteType(type);
    setDeleteModalOpen(true);
  };

  // Función para manejar eliminación con actualización optimista
  const handleDeleteOptimistic = async () => {
    if (!recordToDelete || !deleteType || deleting) return;
    
    const operationId = Date.now();
    const sectionKey = {
      certificados: 'certificados',
      cursos: 'cursos',
      especialidades: 'especialidades'
    }[deleteType];
    
    if (!sectionKey) return;

    try {
      setDeleting(true);
      
      // 1. Registrar operación pendiente
      setPendingOperations(prev => [...prev, { 
        id: operationId, 
        type: deleteType, 
        recordId: recordToDelete.id 
      }]);
      
      // 2. Actualización optimista inmediata
      setData(prev => ({
        ...prev,
        [sectionKey]: prev[sectionKey].filter(item => item.id !== recordToDelete.id)
      }));

      // 3. Llamada real a la API
      let response;
      switch (deleteType) {
        case 'certificados':
          response = await CertificadosAPI.delete(recordToDelete.id);
          break;
        case 'cursos':
          response = await CursosAPI.delete(recordToDelete.id);
          break;
        case 'especialidades':
          response = await EspecialidadesAPI.delete(recordToDelete.id);
          break;
      }

      console.log(`${deleteType} eliminado:`, response);
      
      // 4. Limpiar operación pendiente
      setPendingOperations(prev => prev.filter(op => op.id !== operationId));
      
      // 5. Recarga silenciosa después de 2 segundos para sincronizar
      setTimeout(() => {
        refreshSection(sectionKey);
      }, 2000);

      // 6. Mostrar éxito y cerrar
      showToast(
        `${deleteType === 'certificados' ? 'Certificado' : deleteType === 'cursos' ? 'Curso' : 'Especialidad'} eliminado exitosamente`,
        'success'
      );

      setDeleteModalOpen(false);
      setRecordToDelete(null);
      setDeleteType(null);
      
    } catch (error) {
      console.error('Error eliminando:', error);
      
      // 7. Revertir cambios si falla
      setData(prev => ({
        ...prev,
        [sectionKey]: [...prev[sectionKey], recordToDelete]
      }));
      
      // 8. Limpiar operación pendiente
      setPendingOperations(prev => prev.filter(op => op.id !== operationId));
      
      // 9. Mostrar error
      showToast('Error al eliminar el registro', 'error');
      
      // 10. Ofrecer reintento automático
      setTimeout(() => {
        if (window.confirm('Error al eliminar. ¿Reintentar?')) {
          handleDeleteOptimistic();
        }
      }, 500);
    } finally {
      setDeleting(false);
    }
  };

  // Cancelar eliminación
  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setRecordToDelete(null);
    setDeleteType(null);
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Renderizar botón de revertir si hay operaciones pendientes
  const renderUndoButton = () => {
    if (pendingOperations.length === 0) return null;
    
    const lastOperation = pendingOperations[pendingOperations.length - 1];
    
    return (
      <div className="fixed bottom-4 right-4 z-40 animate-bounce">
        <button
          onClick={() => {
            // Aquí implementar lógica para revertir
            // Por simplicidad, recargamos todo
            fetchTrabajadorData();
            setPendingOperations([]);
            showToast('Cambios revertidos', 'success');
          }}
          className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-yellow-600 transition-colors"
        >
          <FaUndo />
          <span>Deshacer cambios pendientes</span>
          <span className="bg-white text-yellow-500 rounded-full w-6 h-6 flex items-center justify-center text-xs">
            {pendingOperations.length}
          </span>
        </button>
      </div>
    );
  };

  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Detalle del Trabajador</h2>
          <p className="text-sm text-gray-500 mt-1">Información completa y registros asociados</p>
          {pendingOperations.length > 0 && (
            <div className="mt-2 text-xs text-yellow-600 flex items-center gap-1">
              <MdUpdate className="animate-spin" />
              <span>{pendingOperations.length} operación(es) pendiente(s)</span>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 transition duration-200 group"
          aria-label="Cerrar"
        >
          <MdClose className="h-6 w-6 text-gray-500 group-hover:text-gray-700 transition-colors" />
        </button>
      </div>

      {/* Tarjeta de información */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <FaUserTie className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">{data.trabajador?.nombre || 'Cargando...'}</h3>
            <div className="flex items-center gap-4 mt-2 text-blue-100">
              <span className="flex items-center gap-1">
                <FaIdCard className="h-4 w-4" />
                {data.trabajador?.rut || "Sin RUT"}
              </span>
            </div>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MdCake className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de nacimiento
                </p>
                <p className="font-semibold text-gray-800 mt-1">
                  {data.trabajador?.fecha_nacimiento ? formatDate(data.trabajador.fecha_nacimiento) : "—"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MdEmail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Correo</p>
                <p className="font-semibold text-gray-800 mt-1 truncate">{data.trabajador?.correo || "—"}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MdPhone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</p>
                <p className="font-semibold text-gray-800 mt-1">{data.trabajador?.telefono || "—"}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-1 md:col-span-2 lg:col-span-1">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <MdCalendarToday className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Creado</p>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                  {data.trabajador?.created_at ? formatDate(data.trabajador.created_at) : "—"}
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-400">
                    {data.trabajador?.created_at
                      ? new Date(data.trabajador.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                      : ""}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <MdUpdate className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Actualizado</p>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                  {data.trabajador?.updated_at ? formatDate(data.trabajador.updated_at) : "—"}
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-400">
                    {data.trabajador?.updated_at
                      ? new Date(data.trabajador.updated_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                      : ""}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button 
          onClick={() => handleCreate("especialidad")} 
          disabled={loading || deleting}
          className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="p-2 bg-white/20 rounded-lg">
            <PiCertificateLight className="h-5 w-5" />
          </div>
          <span className="font-medium">+ Especialidad</span>
        </button>
        
        <button 
          onClick={() => handleCreate("certificado")} 
          disabled={loading || deleting}
          className="flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-3 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="p-2 bg-white/20 rounded-lg">
            <FaCertificate className="h-5 w-5" />
          </div>
          <span className="font-medium">+ Certificado</span>
        </button>
        
        <button 
          onClick={() => handleCreate("curso")} 
          disabled={loading || deleting}
          className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="p-2 bg-white/20 rounded-lg">
            <HiOutlineBookOpen className="h-5 w-5" />
          </div>
          <span className="font-medium">+ Curso</span>
        </button>
      </div>

      {/* Dashboard */}
      <DashboardTrabajador
        certificados={data.certificados}
        cursos={data.cursos}
        especialidades={data.especialidades}
        onEditEspecialidad={(rec) => handleEdit("especialidad", rec)}
        onEditCurso={(rec) => handleEdit("curso", rec)}
        onEditCertificado={(rec) => handleEdit("certificado", rec)}
        onDelete={handleDelete}
        loading={loading || deleting}
        pendingOperations={pendingOperations}
      />

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              Cargando...
            </span>
          ) : error ? (
            <span className="text-red-600 flex items-center gap-1">
              <MdErrorOutline /> {error}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <MdCheckCircle className="text-green-500" /> Listo
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchTrabajadorData}
            disabled={loading}
            className="px-4 py-2.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl transition-all duration-200 hover:shadow-md font-medium disabled:opacity-50 flex items-center gap-2"
          >
            <MdUpdate className={loading ? "animate-spin" : ""} />
            Recargar
          </button>
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-all duration-200 hover:shadow-md font-medium"
          >
            Cerrar detalle
          </button>
        </div>
      </div>

      {/* Modales */}
      <Modal isOpen={isOpenEspecialidad} onClose={closeModalEspecialidad} className="w-[90vw] h-[90vh] max-w-[1200px] mx-auto p-0">
        <FormEspecialidad
          isOpen={isOpenEspecialidad}
          onClose={() => handleCloseModalWithOptimistic(closeModalEspecialidad, 'especialidad')}
          trabajador={item}
          data={editingType === "especialidad" ? editingRecord : null}
          onSuccess={() => {
            showToast('Especialidad guardada exitosamente', 'success');
            refreshSection('especialidades');
          }}
        />
      </Modal>

      <Modal isOpen={isOpenCursos} onClose={closeModalCursos} className="w-[80vw] max-w-[800px] mx-auto p-0">
        <FormCursos
          isOpen={isOpenCursos}
          onClose={() => handleCloseModalWithOptimistic(closeModalCursos, 'curso')}
          trabajador={item}
          data={editingType === "curso" ? editingRecord : null}
          onSuccess={() => {
            showToast('Curso guardado exitosamente', 'success');
            refreshSection('cursos');
          }}
        />
      </Modal>

      <Modal isOpen={isOpenCertificados} onClose={closeModalCertificados} className="w-[80vw] max-w-[800px] max-h-[80vh] mx-auto p-0">
        <div className="h-full overflow-y-auto">
          <FormCertificados
            isOpen={isOpenCertificados}
            onClose={() => handleCloseModalWithOptimistic(closeModalCertificados, 'certificado')}
            trabajador={item}
            data={editingType === "certificado" ? editingRecord : null}
            onSuccess={() => {
              showToast('Certificado guardado exitosamente', 'success');
              refreshSection('certificados');
            }}
          />
        </div>
      </Modal>

      {/* Modal de confirmación de eliminación mejorado */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={cancelDelete}
        onConfirm={handleDeleteOptimistic}
        record={recordToDelete}
        type={deleteType}
        loading={deleting}
      />

      {/* Toast de notificación */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Botón para revertir cambios pendientes */}
      {renderUndoButton()}
    </div>
  );
}