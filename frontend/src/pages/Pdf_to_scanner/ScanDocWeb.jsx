import React, { useRef, useState, useEffect } from "react";
import jsPDF from "jspdf";

// Filtros disponibles
const FILTERS = {
  original: "none",
  sepia: "sepia(0.5)",
  scanner: "contrast(1.5) brightness(1.2) grayscale(1)",
};

// Coordenadas iniciales de los 4 vértices (polígono) sobre canvas
const INITIAL_POINTS = [
  { x: 50, y: 50 },
  { x: 250, y: 50 },
  { x: 250, y: 350 },
  { x: 50, y: 350 },
];

export default function WebScannerProV2() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [captured, setCaptured] = useState(null);
  const [points, setPoints] = useState(INITIAL_POINTS);
  const [draggingPoint, setDraggingPoint] = useState(null);
  const [filter, setFilter] = useState("original");
  const [images, setImages] = useState([]);

  // Abrir cámara
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error("Error cámara:", err));
  }, []);

  // Tomar foto
  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCaptured(canvas.toDataURL("image/jpeg"));
    setPoints([
      { x: 50, y: 50 },
      { x: canvas.width - 50, y: 50 },
      { x: canvas.width - 50, y: canvas.height - 50 },
      { x: 50, y: canvas.height - 50 },
    ]);
  };

  // Dibujar polígono y aplicar filtro
  const drawCanvas = () => {
    if (!captured) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = captured;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = FILTERS[filter] || "none";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Dibujar polígono
      ctx.strokeStyle = "red";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.forEach((p, i) => {
        if (i > 0) ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.stroke();

      // Dibujar puntos
      points.forEach((p) => {
        ctx.fillStyle = "blue";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, 2 * Math.PI);
        ctx.fill();
      });
    };
  };

  useEffect(drawCanvas, [captured, points, filter]);

  // Manejo de arrastre de puntos
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hitPoint = points.findIndex(
      (p) => Math.hypot(p.x - x, p.y - y) < 10
    );
    if (hitPoint !== -1) setDraggingPoint(hitPoint);
  };

  const handleMouseMove = (e) => {
    if (draggingPoint === null) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newPoints = [...points];
    newPoints[draggingPoint] = { x, y };
    setPoints(newPoints);
  };

  const handleMouseUp = () => {
    setDraggingPoint(null);
  };

  // Guardar imagen recortada en base al polígono
  const saveCropped = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const width = Math.max(...points.map((p) => p.x)) - Math.min(...points.map((p) => p.x));
    const height = Math.max(...points.map((p) => p.y)) - Math.min(...points.map((p) => p.y));
    canvas.width = width;
    canvas.height = height;

    const img = new Image();
    img.src = captured;
    img.onload = () => {
      // Ajuste simple: dibuja bounding rect del polígono
      ctx.drawImage(
        img,
        Math.min(...points.map((p) => p.x)),
        Math.min(...points.map((p) => p.y)),
        width,
        height,
        0,
        0,
        width,
        height
      );
      const dataUrl = canvas.toDataURL("image/jpeg");
      setImages([...images, dataUrl]);
      setCaptured(null);
    };
  };

  const generatePDF = () => {
    if (!images.length) return;
    const pdf = new jsPDF();
    images.forEach((img, i) => {
      if (i > 0) pdf.addPage();
      pdf.addImage(img, "JPEG", 0, 0, 210, 297);
    });
    pdf.save("documentos-escaneados.pdf");
  };

  const resetAll = () => {
    setCaptured(null);
    setImages([]);
    setPoints(INITIAL_POINTS);
    setFilter("original");
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Escáner Web Profesional 2.0</h1>

      {!captured && (
        <div className="relative w-full h-96 bg-black mb-2">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <button
            onClick={takePhoto}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-green-600 text-white rounded"
          >
            Tomar Foto
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={captured ? 400 : 0}
        height={captured ? 400 : 0}
        className="border mb-2"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />

      {captured && (
        <div className="flex gap-2 mb-2">
          <button onClick={saveCropped} className="px-4 py-2 bg-green-600 text-white rounded">
            Guardar Página
          </button>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-2 py-1 border rounded"
          >
            {Object.keys(FILTERS).map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <button onClick={resetAll} className="px-4 py-2 bg-gray-300 rounded">
            Reestablecer
          </button>
        </div>
      )}

      {images.length > 0 && (
        <div className="flex gap-2 mb-2">
          <button
            onClick={generatePDF}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Generar PDF Multipágina
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {images.map((img, i) => (
          <img key={i} src={img} alt={`Página ${i + 1}`} className="border rounded" />
        ))}
      </div>
    </div>
  );
}
