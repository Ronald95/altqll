import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  Polyline,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import PosatAPI from "../../../api/posat";

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

// 🎯 ICONOS MEJORADOS
const createDotIcon = (velocidad) => {
  const vel = velocidad || 0;
  let color = VELOCIDAD_COLORS.detenido.color;
  let size = 10;
  
  if (vel > 0 && vel <= 5) {
    color = VELOCIDAD_COLORS.lento.color;
    size = 12;
  } else if (vel > 5 && vel <= 9) {
    color = VELOCIDAD_COLORS.medio.color;
    size = 14;
  } else if (vel > 9) {
    color = VELOCIDAD_COLORS.rapido.color;
    size = 16;
  }

  return L.divIcon({
    html: `<div style="
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      background:${color};
      border:3px solid white;
      box-shadow:0 2px 4px rgba(0,0,0,0.2);
      transition:all 0.2s ease;
      cursor:pointer;
    "></div>`,
    className: "custom-dot-icon",
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
};

const createBoatIcon = (heading, color) => {
  return L.divIcon({
    html: `<div style="
      transform: rotate(${heading}deg);
      font-size:32px;
      filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));
      transition:transform 0.1s linear;
      cursor:pointer;
    ">⛵</div>`,
    className: "custom-boat-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// 🧮 FUNCIONES UTILITARIAS
const interpolate = (p1, p2, t) => ({
  lat: p1.lat + (p2.lat - p1.lat) * t,
  lng: p1.lon + (p2.lon - p1.lon) * t,
});



const formatHora = (hora) => {
  if (!hora) return "";
  return new Date(hora).toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const formatDistancia = (km) => {
  if (!km) return "0";
  return km.toFixed(1);
};

// 📊 COMPONENTE DE ESTADÍSTICAS
const Estadisticas = ({ reportes, horaActual, velocidadSim, playing }) => {
  const stats = useMemo(() => {
    if (!reportes.length) return null;
    
    const velocidades = reportes.map(r => r.velocidad || 0);
    const maxVel = Math.max(...velocidades);
    const avgVel = (velocidades.reduce((a,b) => a+b, 0) / velocidades.length).toFixed(1);
    const distanciaTotal = reportes.reduce((sum, r) => sum + (r.distancia_km || 0), 0);
    
    return { maxVel, avgVel, distanciaTotal };
  }, [reportes]);

  if (!stats) return null;

  return (
    <div className="stats-panel">
      <div className="stat-item">
        <span className="stat-label">⚡ Velocidad</span>
        <span className="stat-value">{stats.avgVel} kn</span>
        <span className="stat-sub">máx {stats.maxVel} kn</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">📏 Distancia</span>
        <span className="stat-value">{formatDistancia(stats.distanciaTotal)} km</span>
      </div>
      {horaActual && (
        <div className="stat-item">
          <span className="stat-label">🕒 Hora</span>
          <span className="stat-value">{formatHora(horaActual)}</span>
        </div>
      )}
      {playing && (
        <div className="stat-item">
          <span className="stat-label">▶️ Vel. Sim</span>
          <span className="stat-value">{velocidadSim}x</span>
        </div>
      )}
    </div>
  );
};

// 🗺️ COMPONENTE PRINCIPAL
export default function ReporteMapaFull() {
  const [fechas, setFechas] = useState({
    inicio: "",
    fin: "",
  });
  const [naveId, setNaveId] = useState(NAVES[0].id);
  const [naveSeleccionada, setNaveSeleccionada] = useState(NAVES[0]);
  
  const [reportes, setReportes] = useState([]);
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

  // Actualizar nave seleccionada
  useEffect(() => {
    const nave = NAVES.find(n => n.id === naveId);
    setNaveSeleccionada(nave);
  }, [naveId]);

  const buscar = useCallback(async () => {
    if (!fechas.inicio || !fechas.fin) {
      setError("Selecciona ambas fechas");
      return;
    }

    setCargando(true);
    setError(null);
    setPlaying(false);
    
    try {
      const res = await PosatAPI.getReportePlano({
        mobs: naveId,
        fecha_inicio: fechas.inicio,
        fecha_fin: fechas.fin,
        source: "posat"
      });

      const validos = (res.puntos || []).filter(p => p.lat && p.lon);
      
      if (validos.length === 0) {
        setError("No se encontraron datos para este período");
        setReportes([]);
        return;
      }
      
      setReportes(validos);
      setRutaDibujada([]);
      setPosAnimada([validos[0].lat, validos[0].lon]);
      setHoraActual(validos[0].hora);
      indexRef.current = 0;
      startTimeRef.current = null;
      setScrubber(0);
      
    } catch (err) {
      console.error(err);
      setError("Error cargando los datos");
    } finally {
      setCargando(false);
    }
  }, [naveId, fechas]);

  // Animación
  useEffect(() => {
    if (!playing || reportes.length < 2) return;

    const step = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;

      const i = indexRef.current;
      if (i >= reportes.length - 1) {
        setPlaying(false);
        return;
      }

      const p1 = reportes[i];
      const p2 = reportes[i + 1];
      const duracionRealMs = (p2.minutos_navegados || 1) * 60 * 1000;
      const duracionAnimacion = duracionRealMs / velocidadSim;
      const elapsed = timestamp - startTimeRef.current;
      let t = Math.min(1, elapsed / duracionAnimacion);

      if (t >= 1) {
        indexRef.current += 1;
        setRutaDibujada(prev => [...prev, [p2.lat, p2.lon]]);
        setPosAnimada([p2.lat, p2.lon]);
        setHoraActual(p2.hora);
        setScrubber(indexRef.current);
        startTimeRef.current = timestamp;
      } else {
        const pos = interpolate(p1, p2, t);
        setPosAnimada([pos.lat, pos.lng]);
      }

      frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [playing, reportes, velocidadSim]);

  // Control manual del scrubber
  const handleScrubber = useCallback((value) => {
    setScrubber(value);
    const punto = reportes[value];
    if (punto) {
      setPosAnimada([punto.lat, punto.lon]);
      setHoraActual(punto.hora);
      setRutaDibujada(reportes.slice(0, value + 1).map(p => [p.lat, p.lon]));
      indexRef.current = value;
      startTimeRef.current = null;
      if (playing) setPlaying(false);
    }
  }, [reportes, playing]);

  // Segmentos coloreados por velocidad
  const segmentosColoreados = useMemo(() => {
    const segments = [];
    for (let i = 0; i < reportes.length - 1; i++) {
      const p1 = reportes[i];
      const p2 = reportes[i + 1];
      
      let color = VELOCIDAD_COLORS.detenido.color;
      if (p1.velocidad > 0 && p1.velocidad <= 5) color = VELOCIDAD_COLORS.lento.color;
      else if (p1.velocidad > 5 && p1.velocidad <= 9) color = VELOCIDAD_COLORS.medio.color;
      else if (p1.velocidad > 9) color = VELOCIDAD_COLORS.rapido.color;
      
      segments.push({
        positions: [[p1.lat, p1.lon], [p2.lat, p2.lon]],
        color,
        velocidad: p1.velocidad,
      });
    }
    return segments;
  }, [reportes]);

  const velocidadActual = useMemo(() => {
    if (!reportes[indexRef.current]) return 0;
    return reportes[indexRef.current].velocidad || 0;
  }, [reportes, indexRef.current]);

  const rumboActual = useMemo(() => {
    if (!reportes[indexRef.current]) return 0;
    return reportes[indexRef.current].rumbo || 0;
  }, [reportes, indexRef.current]);

  return (
    <div className="map-container">
      {/* HEADER MODERNO */}
      <div className="control-panel">
        <div className="control-group">
          <label>🚢 Nave</label>
          <select 
            value={naveId} 
            onChange={(e) => setNaveId(Number(e.target.value))}
            style={{ borderColor: naveSeleccionada?.color }}
          >
            {NAVES.map((n) => (
              <option key={n.id} value={n.id}>{n.nombre}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>📅 Fecha inicio</label>
          <input 
            type="date" 
            value={fechas.inicio} 
            onChange={(e) => setFechas(prev => ({ ...prev, inicio: e.target.value }))}
          />
        </div>

        <div className="control-group">
          <label>📅 Fecha fin</label>
          <input 
            type="date" 
            value={fechas.fin} 
            onChange={(e) => setFechas(prev => ({ ...prev, fin: e.target.value }))}
          />
        </div>

        <button 
          className="btn-primary"
          onClick={buscar}
          disabled={cargando}
        >
          {cargando ? "Buscando..." : "🔍 Buscar"}
        </button>
      </div>

      {/* BARRA DE REPRODUCCIÓN */}
      {reportes.length > 0 && (
        <div className="playback-bar">
          <button 
            className={`play-btn ${playing ? 'pause' : 'play'}`}
            onClick={() => setPlaying(!playing)}
          >
            {playing ? "⏸" : "▶"}
          </button>
          
          <input
            type="range"
            min="0"
            max={reportes.length - 1}
            value={scrubber}
            onChange={(e) => handleScrubber(parseInt(e.target.value))}
            className="scrubber"
          />
          
          <div className="speed-control">
            <span>⚡</span>
            <input
              type="range"
              min="1"
              max="200"
              value={velocidadSim}
              onChange={(e) => setVelocidadSim(Number(e.target.value))}
            />
            <span>{velocidadSim}x</span>
          </div>
          
          <div className="boat-info">
            <span>⛵ {velocidadActual.toFixed(1)} kn</span>
            <span>🧭 {rumboActual}°</span>
          </div>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {/* MAPA - CORREGIDO */}
      <MapContainer 
        center={[-43.2, -73.6]} 
        zoom={10} 
        className="leaflet-map"
        style={{ background: "#e8f4f8" }} // Color de fondo mientras carga
      >
        {/* TILELAYER CORREGIDO - Usando OpenStreetMap estándar */}
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          className="map-tiles"
        />

        {/* Segmentos coloreados */}
        {segmentosColoreados.map((s, i) => (
          <Polyline 
            key={i} 
            positions={s.positions} 
            color={s.color}
            weight={4}
            opacity={0.8}
          />
        ))}

        {/* Ruta dibujada */}
        {rutaDibujada.length > 0 && (
          <Polyline 
            positions={rutaDibujada} 
            color={naveSeleccionada?.color || "#3b82f6"} 
            weight={5}
            opacity={0.9}
          />
        )}

        {/* Barco animado */}
        {posAnimada && indexRef.current < reportes.length && (
          <Marker
            position={posAnimada}
            icon={createBoatIcon(rumboActual, naveSeleccionada?.color)}
          >
            <Tooltip permanent direction="top" offset={[0, -20]}>
              <div className="boat-tooltip">
                <strong>{naveSeleccionada?.nombre}</strong>
                <div>⚡ {velocidadActual.toFixed(1)} kn</div>
                <div>🕒 {formatHora(horaActual)}</div>
              </div>
            </Tooltip>
          </Marker>
        )}

        {/* Puntos de reporte */}
        {reportes.map((p, i) => (
          <Marker 
            key={i} 
            position={[p.lat, p.lon]} 
            icon={createDotIcon(p.velocidad)}
          >
            <Popup>
              <div className="popup-content">
                <h4>Reporte #{i + 1}</h4>
                <div>🕒 {formatHora(p.hora)}</div>
                <div>⚡ {p.velocidad?.toFixed(1) || 0} kn</div>
                <div>🧭 {p.rumbo || 0}°</div>
                <div>📏 {formatDistancia(p.distancia_km)} km</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Panel de estadísticas flotante */}
      {reportes.length > 0 && (
        <Estadisticas 
          reportes={reportes}
          horaActual={horaActual}
          velocidadSim={velocidadSim}
          playing={playing}
        />
      )}

      {/* ESTILOS */}
      <style jsx>{`
        .map-container {
          height: 85vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          background: #f8fafc;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .control-panel {
          background: white;
          padding: 1rem;
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          align-items: flex-end;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          z-index: 1000;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .control-group label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        select, input[type="date"] {
          padding: 0.5rem 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.875rem;
          background: white;
          transition: all 0.2s;
        }

        select:focus, input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.5rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          height: 38px;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .playback-bar {
          background: white;
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          border-bottom: 1px solid #e2e8f0;
          z-index: 1000;
        }

        .play-btn {
          width: 40px;
          height: 40px;
          border-radius: 20px;
          border: none;
          background: #3b82f6;
          color: white;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .play-btn:hover {
          transform: scale(1.05);
          background: #2563eb;
        }

        .scrubber {
          flex: 1;
          height: 4px;
          border-radius: 2px;
          background: #e2e8f0;
          cursor: pointer;
        }

        .speed-control {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #f1f5f9;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
        }

        .speed-control input {
          width: 80px;
        }

        .boat-info {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e293b;
          background: #f1f5f9;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
        }

        .error-message {
          position: absolute;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: #ef4444;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          z-index: 2000;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          font-weight: 500;
        }

        .stats-panel {
          position: absolute;
          bottom: 20px;
          right: 20px;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(10px);
          padding: 1rem;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          z-index: 1000;
          min-width: 180px;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .stat-item {
          padding: 0.5rem 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .stat-item:last-child {
          border-bottom: none;
        }

        .stat-label {
          font-size: 0.7rem;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 600;
          display: block;
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
          display: block;
        }

        .stat-sub {
          font-size: 0.7rem;
          color: #94a3b8;
        }

        .leaflet-map {
          flex: 1;
          z-index: 1;
        }
        
        /* Asegurar que las tiles del mapa se vean bien */
        .map-tiles {
          filter: brightness(0.95) contrast(1.05);
        }

        .popup-content h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.875rem;
          color: #1e293b;
        }

        .popup-content div {
          font-size: 0.75rem;
          margin: 0.25rem 0;
        }

        .boat-tooltip {
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .control-panel {
            padding: 0.75rem;
            gap: 0.5rem;
          }
          
          .stats-panel {
            bottom: 10px;
            right: 10px;
            padding: 0.75rem;
            min-width: 150px;
          }
          
          .boat-info {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}