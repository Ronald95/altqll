import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import PosatAPI from "../../../api/posat";

// ── 1. Helper: mover la cámara ──
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true, duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

function FixMapSize() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 200);
  }, [map]);
  return null;
}

// ── 2. Helpers de Estilo y Color ──
const getColor = (vel) => {
  if (vel === 0) return "#ef4444";
  if (vel > 0 && vel <= 5) return "#f97316";
  if (vel > 5 && vel <= 9) return "#22c55e";
  return "#a855f7";
};

const getStatusLabel = (vel) => {
  if (vel === 0) return "Detenido";
  if (vel <= 3) return "Lento";
  if (vel <= 5) return "Moderado";
  if (vel <= 9) return "Rápido";
  return "Muy rápido";
};

// Color por fuente
const getSourceColor = (fuente) =>
  fuente === "Marimsys" ? "#1e40af" : "#047857";

// ── 3. Icono customizado (Flecha con Nombre) ──
const createArrowIcon = (nombre, velocidad, rumbo, fecha_hora) => {
  const color = getColor(velocidad);
  const W = 120,
    H = 70,
    TEXT_H = 18;
  const cx = W / 2,
    cy = TEXT_H + 22;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Nombre arriba
  ctx.font = "bold 12px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "red";
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 4;
  ctx.fillText(nombre, cx, 2);

  // Fecha debajo
  ctx.font = "10px 'Courier New', monospace";
  ctx.textBaseline = "top";
  ctx.fillStyle = "red";
  ctx.fillText(fecha_hora, cx, TEXT_H);
  ctx.shadowBlur = 0;

  // Flecha rotada según rumbo
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rumbo * Math.PI) / 180);
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(10, 6);
  ctx.lineTo(0, 0);
  ctx.lineTo(-10, 6);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.shadowBlur = 4;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Punto central
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.restore();

  return new L.Icon({
    iconUrl: canvas.toDataURL(),
    iconSize: [W, H],
    iconAnchor: [cx, cy],
    popupAnchor: [0, -(cy + 5)],
  });
};

// ── 4. Componentes de Interfaz ──
const ShipList = ({ markers, selectedId, onSelect }) => (
  <div
    style={{
      position: "absolute",
      top: "15px",
      right: "15px",
      zIndex: 1000,
      background: "rgba(255,255,255,0.93)",
      border: "1px solid rgba(0,0,0,0.12)",
      borderRadius: "10px",
      padding: "12px",
      width: "210px",
      backdropFilter: "blur(8px)",
      fontFamily: "'Courier New', monospace",
      maxHeight: "calc(100% - 100px)",
      overflowY: "auto",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    }}
  >
    <div
      style={{
        fontSize: "11px",
        letterSpacing: "0.15em",
        color: "#64748b",
        marginBottom: "10px",
      }}
    >
      ▲ FLOTA ({markers.length})
    </div>
    {markers.map((m) => {
      const active = selectedId === m.id;
      return (
        <div
          key={m.id}
          onClick={() => onSelect(m)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "7px 8px",
            borderRadius: "6px",
            marginBottom: "4px",
            cursor: "pointer",
            background: active ? "rgba(59,130,246,0.1)" : "transparent",
            border: active
              ? "1px solid rgba(59,130,246,0.4)"
              : "1px solid transparent",
            transition: "all 0.15s",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: getColor(m.velocidad),
            }}
          />
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              {m.nombre}
            </div>
            <div style={{ fontSize: "10px", color: "#64748b" }}>
              {m.velocidad} kn · {m.rumbo}° · {m.fuente}
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

const Legend = () => (
  <div
    style={{
      position: "absolute",
      bottom: "30px",
      left: "10px",
      zIndex: 1000,
      background: "rgba(255,255,255,0.93)",
      border: "1px solid rgba(0,0,0,0.1)",
      borderRadius: "8px",
      padding: "10px 14px",
      fontFamily: "'Courier New', monospace",
      fontSize: "11px",
      backdropFilter: "blur(6px)",
    }}
  >
    {[
      ["#ef4444", "0 kn Detenido"],
      ["#f97316", "1–5 kn Lento"],
      ["#22c55e", "6–9 kn Moderado"],
      ["#a855f7", ">9 kn Muy rápido"],
    ].map(([c, label]) => (
      <div
        key={label}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          marginBottom: "4px",
        }}
      >
        <div
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: c,
          }}
        />
        {label}
      </div>
    ))}
  </div>
);

// ── 5. Componente Principal ──
export default function App() {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedShip, setSelectedShip] = useState(null);
  const [autoFetch, setAutoFetch] = useState(false);

  const fetchPosiciones = async () => {
    try {
      const res = await PosatAPI.getPosat();
      if (res.success) {
        // Ordenar por fecha más reciente
        const sorted = [...res.data].sort((a, b) => {
          const dateA = new Date(a.fecha_hora.split("/").reverse().join("-"));
          const dateB = new Date(b.fecha_hora.split("/").reverse().join("-"));
          return dateB - dateA;
        });
        setMarkers(sorted);
        setError(null);
        setLoading(false);
        setLastUpdate(new Date().toLocaleTimeString("es-CL"));
      } else {
        setError(data.error || "Error desconocido");
      }
    } catch (err) {
      console.error("⚠️ Error API:", err);
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!autoFetch) return;
    fetchPosiciones();
    const interval = setInterval(fetchPosiciones, 120_000);
    return () => clearInterval(interval);
  }, [autoFetch]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "87vh",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <header
        style={{
          flexShrink: 0,
          background: "rgba(240,244,250,0.98)",
          borderBottom: "1px solid rgba(0,0,0,0.12)",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          zIndex: 1,
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        }}
      >
        <span style={{ fontSize: "22px", marginRight: "12px" }}>⚓</span>
        <span
          style={{
            color: "#1e293b",
            fontWeight: "bold",
            fontSize: "16px",
            letterSpacing: "0.1em",
            fontFamily: "monospace",
          }}
        >
          POSAT NAVES ALTAMAR
        </span>
        {loading && (
          <span
            style={{ color: "#64748b", fontSize: "12px", marginLeft: "auto" }}
          >
            Cargando…
          </span>
        )}
        {error && (
          <span
            style={{ color: "#ef4444", fontSize: "12px", marginLeft: "auto" }}
          >
            ⚠️ {error}
          </span>
        )}
        <button
          onClick={() => setAutoFetch((prev) => !prev)}
          style={{
            marginLeft: "auto",
            padding: "6px 12px",
            fontSize: "12px",
            fontFamily: "monospace",
            borderRadius: "6px",
            border: "1px solid #ccc",
            background: autoFetch ? "#22c55e" : "#e5e7eb", // verde o gris
            color: autoFetch ? "white" : "#64748b",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {autoFetch ? "SYNC ON" : "SYNC OFF"}
        </button>
      </header>

      <main style={{ flexGrow: 1, position: "relative", zIndex: 1 }}>
        <MapContainer
          center={[-44.0, -73.0]}
          zoom={6}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <FixMapSize />
          {selectedShip && (
            <ChangeView
              center={[selectedShip.lat, selectedShip.lon]}
              zoom={12}
            />
          )}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />
          {markers.map((m) => (
            <Marker
              key={m.id}
              position={[m.lat ?? 0, m.lon ?? 0]}
              icon={createArrowIcon(
                m.nombre,
                m.velocidad,
                m.rumbo,
                m.fecha_hora,
              )}
              eventHandlers={{ click: () => setSelectedShip(m) }}
            >
              <Popup offset={[0, -10]}>
                <div style={{ fontFamily: "monospace", minWidth: "160px" }}>
                  <div
                    style={{
                      fontWeight: "bold",
                      color: getSourceColor(m.fuente),
                      borderBottom: "1px solid #eee",
                      paddingBottom: "4px",
                      marginBottom: "4px",
                    }}
                  >
                    {m.nombre} <br /> {m.fecha_hora}
                  </div>
                  <div style={{ fontSize: "11px" }}>
                    Vel: {m.velocidad} kn
                    <br />
                    Rumbo: {m.rumbo}°<br />
                    Lat: {m.lat ? m.lat.toFixed(4) : "-"}
                    <br />
                    Lon: {m.lon ? m.lon.toFixed(4) : "-"}
                    <br />
                    Fuente: {m.fuente}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <ShipList
          markers={markers}
          selectedId={selectedShip?.id}
          onSelect={setSelectedShip}
        />
        <Legend />

        <div
          style={{
            position: "absolute",
            bottom: "10px",
            right: "10px",
            zIndex: 1000,
            background: "rgba(255,255,255,0.8)",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "10px",
            fontFamily: "monospace",
          }}
        >
          ⟳ {lastUpdate || "Actualizando..."}
        </div>
      </main>
    </div>
  );
}
