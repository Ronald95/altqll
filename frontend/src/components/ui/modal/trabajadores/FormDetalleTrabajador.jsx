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
import TitulosAPI from "../../../../api/titulos";
import PermisosAPI from "../../../../api/permisos";

// Toast para notificaciones - Diseño corporativo
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

// Modal de confirmación - Diseño corporativo
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
    especialidades: 'especialidad',
    titulos: 'título',
    permisos: 'permiso'
  };

  const typeName = typeNames[type] || 'registro';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg border border-gray-300 p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <MdErrorOutline className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              Confirmar eliminación
            </h3>
          </div>
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
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">
                {record.nombre || record.titulo || 'Sin nombre'}
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
            className="px-5 py-2 font-medium rounded-md border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2 font-medium bg-red-600 hover:bg-red-700 text-white rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
  
  const [data, setData] = useState({
    trabajador: null,
    certificados: [],
    cursos: [],
    especialidades: [],
    titulos: [],
    permisos: []
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
  
  const {
    isOpen: isOpenTitulos,
    openModal: openModalTitulos,
    closeModal: closeModalTitulos,
  } = useModal();
  
  const {
    isOpen: isOpenPermisos,
    openModal: openModalPermisos,
    closeModal: closeModalPermisos,
  } = useModal();

  const [editingRecord, setEditingRecord] = useState(null);
  const [editingType, setEditingType] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const abortControllerRef = useRef(null);

  if (!item) return null;

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const fetchTrabajadorData = useCallback(async () => {
    if (!item?.id) return;
    
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
        especialidades: response.especialidades || [],
        titulos: response.titulos || [],
        permisos: response.permisos || []
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

  useEffect(() => {
    if (!isOpen) return;
    
    fetchTrabajadorData();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isOpen, item?.id, fetchTrabajadorData]);

  const refreshSection = useCallback(async (section) => {
    if (!item?.id) return;

    try {
      const response = await TrabajadoresAPI.getTrabajadorId(item.id);
      setData(prev => ({
        ...prev,
        [section]: response[section] || []
      }));
    } catch (error) {
      console.error(`Error recargando ${section}:`, error);
      await fetchTrabajadorData();
    }
  }, [item?.id, fetchTrabajadorData]);

  const handleCreate = (type) => {
    setEditingRecord(null);
    setEditingType(type);
    if (type === "especialidad") openModalEspecialidad();
    if (type === "curso") openModalCursos();
    if (type === "certificado") openModalCertificados();
    if (type === "titulo") openModalTitulos();
    if (type === "permiso") openModalPermisos();
  };

  const handleEdit = (type, record) => {
    setEditingRecord(record);
    setEditingType(type);
    if (type === "especialidad") openModalEspecialidad();
    if (type === "curso") openModalCursos();
    if (type === "certificado") openModalCertificados();
    if (type === "titulo") openModalTitulos();
    if (type === "permiso") openModalPermisos();
  };  

  const handleCloseModalWithOptimistic = useCallback((modalCloseFn, type) => {
    modalCloseFn();
    setEditingRecord(null);
    setEditingType(null);
    
    setTimeout(() => {
      refreshSection(type === 'certificado' ? 'certificados' : type === 'curso' ? 'cursos' : type === 'titulo' ? 'titulos' : type === 'permiso' ? 'permisos' : 'especialidades');
    }, 300);
  }, [refreshSection]);

  const handleDelete = (type, record) => {
    setRecordToDelete(record);
    setDeleteType(type);
    setDeleteModalOpen(true);
  };

  const handleDeleteOptimistic = async () => {
    if (!recordToDelete || !deleteType || deleting) return;
    
    const operationId = Date.now();
    const sectionKey = {
      certificados: 'certificados',
      cursos: 'cursos',
      especialidades: 'especialidades',
      titulos: 'titulos',
      permisos: 'permisos'
    }[deleteType];
    
    if (!sectionKey) return;

    try {
      setDeleting(true);
      
      setPendingOperations(prev => [...prev, { 
        id: operationId, 
        type: deleteType, 
        recordId: recordToDelete.id 
      }]);
      
      setData(prev => ({
        ...prev,
        [sectionKey]: prev[sectionKey].filter(item => item.id !== recordToDelete.id)
      }));

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
        case 'titulos':
          response = await TitulosAPI.delete(recordToDelete.id);
          break;
        case 'permisos':
          response = await PermisosAPI.delete(recordToDelete.id);
          break;
      }

      console.log(`${deleteType} eliminado:`, response);
      
      setPendingOperations(prev => prev.filter(op => op.id !== operationId));
      
      setTimeout(() => {
        refreshSection(sectionKey);
      }, 2000);

      showToast(
        `${deleteType === 'certificados' ? 'Certificado' : deleteType === 'cursos' ? 'Curso' : deleteType === 'titulos' ? 'Título' : deleteType === 'permisos' ? 'Permiso' : 'Especialidad'} eliminado exitosamente`,
        'success'
      );

      setDeleteModalOpen(false);
      setRecordToDelete(null);
      setDeleteType(null);
      
    } catch (error) {
      console.error('Error eliminando:', error);
      
      setData(prev => ({
        ...prev,
        [sectionKey]: [...prev[sectionKey], recordToDelete]
      }));
      
      setPendingOperations(prev => prev.filter(op => op.id !== operationId));
      
      showToast('Error al eliminar el registro', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setRecordToDelete(null);
    setDeleteType(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const renderUndoButton = () => {
    if (pendingOperations.length === 0) return null;
    
    const lastOperation = pendingOperations[pendingOperations.length - 1];
    
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => {
            fetchTrabajadorData();
            setPendingOperations([]);
            showToast('Cambios revertidos', 'success');
          }}
          className="flex items-center gap-2 px-5 py-2 font-medium bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-all shadow-lg"
        >
          <FaUndo className="w-4 h-4" />
          <span>Deshacer cambios pendientes</span>
          <span className="bg-white text-yellow-500 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            {pendingOperations.length}
          </span>
        </button>
      </div>
    );
  };

  return (
    <div className="relative w-full bg-white overflow-hidden rounded-lg border border-gray-300">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-300">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gray-100 rounded-lg">
            <FaUserTie className="w-6 h-6 text-gray-700" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-gray-800">
              Detalle del Trabajador
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Información completa y registros asociados
            </p>
            {pendingOperations.length > 0 && (
              <div className="mt-2 text-xs text-yellow-600 flex items-center gap-1">
                <MdUpdate className="animate-spin" />
                <span>{pendingOperations.length} operación(es) pendiente(s)</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <MdClose className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Tarjeta de información personal */}
        <div className="mb-6 border border-gray-300 rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-300">
            <div className="flex items-center gap-2">
              <FaUserTie className="w-5 h-5 text-gray-700" />
              <h3 className="text-lg font-medium text-gray-800">Información Personal</h3>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Nombre Completo
                </p>
                <p className="font-semibold text-gray-800">
                  {data.trabajador?.nombre || 'Cargando...'}
                </p>
              </div>
              
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  RUT
                </p>
                <p className="font-semibold text-gray-800">
                  {data.trabajador?.rut || "Sin RUT"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Fecha de Nacimiento
                </p>
                <p className="font-semibold text-gray-800">
                  {data.trabajador?.fecha_nacimiento ? formatDate(data.trabajador.fecha_nacimiento) : "—"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Correo Electrónico
                </p>
                <p className="font-semibold text-gray-800 flex items-center gap-2">
                  <MdEmail className="w-4 h-4 text-gray-400" />
                  {data.trabajador?.correo || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Teléfono
                </p>
                <p className="font-semibold text-gray-800 flex items-center gap-2">
                  <MdPhone className="w-4 h-4 text-gray-400" />
                  {data.trabajador?.telefono || "—"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Creado
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <MdCalendarToday className="w-4 h-4" />
                  {data.trabajador?.created_at ? formatDate(data.trabajador.created_at) : "—"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {data.trabajador?.created_at
                    ? new Date(data.trabajador.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                    : ""}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Actualizado
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <MdUpdate className="w-4 h-4" />
                  {data.trabajador?.updated_at ? formatDate(data.trabajador.updated_at) : "—"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {data.trabajador?.updated_at
                    ? new Date(data.trabajador.updated_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                    : ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button 
            onClick={() => handleCreate("especialidad")} 
            disabled={loading || deleting}
            className="px-5 py-2 font-medium bg-gray-700 hover:bg-gray-800 text-white rounded-md transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <PiCertificateLight className="w-4 h-4" />
            Agregar Especialidad
          </button>
          
          <button 
            onClick={() => handleCreate("certificado")} 
            disabled={loading || deleting}
            className="px-5 py-2 font-medium bg-gray-700 hover:bg-gray-800 text-white rounded-md transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <FaCertificate className="w-4 h-4" />
            Agregar Certificado
          </button>
          
          <button 
            onClick={() => handleCreate("curso")} 
            disabled={loading || deleting}
            className="px-5 py-2 font-medium bg-gray-700 hover:bg-gray-800 text-white rounded-md transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <HiOutlineBookOpen className="w-4 h-4" />
            Agregar Curso
          </button>
          
          <button 
            onClick={() => handleCreate("titulo")} 
            disabled={loading || deleting}
            className="px-5 py-2 font-medium bg-gray-700 hover:bg-gray-800 text-white rounded-md transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <HiOutlineBookOpen className="w-4 h-4" />
            Agregar Título
          </button>
          
          <button 
            onClick={() => handleCreate("permiso")} 
            disabled={loading || deleting}
            className="px-5 py-2 font-medium bg-gray-700 hover:bg-gray-800 text-white rounded-md transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <HiOutlineBookOpen className="w-4 h-4" />
            Agregar Permiso
          </button>
        </div>

        {/* Dashboard */}
        <DashboardTrabajador
          certificados={data.certificados}
          cursos={data.cursos}
          especialidades={data.especialidades}
          titulos={data.titulos}
          permisos={data.permisos}
          onEditEspecialidad={(rec) => handleEdit("especialidad", rec)}
          onEditCurso={(rec) => handleEdit("curso", rec)}
          onEditCertificado={(rec) => handleEdit("certificado", rec)}
          onEditPermiso={(rec) => handleEdit("permiso", rec)}
          onEditTitulo={(rec) => handleEdit("titulo", rec)}
          onDelete={handleDelete}
          loading={loading || deleting}
          pendingOperations={pendingOperations}
        />

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-300 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent"></div>
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
              className="px-5 py-2 font-medium rounded-md border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <MdUpdate className={loading ? "animate-spin" : ""} />
              Recargar
            </button>
            <button 
              onClick={onClose} 
              className="px-5 py-2 font-medium bg-gray-700 hover:bg-gray-800 text-white rounded-md transition-all"
            >
              Cerrar detalle
            </button>
          </div>
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

      <Modal isOpen={isOpenTitulos} onClose={closeModalTitulos} className="w-[80vw] max-w-[800px] mx-auto p-0">
        <div className="h-full overflow-y-auto">
          {/* FormTitulos component would go here */}
          <div className="p-6">
            <p className="text-gray-600">Formulario de títulos (pendiente)</p>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isOpenPermisos} onClose={closeModalPermisos} className="w-[80vw] max-w-[800px] mx-auto p-0">
        <div className="h-full overflow-y-auto">
          {/* FormPermisos component would go here */}
          <div className="p-6">
            <p className="text-gray-600">Formulario de permisos (pendiente)</p>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmación */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={cancelDelete}
        onConfirm={handleDeleteOptimistic}
        record={recordToDelete}
        type={deleteType}
        loading={deleting}
      />

      {/* Toast */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Botón revertir */}
      {renderUndoButton()}
    </div>
  );
}