import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import PosatAPI from "../../../api/posat";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker, { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";

registerLocale("es", es);

// 🎨 CONSTANTES
const NAVES = [
  { id: 1486, nombre: "Bza Corcovado II", color: "#3b82f6" },
  { id: 3541, nombre: "Corcovado IV", color: "#10b981" },
  { id: 3553, nombre: "Corcovado I", color: "#f59e0b" },
  { id: 2809, nombre: "Jacinta I", color: "#ef4444" },
  { id: 3551, nombre: "Bramar II", color: "#8b5cf6" },
  { id: 11109, nombre: "Victoria T", color: "#ec489a" },
  { id: 3552, nombre: "Corcovado III", color: "#06b6d4" },
];

const VELOCIDAD_COLORS = {
  detenido: { min: 0, max: 0, color: "#ef4444", label: "Detenido" },
  lento: { min: 0.1, max: 5, color: "#f97316", label: "Lento" },
  medio: { min: 5.1, max: 9, color: "#22c55e", label: "Navegando" },
  rapido: { min: 9.1, max: Infinity, color: "#a855f7", label: "Rápido" },
};

// 🎯 ICONOS
const createDotIcon = (velocidad) => {
  const vel = velocidad || 0;
  let color = VELOCIDAD_COLORS.detenido.color;
  let size = 10;

  if (vel > 0 && vel <= 5) { color = VELOCIDAD_COLORS.lento.color; size = 12; }
  else if (vel > 5 && vel <= 9) { color = VELOCIDAD_COLORS.medio.color; size = 12; }
  else if (vel > 9) { color = VELOCIDAD_COLORS.rapido.color; size = 12; }

  return L.divIcon({
    html: `<div style="width:${size}px; height:${size}px; background:${color};" 
               class="rounded-full border-2 border-white shadow-sm hover:scale-150 transition-all duration-200 cursor-pointer"></div>`,
    className: "custom-dot-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const createBoatIcon = (heading) => {
  return L.divIcon({
    html: `<div style="transform: rotate(${heading}deg);" 
               class="text-3xl drop-shadow-lg transition-transform duration-100 cursor-default">⛵</div>`,
    className: "custom-boat-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const CenterOnFirstPoint = ({ puntos }) => {
  const map = useMap();
  useEffect(() => {
    if (puntos?.length > 0) {
      map.setView([puntos[0].lat, puntos[0].lon], 12, { animate: true });
    }
  }, [puntos, map]);
  return null;
};

const StatItem = ({ icon, label, value, subValue }) => (
  <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
    <div className="text-xl w-8 h-8 flex items-center justify-center bg-slate-50 rounded-lg">{icon}</div>
    <div className="flex flex-col">
      <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">{label}</span>
      <span className="text-base font-bold text-slate-800 leading-tight">{value}</span>
      {subValue && <span className="text-xs text-slate-400">{subValue}</span>}
    </div>
  </div>
);

export default function ReporteMapaFull() {
  const [rango, setRango] = useState([null, null]);
  const [startDate, endDate] = rango;
  const [naveId, setNaveId] = useState(NAVES[0].id);
  const [reportes, setReportes] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [rutaDibujada, setRutaDibujada] = useState([]);
  const [posAnimada, setPosAnimada] = useState(null);
  const [horaActual, setHoraActual] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [velocidadSim, setVelocidadSim] = useState(50);
  const [scrubber, setScrubber] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const indexRef = useRef(0);
  const frameRef = useRef(null);
  const startTimeRef = useRef(null);

  const naveSeleccionada = useMemo(() => NAVES.find(n => n.id === naveId), [naveId]);

  const buscar = useCallback(async () => {
    if (!startDate || !endDate) {
      setError("Selecciona un rango de fechas");
      return;
    }
    setCargando(true);
    setError(null);
    setPlaying(false);

    try {
      const res = await PosatAPI.getReportePlano({
        mobs: naveId,
        fecha_inicio: startDate.toISOString().split("T")[0],
        fecha_fin: endDate.toISOString().split("T")[0],
        source: "posat"
      });

      const validos = (res.puntos || []).filter(p => p.lat && p.lon);
      if (validos.length === 0) {
        setError("Sin datos para este período");
        setReportes([]);
        return;
      }

      setReportes(validos);
      setEstadisticas(res.estadistica);
      setPosAnimada([validos[0].lat, validos[0].lon]);
      setHoraActual(validos[0].hora);
      indexRef.current = 0;
      setScrubber(0);
      setRutaDibujada([]);
    } catch (err) {
      setError("Error al cargar datos");
    } finally {
      setCargando(false);
    }
  }, [naveId, startDate, endDate]);

  useEffect(() => {
    if (!playing || reportes.length < 2) return;

    const step = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const i = indexRef.current;
      if (i >= reportes.length - 1) { setPlaying(false); return; }

      const p1 = reportes[i];
      const p2 = reportes[i + 1];
      const duracionAnimacion = ((p2.minutos_navegados || 1) * 60 * 1000) / velocidadSim;
      const elapsed = timestamp - startTimeRef.current;
      const t = Math.min(1, elapsed / duracionAnimacion);

      if (t >= 1) {
        indexRef.current += 1;
        setRutaDibujada(prev => [...prev, [p2.lat, p2.lon]]);
        setPosAnimada([p2.lat, p2.lon]);
        setHoraActual(p2.hora);
        setScrubber(indexRef.current);
        startTimeRef.current = timestamp;
      } else {
        const lat = p1.lat + (p2.lat - p1.lat) * t;
        const lon = p1.lon + (p2.lon - p1.lon) * t;
        setPosAnimada([lat, lon]);
      }
      frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [playing, reportes, velocidadSim]);

  const handleScrubber = (value) => {
    const val = parseInt(value);
    setScrubber(val);
    const p = reportes[val];
    if (p) {
      setPosAnimada([p.lat, p.lon]);
      setHoraActual(p.hora);
      setRutaDibujada(reportes.slice(0, val + 1).map(x => [x.lat, x.lon]));
      indexRef.current = val;
      setPlaying(false);
    }
  };

  const currentData = reportes[indexRef.current] || { velocidad: 0, rumbo: 0 };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-slate-100 font-sans overflow-hidden">
      
      {/* SIDEBAR IZQUIERDO */}
      <aside className="w-full lg:w-[360px] bg-white border-r border-slate-200 p-6 flex flex-col gap-6 overflow-y-auto shadow-xl z-20">
        <section className="bg-slate-50 rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h2 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-blue-500">🔍</span> BUSCAR NAVEGACIÓN
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 tracking-widest">NAVE</label>
              <select
                value={naveId}
                onChange={(e) => setNaveId(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {NAVES.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 tracking-widest">RANGO DE FECHAS</label>
              <DatePicker
                selectsRange
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => setRango(update)}
                locale="es"
                dateFormat="dd/MM/yyyy"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholderText="Seleccione fechas..."
              />
            </div>

            <button
              onClick={buscar}
              disabled={cargando}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 flex justify-center items-center gap-2"
            >
              {cargando ? "Cargando..." : "Explorar Ruta"}
            </button>
          </div>
          {error && <div className="mt-3 text-xs bg-red-50 text-red-500 p-3 rounded-lg border border-red-100">⚠️ {error}</div>}
        </section>

        {estadisticas && (
          <section className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 mb-4 border-b pb-2">📊 RESUMEN DE VIAJE</h3>
            <StatItem icon="📍" label="Total Posiciones" value={estadisticas.total_posiciones} />
            <StatItem icon="⏱️" label="Tiempo Navegación" value={`${(estadisticas.horas_navegacion || 0).toFixed(1)} hrs`} />
            <StatItem icon="📏" label="Distancia Total" value={`${(estadisticas.distancia_km || 0).toFixed(2)} km`} />
          </section>
        )}
      </aside>

      {/* MAPA Y CONTROLES */}
      <main className="flex-1 flex flex-col relative h-full z-10">
        
        {reportes.length > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] lg:w-[800px] z-[1001] bg-white/90 backdrop-blur-md border border-white p-3 rounded-2xl shadow-2xl flex items-center gap-4">
            <button 
              onClick={() => setPlaying(!playing)}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-600 text-white hover:scale-110 transition-transform shadow-lg"
            >
              {playing ? "⏸" : "▶"}
            </button>
            
            <div className="flex-1 flex flex-col gap-1">
              <input
                type="range"
                min="0"
                max={reportes.length - 1}
                value={scrubber}
                onChange={(e) => handleScrubber(e.target.value)}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-bold px-1">
                <span>{new Date(reportes[0].hora).toLocaleTimeString()}</span>
                <span className="text-blue-600 bg-blue-50 px-2 rounded-full">{new Date(horaActual).toLocaleTimeString()}</span>
                <span>{new Date(reportes[reportes.length - 1].hora).toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3 bg-slate-100 px-3 py-2 rounded-xl">
              <span className="text-xs font-bold text-slate-400">{velocidadSim}x</span>
              <input
                type="range" min="1" max="500" value={velocidadSim}
                onChange={(e) => setVelocidadSim(Number(e.target.value))}
                className="w-20 accent-blue-600"
              />
            </div>
          </div>
        )}

        <div className="w-full h-full relative z-0">
          <MapContainer 
            center={[-43.2, -73.6]} 
            zoom={10} 
            className="w-full h-full"
            style={{ background: "#f8fafc", zIndex: 0 }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" className="grayscale-[20%]" />
            
            <CenterOnFirstPoint puntos={reportes} />

            {/* PUNTOS DE LA RUTA (MARKERS INTERACTIVOS) */}
            {reportes.map((p, i) => (
              <Marker 
                key={`${p.id || i}`} 
                position={[p.lat, p.lon]} 
                icon={createDotIcon(p.velocidad)}
              >
                <Popup className="custom-popup">
                  <div className="min-w-[180px] p-1">
                    <div className="border-b border-slate-100 pb-2 mb-2">
                      <h4 className="font-black text-blue-600 text-sm leading-none">{naveSeleccionada?.nombre}</h4>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Reporte de Posición</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Fecha:</span>
                        <span className="font-bold text-slate-700">{new Date(p.hora).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Hora:</span>
                        <span className="font-bold text-slate-700">{new Date(p.hora).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Velocidad:</span>
                        <span className="font-bold text-green-600">{p.velocidad.toFixed(1)} nudos</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Rumbo:</span>
                        <span className="font-bold text-slate-700">{p.rumbo}°</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Líneas de conexión */}
            {reportes.length > 1 && (
              <Polyline 
                positions={reportes.map(p => [p.lat, p.lon])} 
                color="#64748b" 
                weight={2} 
                opacity={0.3} 
                dashArray="5, 10" 
              />
            )}

            {/* Ruta Activa */}
            {rutaDibujada.length > 0 && (
              <Polyline positions={rutaDibujada} color={naveSeleccionada?.color} weight={4} />
            )}

            {/* Barco Animado */}
            {posAnimada && (
              <Marker position={posAnimada} icon={createBoatIcon(currentData.rumbo)} zIndexOffset={1000}>
                <Tooltip permanent direction="top" offset={[0, -20]} className="!bg-slate-900 !border-0 !shadow-2xl !rounded-lg">
                  <div className="text-white p-1 text-center">
                    <div className="font-bold text-xs">{naveSeleccionada?.nombre}</div>
                    <div className="text-[9px] text-blue-300 font-black">{currentData.velocidad.toFixed(1)} KN</div>
                  </div>
                </Tooltip>
              </Marker>
            )}
          </MapContainer>
        </div>
      </main>
      <style>{`
        .leaflet-container { z-index: 0 !important; }
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 4px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .custom-popup .leaflet-popup-tip { background: white; }
      `}</style>
    </div>
  );
}