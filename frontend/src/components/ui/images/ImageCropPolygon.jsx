import React, { useEffect, useRef, useState } from "react";

const ImageCropPolygon = ({ imageFile, onCrop }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [img, setImg] = useState(null);
  const [points, setPoints] = useState([]);
  const [draggingPoint, setDraggingPoint] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [lastRotateAngle, setLastRotateAngle] = useState(null);

  useEffect(() => {
    if (!imageFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const image = new Image();
      image.onload = () => {
        setImg(image);
        // Calcular zoom inicial para que la imagen quepa en el canvas
        const canvas = canvasRef.current;
        const initialZoom = Math.min(
          canvas.width / image.width,
          canvas.height / image.height
        ) * 0.9;
        setZoom(initialZoom);
        
        // Centrar la imagen
        setPan({
          x: (canvas.width - image.width * initialZoom) / 2,
          y: (canvas.height - image.height * initialZoom) / 2
        });
        
        // Inicializar puntos del polígono en el centro
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const size = 150;
        setPoints([
          { x: centerX - size / 2, y: centerY - size / 2 },
          { x: centerX + size / 2, y: centerY - size / 2 },
          { x: centerX + size / 2, y: centerY + size / 2 },
          { x: centerX - size / 2, y: centerY + size / 2 },
        ]);
      };
      image.src = e.target.result;
    };
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  useEffect(() => {
    if (!img) return;
    drawCanvas();
  }, [img, points, zoom, pan, rotation]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar imagen con zoom, pan y rotación
    ctx.save();
    
    // Calcular centro de la imagen
    const centerX = pan.x + (img.width * zoom) / 2;
    const centerY = pan.y + (img.height * zoom) / 2;
    
    // Trasladar al centro, rotar, y trasladar de vuelta
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-centerX, -centerY);
    
    ctx.drawImage(
      img,
      pan.x,
      pan.y,
      img.width * zoom,
      img.height * zoom
    );
    ctx.restore();

    // Dibujar polígono si hay puntos
    if (points.length > 0) {
      ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Dibujar puntos de control
      points.forEach((point, i) => {
        ctx.fillStyle = draggingPoint === i ? "blue" : "red";
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    }
  };

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const canvasToImageCoords = (canvasPoint) => {
    // Calcular centro de la imagen en el canvas
    const centerX = pan.x + (img.width * zoom) / 2;
    const centerY = pan.y + (img.height * zoom) / 2;
    
    // Trasladar punto al origen (relativo al centro)
    const dx = canvasPoint.x - centerX;
    const dy = canvasPoint.y - centerY;
    
    // Rotar en sentido contrario
    const angle = (-rotation * Math.PI) / 180;
    const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle);
    const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle);
    
    // Trasladar de vuelta y convertir a coordenadas de imagen
    const imgX = (centerX + rotatedX - pan.x) / zoom;
    const imgY = (centerY + rotatedY - pan.y) / zoom;
    
    return { x: imgX, y: imgY };
  };

  const handleMouseDown = (e) => {
    const pos = getMousePos(e);
    
    // Verificar si se clickeó un punto
    const pointIndex = points.findIndex(
      (p) => Math.hypot(p.x - pos.x, p.y - pos.y) < 12
    );
    
    if (pointIndex !== -1) {
      setDraggingPoint(pointIndex);
    } else if (e.ctrlKey || e.metaKey) {
      // Rotar con Ctrl/Cmd + arrastrar
      setIsRotating(true);
      const canvas = canvasRef.current;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const angle = Math.atan2(pos.y - centerY, pos.x - centerX) * (180 / Math.PI);
      setLastRotateAngle(angle);
    } else if (e.shiftKey || e.button === 1) {
      // Pan con Shift + click o botón medio
      setIsPanning(true);
      setLastPanPoint(pos);
    }
  };

  const handleMouseMove = (e) => {
    const pos = getMousePos(e);
    
    if (draggingPoint !== null) {
      const newPoints = [...points];
      newPoints[draggingPoint] = pos;
      setPoints(newPoints);
    } else if (isRotating && lastRotateAngle !== null) {
      const canvas = canvasRef.current;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const angle = Math.atan2(pos.y - centerY, pos.x - centerX) * (180 / Math.PI);
      const deltaAngle = angle - lastRotateAngle;
      setRotation(prev => prev + deltaAngle);
      setLastRotateAngle(angle);
    } else if (isPanning && lastPanPoint) {
      const dx = pos.x - lastPanPoint.x;
      const dy = pos.y - lastPanPoint.y;
      setPan(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      setLastPanPoint(pos);
    }
  };

  const handleMouseUp = () => {
    setDraggingPoint(null);
    setIsPanning(false);
    setIsRotating(false);
    setLastPanPoint(null);
    setLastRotateAngle(null);
  };

  const handleWheel = (e) => {
    //e.preventDefault();
    const pos = getMousePos(e);
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoom * delta, 0.1), 10);
    
    // Zoom hacia el cursor
    setPan(prev => ({
      x: pos.x - (pos.x - prev.x) * (newZoom / zoom),
      y: pos.y - (pos.y - prev.y) * (newZoom / zoom)
    }));
    
    setZoom(newZoom);
  };

  const handleCrop = () => {
    if (!img || points.length === 0) return;

    // Convertir puntos del canvas a coordenadas de imagen original
    const imagePoints = points.map(p => canvasToImageCoords(p));

    // Calcular bounding box en coordenadas de imagen original
    const minX = Math.max(0, Math.min(...imagePoints.map((p) => p.x)));
    const minY = Math.max(0, Math.min(...imagePoints.map((p) => p.y)));
    const maxX = Math.min(img.width, Math.max(...imagePoints.map((p) => p.x)));
    const maxY = Math.min(img.height, Math.max(...imagePoints.map((p) => p.y)));
    const width = maxX - minX;
    const height = maxY - minY;

    // Crear canvas temporal con dimensiones originales
    const tempCanvas = document.createElement("canvas");
    
    // Si hay rotación, necesitamos un canvas más grande
    if (rotation % 360 !== 0) {
      const diagonal = Math.sqrt(img.width ** 2 + img.height ** 2);
      tempCanvas.width = diagonal;
      tempCanvas.height = diagonal;
    } else {
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
    }
    
    const ctx = tempCanvas.getContext("2d");
    
    // Rotar la imagen original si es necesario
    ctx.save();
    const centerX = tempCanvas.width / 2;
    const centerY = tempCanvas.height / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
    ctx.restore();
    
    // Crear otro canvas para el recorte final
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = width;
    finalCanvas.height = height;
    const finalCtx = finalCanvas.getContext("2d");

    // Aplicar máscara poligonal
    finalCtx.beginPath();
    finalCtx.moveTo(imagePoints[0].x - minX, imagePoints[0].y - minY);
    for (let i = 1; i < imagePoints.length; i++) {
      finalCtx.lineTo(imagePoints[i].x - minX, imagePoints[i].y - minY);
    }
    finalCtx.closePath();
    finalCtx.clip();

    // Calcular offset para la rotación
    const offsetX = rotation % 360 !== 0 ? (tempCanvas.width - img.width) / 2 : 0;
    const offsetY = rotation % 360 !== 0 ? (tempCanvas.height - img.height) / 2 : 0;

    // Dibujar imagen rotada y recortada
    finalCtx.drawImage(
      tempCanvas,
      minX + offsetX,
      minY + offsetY,
      width,
      height,
      0,
      0,
      width,
      height
    );

    // Convertir a File con calidad máxima
    finalCanvas.toBlob((blob) => {
      const file = new File([blob], imageFile.name, { type: "image/png" });
      onCrop(file);
    }, "image/png", 1.0);
  };

  const handleAddPoint = () => {
    if (points.length === 0) {
      const canvas = canvasRef.current;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const size = 150;
      setPoints([
        { x: centerX - size / 2, y: centerY - size / 2 },
        { x: centerX + size / 2, y: centerY - size / 2 },
        { x: centerX + size / 2, y: centerY + size / 2 },
        { x: centerX - size / 2, y: centerY + size / 2 },
      ]);
    }
  };

  const handleReset = () => {
    setPoints([]);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 10));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleFitToScreen = () => {
    if (!img) return;
    const canvas = canvasRef.current;
    const initialZoom = Math.min(
      canvas.width / img.width,
      canvas.height / img.height
    ) * 0.9;
    setZoom(initialZoom);
    setPan({
      x: (canvas.width - img.width * initialZoom) / 2,
      y: (canvas.height - img.height * initialZoom) / 2
    });
  };

  const handleRotateLeft = () => {
    setRotation(prev => prev - 90);
  };

  const handleRotateRight = () => {
    setRotation(prev => prev + 90);
  };

  const handleFlipHorizontal = () => {
    setRotation(prev => (prev + 180) % 360);
  };

  const handleResetRotation = () => {
    setRotation(0);
  };

  return (
    <div className="border p-4 mb-4 bg-white rounded" ref={containerRef}>
      <div className="mb-3 flex gap-2 items-center flex-wrap">
        <div className="flex gap-2 items-center border rounded px-3 py-1">
          <button
            type="button"
            onClick={handleZoomOut}
            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
            title="Zoom Out"
          >
            -
          </button>
          <span className="text-sm font-mono min-w-16 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
            title="Zoom In"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleFitToScreen}
            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            title="Ajustar a pantalla"
          >
            ⊡
          </button>
        </div>

        <div className="flex gap-2 items-center border rounded px-3 py-1">
          <button
            type="button"
            onClick={handleRotateLeft}
            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
            title="Rotar 90° izquierda"
          >
            ↶
          </button>
          <button
            type="button"
            onClick={handleRotateRight}
            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
            title="Rotar 90° derecha"
          >
            ↷
          </button>
          <button
            type="button"
            onClick={handleFlipHorizontal}
            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
            title="Voltear horizontal"
          >
            ⇄
          </button>
          <input
            type="number"
            value={Math.round(rotation % 360)}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              setRotation(value);
            }}
            className="w-16 px-2 py-1 border rounded text-sm text-center"
            title="Ángulo de rotación"
            step="1"
            min="-360"
            max="360"
          />
          <span className="text-xs text-gray-500">°</span>
          <button
            type="button"
            onClick={handleResetRotation}
            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-xs"
            title="Resetear rotación"
          >
            0°
          </button>
        </div>
        
        <span className="text-sm text-gray-600">
          Ctrl + arrastrar para rotar libre
        </span>
      </div>
      
      <canvas
        ref={canvasRef}
        width={700}
        height={500}
        className="border cursor-crosshair bg-gray-100"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={handleAddPoint}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {points.length === 0 ? "Agregar Polígono" : "Resetear Polígono"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Limpiar
        </button>
        <button
          type="button"
          onClick={handleCrop}
          disabled={points.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Recortar
        </button>
      </div>
      <div className="text-sm text-gray-600 mt-2 space-y-1">
        <p>• Arrastra los puntos rojos para ajustar el área de recorte</p>
        <p>• Usa la rueda del mouse para hacer zoom</p>
        <p>• Mantén Shift y arrastra para mover la imagen</p>
        <p>• Mantén Ctrl/Cmd y arrastra para rotar libremente</p>
        <p>• Usa los botones ↶ ↷ para rotar 90° o ⇄ para voltear horizontal</p>
      </div>
    </div>
  );
};
export default ImageCropPolygon;