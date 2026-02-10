import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  MdArrowBack,
  MdEditNote,
  MdDirectionsBoat,
  MdOutlineDescription,
  MdOutlineRule,
  MdOutlineVerified,
  MdOutlineSchool,
  MdFileDownload,
  MdEventAvailable,
  MdOutlineEventNote,
} from "react-icons/md";

import { GiShipBow } from "react-icons/gi";
import { FaRulerCombined } from "react-icons/fa";
import ButtonIcon from "../../components/ui/button/ButtoIcon";
import { useNave } from "../../context/NaveContext";
import NavesAPI from "../../api/naves";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

const DetalleNave = () => {
  const { id } = useParams();
  const { setNaveSeleccionada } = useNave();
  const navigate = useNavigate();
  const [nave, setNave] = useState(null);
  const [loading, setLoading] = useState(true);

  const location = useLocation();

  useEffect(() => {
    const fetchNave = async () => {
      try {
        const nave = await NavesAPI.getNaveById(id);
        setNave(nave);
        setNaveSeleccionada(nave);
        console.log(nave);
      } catch (error) {
        console.error("Error al cargar la nave:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNave();
    //return () => setNaveSeleccionada(null);
  }, [id, setNaveSeleccionada]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-slate-500 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-lg">Cargando datos de la nave...</p>
      </div>
    );
  }

  if (!nave) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-red-500 space-y-4">
        <GiShipBow className="text-5xl text-red-400" />
        <p className="text-lg font-medium">No se encontró la nave solicitada</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <MdArrowBack /> Volver
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageMeta
        title={"Detalle de la nave " + nave?.nombre}
        description="Información de la nave"
      />

      <PageBreadcrumb
        homeLabel="Listado naves"
        homeLink="/naves"
        pageTitle={"Detalle de la nave " + nave?.nombre}
      />
      {/* Imagen principal */}
      <div className="relative mb-8 rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-blue-50 to-slate-50">
        <div className="aspect-w-16 aspect-h-9 w-full h-80">
          <img
            src={
              nave.imagen ||
              "https://images.unsplash.com/photo-1513828583688-c52646db42da?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
            }
            alt={nave.nombre}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
          <h2 className="text-2xl font-bold text-white">{nave.nombre}</h2>
          <p className="text-blue-100">
            {nave.tipo_nombre || "Tipo de nave no especificado"}
          </p>
        </div>
      </div>

      {/* Sección de información principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Información General */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden transition-all hover:shadow-md">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 text-white">
            <div className="flex items-center gap-3">
              <MdDirectionsBoat className="text-2xl" />
              <h2 className="text-lg font-semibold">Información General</h2>
            </div>
          </div>
          <div className="p-5">
            <ul className="space-y-3">
              <InfoItem
                label="Tipo de Nave"
                value={nave.tipo_nombre}
                icon={<GiShipBow className="text-blue-500" />}
              />
              <InfoItem
                label="Matrícula"
                value={nave.matricula}
                icon={<MdOutlineVerified className="text-green-500" />}
              />
              <InfoItem
                label="Señal de llamada"
                value={nave.sllamada}
                icon={<MdOutlineVerified className="text-green-500" />}
              />
              <InfoItem
                label="Actividad"
                value={nave.actividad}
                icon={<MdOutlineVerified className="text-green-500" />}
              />
              <InfoItem
                label="Registrado por"
                value={nave.user_name}
                icon={
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                    {nave.user_name
                      ? nave.user_name.charAt(0).toUpperCase()
                      : "U"}
                  </span>
                }
              />
            </ul>
          </div>
        </div>

        {/* Dimensiones */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden transition-all hover:shadow-md">
          <div className="bg-gradient-to-r from-amber-600 to-amber-500 p-4 text-white">
            <div className="flex items-center gap-3">
              <MdOutlineRule className="text-2xl" />
              <h2 className="text-lg font-semibold">Dimensiones</h2>
            </div>
          </div>
          <div className="p-5">
            <ul className="space-y-3">
              <InfoItem
                label="Eslora"
                value={nave.eslora ? `${nave.eslora} m` : "—"}
                icon={<FaRulerCombined className="text-amber-500" />}
              />
              <InfoItem
                label="Manga"
                value={nave.manga ? `${nave.manga} m` : "—"}
                icon={<FaRulerCombined className="text-amber-500" />}
              />
              <InfoItem
                label="Puntal"
                value={nave.puntal ? `${nave.puntal} m` : "—"}
                icon={<FaRulerCombined className="text-amber-500" />}
              />
              <InfoItem
                label="TRG"
                value={nave.trg ? `${nave.trg}` : "—"}
                icon={<FaRulerCombined className="text-amber-500" />}
              />
            </ul>
          </div>
        </div>
        {/* Capacidad personas */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden transition-all hover:shadow-md">
          <div className="bg-gradient-to-r from-amber-600 to-amber-500 p-4 text-white">
            <div className="flex items-center gap-3">
              <MdOutlineRule className="text-2xl" />
              <h2 className="text-lg font-semibold">Capacidad personas</h2>
            </div>
          </div>
          <div className="p-5">
            <ul className="space-y-3">
              <InfoItem
                label="Tripulacion minima"
                value={nave.tminima ? `${nave.tminima} personas` : "—"}
                icon={<FaRulerCombined className="text-amber-500" />}
              />
              <InfoItem
                label="Capacidad pasajeros"
                value={nave.pasajeros ? `${nave.pasajeros} personas` : "—"}
                icon={<FaRulerCombined className="text-amber-500" />}
              />
              <InfoItem
                label="Capacidad maxima personas"
                value={nave.tmaxima ? `${nave.tmaxima} personas` : "—"}
                icon={<FaRulerCombined className="text-amber-500" />}
              />
            </ul>
          </div>
        </div>

        {/* Descripción */}
        {nave.descripcion && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden transition-all hover:shadow-md">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-4 text-white">
              <div className="flex items-center gap-3">
                <MdOutlineDescription className="text-2xl" />
                <h2 className="text-lg font-semibold">Descripción</h2>
              </div>
            </div>
            <div className="p-5">
              <p className="text-slate-600 leading-relaxed">
                {nave.descripcion}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sección de Certificados */}
      {nave.certificado && nave.certificado.length > 0 && (
        <div className="mb-8">
          <SectionHeader
            title="Certificados"
            icon={<MdOutlineVerified className="text-2xl" />}
            gradientFrom="from-green-600"
            gradientTo="to-green-500"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {nave.certificado.map((cert) => (
              <div
                key={cert.id}
                className="bg-white rounded-lg border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      {cert.tipo_nombre}
                    </h3>
                    <div className="mt-2">
                      <InfoRow
                        label="Fecha"
                        value={cert.fecha || "Indefinida"}
                      />
                    </div>
                  </div>
                  {cert.archivo ? (
                    <a
                      href={cert.archivo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <MdFileDownload size={16} />
                      Ver archivo
                    </a>
                  ) : (
                    <span className="ml-4 px-3 py-1.5 bg-slate-50 text-slate-400 rounded-md text-sm font-medium">
                      Sin archivo
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sección de Estudios */}
      {nave.estudio && nave.estudio.length > 0 && (
        <div className="mb-8">
          <SectionHeader
            title="Estudios"
            icon={<MdOutlineSchool className="text-2xl" />}
            gradientFrom="from-amber-600"
            gradientTo="to-amber-500"
          />
          <div className="space-y-4 mt-4">
            {nave.estudio.map((est) => (
              <div
                key={est.id}
                className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        {est.tipo?.nombre || "Estudio"}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-4">
                        <div className="flex items-center text-sm text-slate-600">
                          <MdOutlineEventNote className="mr-1.5 text-amber-500" />
                          <span>Aprobado: {est.fecha_aprobacion || "—"}</span>
                        </div>
                      </div>
                      {est.observacion && (
                        <p className="mt-2 text-sm text-slate-600 bg-amber-50 p-3 rounded-lg">
                          {est.observacion}
                        </p>
                      )}
                    </div>
                  </div>

                  {est.detalles && est.detalles.length > 0 && (
                    <div className="mt-4 pl-4 border-l-2 border-amber-200">
                      <h4 className="text-sm font-medium text-slate-700 mb-2">
                        Detalles:
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {est.detalles.map((d) => (
                          <div
                            key={d.id}
                            className="bg-slate-50 p-3 rounded-lg border border-slate-100"
                          >
                            <h5 className="font-medium text-slate-800">
                              {d.nombre}
                            </h5>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                              <InfoRow
                                label="Cantidad"
                                value={d.cantidad?.toString() || "—"}
                              />
                              <InfoRow
                                label="Peso total"
                                value={
                                  d.peso_total_tons
                                    ? `${d.peso_total_tons} ton`
                                    : "—"
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente auxiliar para mostrar elementos de información
const InfoItem = ({ label, value, icon }) => (
  <li className="flex items-start gap-3">
    <span className="mt-0.5">
      {icon || (
        <span className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center">
          <svg
            className="w-3 h-3 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </span>
      )}
    </span>
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-slate-800">{value || "—"}</p>
    </div>
  </li>
);

// Componente para filas de información
const InfoRow = ({ label, value, icon }) => (
  <div className="flex items-center text-sm">
    <span className="text-slate-500 font-medium">{label}:</span>
    <span className="ml-1.5 text-slate-700 flex items-center">
      {icon && <span className="mr-1">{icon}</span>}
      {value}
    </span>
  </div>
);

// Componente para encabezados de sección
const SectionHeader = ({ title, icon, gradientFrom, gradientTo }) => (
  <div className="flex items-center gap-3 mb-4">
    <div
      className={`p-2 rounded-lg bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white`}
    >
      {icon}
    </div>
    <h2 className="text-xl font-bold text-slate-800">{title}</h2>
  </div>
);

export default DetalleNave;
