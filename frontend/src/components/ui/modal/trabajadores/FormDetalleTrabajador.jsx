import React, { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import { PiCertificateLight } from "react-icons/pi";
import { HiOutlineBookOpen } from "react-icons/hi2";
import { useModal } from "../../../../hooks/useModal";
import { Modal } from "../../../../components/ui/modal";
import FormEspecialidad from "./FormEspecialidad";
import FormCursos from "./FormCursos";
import FormCertificados from "./FormCertificados";
import TrabajadoresAPI from "../../../../api/trabajadores";
import TablaEspecialidades from "../../table/trabajadores/TablaEspecialidades";
import TablaCursos from "../../table/trabajadores/TablaCursos";
import TablaCertificados from "../../table/trabajadores/TablaCertificados";


export default function FormDetalleTrabajador({ isOpen, item, onClose }) {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isOpen: isOpenEspecialidad, openModal: openModalEspecialidad, closeModal: closeModalEspecialidad } = useModal();
  const { isOpen: isOpenCursos, openModal: openModalCursos, closeModal: closeModalCursos } = useModal();
  const { isOpen: isOpenCertificados, openModal: openModalCertificados, closeModal: closeModalCertificados } = useModal();
  const [data , setData] = useState([]);
  const [dataCertificados, setDataCertificados] = useState([]);
  const [dataCursos, setDataCursos] = useState([]);
  const [dataEspecialidades, setDataEspecialidades] = useState([]);

  // Si no hay trabajador, no renderizar
  if (!item) return null;

      // Cargar tipos de matrícula
    useEffect(() => {
      if (!isOpen) return;
      
      console.log(item.rut);
      const fetchTipos = async () => {
        setLoading(true);
        try {
          const response = await TrabajadoresAPI.getTrabajadorId(item.id);
          setData(response);
        } catch (err) {
          console.error(err);
          setError("No se pudieron cargar los tipos de matrícula.");
        } finally {
          setLoading(false);
        }
      };
  
      fetchTipos();
    }, [isOpen]);



useEffect(() => {
  if (!data) return;

  // --------------------
  // Certificados
  // --------------------
  const certificados = (data.certificados || []).map((c) => ({
    id: c.id,
    codigo: c.categoria?.codigo || "",
    nombre: c.categoria?.nombre || "",
    fecha_vigencia: c.fecha_vigencia || "",
    user: c.user || "",
  }));
  setDataCertificados(certificados);

  // --------------------
  // Cursos
  // --------------------
  const cursos = (data.cursos || []).map((c) => ({
    id: c.id,
    codigo: c.categoria?.codigo || "",
    nombre: c.categoria?.nombre || "",
    fecha_vigencia: c.fecha_vigencia || "",
    user: c.user || "",
    estado: c.estado || "",
  }));
  setDataCursos(cursos);

  // --------------------
  // Especialidades
  // --------------------
  const especialidades = (data.especialidades || []).map((e) => ({
    id: e.id,
    codigo: e.categoria?.codigo || "",
    nombre: e.categoria?.nombre || "",
    fecha_vigencia: e.fecha_vigencia || "",
    observacion: e.observacion || "",
    user: e.user || "",
  }));
  setDataEspecialidades(especialidades);
}, [item]);


  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b pb-3">
        <h2 className="text-2xl font-bold text-gray-800">
          Detalle del Trabajador {item.nombre}
        </h2>

        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-200 transition"
        >
          <MdClose className="h-6 w-6 text-gray-700" />
        </button>
      </div>

      {/* Datos del trabajador */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-gray-50 p-4 rounded-xl shadow-sm">
        <div>
          <p className="text-xs text-gray-500">Nombre</p>
          <p className="font-semibold text-gray-800">{item.nombre}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500">RUT</p>
          <p className="font-semibold text-gray-800">{item.rut || "—"}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Cargo</p>
          <p className="font-semibold text-gray-800">{item.cargo || "—"}</p>
        </div>
      </div>

      {/* Botones de acciones */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={() => openModalEspecialidad()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-md transition"
        >
          <PiCertificateLight className="h-5 w-5" />
          Nueva especialidad
        </button>

        <button onClick={() => openModalCursos()} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl shadow-md transition">
          <HiOutlineBookOpen className="h-5 w-5" />
          Nuevo curso
        </button>
        <button onClick={() => openModalCertificados()} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl shadow-md transition">
          <HiOutlineBookOpen className="h-5 w-5" />
          Nuevo certificado
        </button>
      </div>

      {/* Tabla Matrículas */}
      <div className="mb-10">
        <h3 className="text-lg font-bold text-gray-800 mb-3">
          Matrículas del Trabajador
        </h3>

        <div className="bg-white p-4 rounded-xl shadow">
          <TablaEspecialidades data={dataEspecialidades} />
        </div>
      </div>

      {/* Tabla Cursos */}
      <div className="mb-10">
        <h3 className="text-lg font-bold text-gray-800 mb-3">
          Cursos del Trabajador
        </h3>

        <div className="bg-white p-4 rounded-xl shadow">
          <TablaCursos data={dataCursos}/>
        </div>
      </div>
      {/* Tabla Certificados */}
      <div className="mb-10">
        <h3 className="text-lg font-bold text-gray-800 mb-3">
          Certificados del Trabajador
        </h3>

        <div className="bg-white p-4 rounded-xl shadow">
          <TablaCertificados data={dataCertificados} />
        </div>
      </div>

      <div className="text-right">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition"
        >
          Cerrar
        </button>
      </div>
      <Modal
        isOpen={isOpenEspecialidad}
        onClose={closeModalEspecialidad}
        className="w-[90vw] h-[90vh] max-w-[1200px] max-h-[90vh] mx-auto p-0"
      >
        <FormEspecialidad
          isOpen={isOpenEspecialidad}
          item={item}
          onClose={closeModalEspecialidad}
          trabajador={item.id}
        />
      </Modal>
      <Modal
        isOpen={isOpenCursos}
        onClose={closeModalCursos}
        className="w-[80vw] max-w-[800px] mx-auto p-0"
      >
        <FormCursos
          isOpen={isOpenCursos}
          item={item}
          onClose={closeModalCursos}
          trabajador={item.id}
        />
      </Modal>
      <Modal
  isOpen={isOpenCertificados}
  onClose={closeModalCertificados}
  className="w-[80vw] max-w-[800px] max-h-[80vh] mx-auto p-0"
>
  <div className="h-full overflow-y-auto">
    <FormCertificados
      isOpen={isOpenCertificados}
      item={item}
      onClose={closeModalCertificados}
      trabajador={item.id}
    />
  </div>
</Modal>
    </div>
  );
}
