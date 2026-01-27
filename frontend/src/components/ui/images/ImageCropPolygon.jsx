import React, { useEffect, useRef, useState, useCallback } from "react";
import { 
  FiZoomIn, 
  FiZoomOut, 
  FiRotateCw, 
  FiRotateCcw, 
  FiMaximize, 
  FiMinimize,
  FiRefreshCw,
  FiGrid,
  FiMove,
  FiScissors,
  FiPlus,
  FiTrash2,
  FiSave
} from "react-icons/fi";
import { 
  MdOutlineFlipToFront, 
  MdTouchApp,
  MdMouse,
  MdOutlineGpsFixed
} from "react-icons/md";

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
  const [isMobile, setIsMobile] = useState(false);
  const [touchStartDistance, setTouchStartDistance] = useState(null);
  const [lastTouchZoom, setLastTouchZoom] = useState(null);
  const [isDraggingPoint, setIsDraggingPoint] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Detectar si es dispositivo móvil y ajustar tamaño del canvas
  useEffect(() => {
    const updateCanvasSize = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const isSmallScreen = window.innerWidth <= 768;
      const isMobileDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(isMobileDevice && isSmallScreen);
      
      // Calcular tamaño del canvas basado en el contenedor
      const containerWidth = container.clientWidth;
      let canvasWidth, canvasHeight;
      
      if (window.innerWidth < 640) { // Mobile
        canvasWidth = containerWidth - 32;
        canvasHeight = Math.min(window.innerHeight * 0.4, 400);
      } else if (window.innerWidth < 1024) { // Tablet
        canvasWidth = Math.min(containerWidth - 48, 600);
        canvasHeight = Math.min(window.innerHeight * 0.5, 500);
      } else { // Desktop
        canvasWidth = Math.min(containerWidth - 64, 800);
        canvasHeight = Math.min(window.innerHeight * 0.6, 600);
      }
      
      setCanvasSize({ width: canvasWidth, height: canvasHeight });
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  useEffect(() => {
    if (!imageFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const image = new Image();
      image.onload = () => {
        setImg(image);
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const initialZoom = Math.min(
          canvas.width / image.width,
          canvas.height / image.height
        ) * 0.9;
        setZoom(initialZoom);
        
        setPan({
          x: (canvas.width - image.width * initialZoom) / 2,
          y: (canvas.height - image.height * initialZoom) / 2
        });
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const size = isMobile ? 80 : 120;
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
  }, [imageFile, isMobile]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar imagen
    ctx.save();
    const centerX = pan.x + (img.width * zoom) / 2;
    const centerY = pan.y + (img.height * zoom) / 2;
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

    // Dibujar polígono si existe
    if (points.length > 0) {
      // Área de recorte
      ctx.fillStyle = "rgba(59, 130, 246, 0.15)";
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = isMobile ? 2.5 : 2;
      ctx.setLineDash([5, 5]);

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);

      // Puntos de control
      const pointRadius = isMobile ? 10 : 7;
      points.forEach((point, i) => {
        // Anillo exterior
        ctx.fillStyle = draggingPoint === i ? "#1d4ed8" : "#3b82f6";
        ctx.strokeStyle = "white";
        ctx.lineWidth = isMobile ? 3 : 2;
        ctx.beginPath();
        ctx.arc(point.x, point.y, pointRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Punto interior
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(point.x, point.y, pointRadius / 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Mostrar instrucciones en el canvas
      if (!isMobile && points.length > 0) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Arrastra los puntos azules para ajustar", canvas.width / 2, 20);
      }
    }
  }, [img, points, zoom, pan, rotation, isMobile, draggingPoint]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Función auxiliar para obtener posición del evento
  const getEventPos = useCallback((canvas, e) => {
    const rect = canvas.getBoundingClientRect();
    
    if (e.type.includes('touch')) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  }, []);

  // Handler de inicio de touch
  const handleTouchStart = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const pos = getEventPos(canvas, e);
    const pointRadius = isMobile ? 16 : 12;
    const pointIndex = points.findIndex(
      (p) => Math.hypot(p.x - pos.x, p.y - pos.y) < pointRadius
    );
    
    if (pointIndex !== -1) {
      if (e.cancelable) {
        e.preventDefault();
      }
      setDraggingPoint(pointIndex);
      setIsDraggingPoint(true);
      setStartPos(pos);
    } else {
      setStartPos(pos);
    }
    
    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches);
      const angle = getTouchAngle(e.touches);
      setTouchStartDistance(distance);
      setLastTouchZoom(zoom);
      setLastRotateAngle(angle);
    }
  }, [points, isMobile, zoom, getEventPos]);

  const getTouchDistance = (touches) => {
    if (touches.length < 2) return null;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchAngle = (touches) => {
    if (touches.length < 2) return null;
    const dx = touches[1].clientX - touches[0].clientX;
    const dy = touches[1].clientY - touches[0].clientY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  const getTouchCenter = useCallback((touches, canvas) => {
    if (touches.length < 2) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((touches[0].clientX + touches[1].clientX) / 2) - rect.left,
      y: ((touches[0].clientY + touches[1].clientY) / 2) - rect.top,
    };
  }, []);

  // Handler de movimiento touch
  const handleTouchMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    if (isDraggingPoint || e.touches.length > 1) {
      e.preventDefault();
    }
    
    const pos = getEventPos(canvas, e);
    
    if (isDraggingPoint && draggingPoint !== null) {
      const newPoints = [...points];
      newPoints[draggingPoint] = pos;
      setPoints(newPoints);
    } else if (e.touches.length === 1 && startPos) {
      const dx = pos.x - startPos.x;
      const dy = pos.y - startPos.y;
      setPan(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      setStartPos(pos);
    } else if (e.touches.length === 2) {
      const touches = e.touches;
      const distance = getTouchDistance(touches);
      const angle = getTouchAngle(touches);
      const center = getTouchCenter(touches, canvas);
      
      if (touchStartDistance && distance && lastTouchZoom && center) {
        const scale = distance / touchStartDistance;
        const newZoom = Math.min(Math.max(lastTouchZoom * scale, 0.1), 10);
        
        setPan(prev => ({
          x: center.x - (center.x - prev.x) * (newZoom / zoom),
          y: center.y - (center.y - prev.y) * (newZoom / zoom)
        }));
        
        setZoom(newZoom);
      }
      
      if (lastRotateAngle !== null && angle !== null) {
        const deltaAngle = angle - lastRotateAngle;
        if (Math.abs(deltaAngle) > 0.5 && Math.abs(deltaAngle) < 180) {
          setRotation(prev => (prev + deltaAngle) % 360);
        }
        setLastRotateAngle(angle);
      }
    }
  }, [isDraggingPoint, draggingPoint, points, startPos, touchStartDistance, lastTouchZoom, lastRotateAngle, zoom, getEventPos, getTouchCenter]);

  // Handler de fin de touch
  const handleTouchEnd = useCallback(() => {
    setDraggingPoint(null);
    setIsDraggingPoint(false);
    setStartPos(null);
    setTouchStartDistance(null);
    setLastTouchZoom(null);
    setLastRotateAngle(null);
  }, []);

  // Handlers para mouse
  const handleMouseDown = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const pos = getEventPos(canvas, e);
    const pointIndex = points.findIndex(
      (p) => Math.hypot(p.x - pos.x, p.y - pos.y) < 12
    );
    
    if (pointIndex !== -1) {
      setDraggingPoint(pointIndex);
    } else if (e.ctrlKey || e.metaKey) {
      setIsRotating(true);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const angle = Math.atan2(pos.y - centerY, pos.x - centerX) * (180 / Math.PI);
      setLastRotateAngle(angle);
    } else if (e.shiftKey || e.button === 1) {
      setIsPanning(true);
      setLastPanPoint(pos);
    }
  }, [points, getEventPos]);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const pos = getEventPos(canvas, e);
    
    if (draggingPoint !== null) {
      const newPoints = [...points];
      newPoints[draggingPoint] = pos;
      setPoints(newPoints);
    } else if (isRotating && lastRotateAngle !== null) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const angle = Math.atan2(pos.y - centerY, pos.x - centerX) * (180 / Math.PI);
      const deltaAngle = angle - lastRotateAngle;
      setRotation(prev => (prev + deltaAngle) % 360);
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
  }, [draggingPoint, points, isRotating, lastRotateAngle, isPanning, lastPanPoint, getEventPos]);

  const handleMouseUp = useCallback(() => {
    setDraggingPoint(null);
    setIsPanning(false);
    setIsRotating(false);
    setLastPanPoint(null);
    setLastRotateAngle(null);
  }, []);

  // Wheel handler
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const pos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoom * delta, 0.1), 10);
    
    setPan(prev => ({
      x: pos.x - (pos.x - prev.x) * (newZoom / zoom),
      y: pos.y - (pos.y - prev.y) * (newZoom / zoom)
    }));
    
    setZoom(newZoom);
  }, [zoom]);

  // Setup de event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const touchMoveHandler = (e) => handleTouchMove(e);
    const wheelHandler = (e) => handleWheel(e);
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', touchMoveHandler, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchcancel', handleTouchEnd);
    canvas.addEventListener('wheel', wheelHandler, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', touchMoveHandler);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
      canvas.removeEventListener('wheel', wheelHandler);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleWheel]);

  // Setup de mouse listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  // Funciones de utilidad
  const canvasToImageCoords = (canvasPoint) => {
    if (!img) return { x: 0, y: 0 };
    
    const centerX = pan.x + (img.width * zoom) / 2;
    const centerY = pan.y + (img.height * zoom) / 2;
    
    const dx = canvasPoint.x - centerX;
    const dy = canvasPoint.y - centerY;
    
    const angle = (-rotation * Math.PI) / 180;
    const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle);
    const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle);
    
    const imgX = (centerX + rotatedX - pan.x) / zoom;
    const imgY = (centerY + rotatedY - pan.y) / zoom;
    
    return { x: imgX, y: imgY };
  };

  const handleCrop = () => {
    if (!img || points.length === 0) return;

    const imagePoints = points.map(p => canvasToImageCoords(p));

    const minX = Math.max(0, Math.min(...imagePoints.map((p) => p.x)));
    const minY = Math.max(0, Math.min(...imagePoints.map((p) => p.y)));
    const maxX = Math.min(img.width, Math.max(...imagePoints.map((p) => p.x)));
    const maxY = Math.min(img.height, Math.max(...imagePoints.map((p) => p.y)));
    const width = maxX - minX;
    const height = maxY - minY;

    const tempCanvas = document.createElement("canvas");
    
    if (rotation % 360 !== 0) {
      const diagonal = Math.sqrt(img.width ** 2 + img.height ** 2);
      tempCanvas.width = diagonal;
      tempCanvas.height = diagonal;
    } else {
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
    }
    
    const ctx = tempCanvas.getContext("2d");
    
    ctx.save();
    const centerX = tempCanvas.width / 2;
    const centerY = tempCanvas.height / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
    ctx.restore();
    
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = width;
    finalCanvas.height = height;
    const finalCtx = finalCanvas.getContext("2d");

    finalCtx.beginPath();
    finalCtx.moveTo(imagePoints[0].x - minX, imagePoints[0].y - minY);
    for (let i = 1; i < imagePoints.length; i++) {
      finalCtx.lineTo(imagePoints[i].x - minX, imagePoints[i].y - minY);
    }
    finalCtx.closePath();
    finalCtx.clip();

    const offsetX = rotation % 360 !== 0 ? (tempCanvas.width - img.width) / 2 : 0;
    const offsetY = rotation % 360 !== 0 ? (tempCanvas.height - img.height) / 2 : 0;

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
      const size = isMobile ? 80 : 120;
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
    setRotation(prev => (prev - 90) % 360);
  };

  const handleRotateRight = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleFlipHorizontal = () => {
    setRotation(prev => (prev + 180) % 360);
  };

  const handleResetRotation = () => {
    setRotation(0);
  };

  const handleResetView = () => {
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
    setRotation(0);
  };

  return (
    <div 
      ref={containerRef} 
      className="bg-white rounded-xl shadow-lg p-3 sm:p-4 lg:p-6 w-full"
    >
      {/* Header con controles principales */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
              Editor de Imagen
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Recorte poligonal con zoom, rotación y pan
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 hidden sm:inline">
              {Math.round(zoom * 100)}% • {Math.round(rotation)}°
            </span>
            <div className="flex gap-1">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1">
                {isMobile ? (
                  <>
                    <MdTouchApp className="w-3 h-3" />
                    Toque
                  </>
                ) : (
                  <>
                    <MdMouse className="w-3 h-3" />
                    Ratón
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Controles de zoom y vista */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
          {/* Grupo Zoom */}
          <div className="flex items-center bg-gray-50 rounded-lg p-1 sm:p-2">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-2 sm:p-2.5 hover:bg-white rounded-lg transition-colors"
              title="Alejar"
            >
              <FiZoomOut className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
            </button>
            <div className="px-3 sm:px-4 text-center min-w-[80px] sm:min-w-[100px]">
              <span className="text-sm sm:text-base font-semibold text-gray-800">
                {Math.round(zoom * 100)}%
              </span>
              <div className="text-xs text-gray-500">Zoom</div>
            </div>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-2 sm:p-2.5 hover:bg-white rounded-lg transition-colors"
              title="Acercar"
            >
              <FiZoomIn className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
            </button>
            <button
              type="button"
              onClick={handleFitToScreen}
              className="p-2 sm:p-2.5 hover:bg-white rounded-lg transition-colors ml-1 sm:ml-2"
              title="Ajustar a pantalla"
            >
              <FiMaximize className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
            </button>
          </div>

          {/* Grupo Rotación */}
          <div className="flex items-center bg-gray-50 rounded-lg p-1 sm:p-2">
            <button
              type="button"
              onClick={handleRotateLeft}
              className="p-2 sm:p-2.5 hover:bg-white rounded-lg transition-colors"
              title="Rotar izquierda 90°"
            >
              <FiRotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
            </button>
            <div className="px-3 sm:px-4 text-center min-w-[60px] sm:min-w-[80px]">
              <input
                type="number"
                value={Math.round(rotation % 360)}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setRotation(value % 360);
                }}
                className="w-full text-center bg-transparent border-none text-sm sm:text-base font-semibold text-gray-800 focus:outline-none focus:ring-0 p-0"
                title="Ángulo de rotación"
                step="1"
                min="-360"
                max="360"
              />
              <div className="text-xs text-gray-500">°</div>
            </div>
            <button
              type="button"
              onClick={handleRotateRight}
              className="p-2 sm:p-2.5 hover:bg-white rounded-lg transition-colors"
              title="Rotar derecha 90°"
            >
              <FiRotateCw className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
            </button>
            <button
              type="button"
              onClick={handleFlipHorizontal}
              className="p-2 sm:p-2.5 hover:bg-white rounded-lg transition-colors ml-1 sm:ml-2"
              title="Voltear horizontalmente"
            >
              <MdOutlineFlipToFront className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
            </button>
          </div>

          {/* Botón reset vista */}
          <button
            type="button"
            onClick={handleResetView}
            className="p-2 sm:p-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
            title="Resetear vista"
          >
            <FiRefreshCw className="w-4 h-4 text-gray-700" />
            <span className="text-xs sm:text-sm hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="mb-4 sm:mb-6 relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="w-full h-auto max-h-[70vh] cursor-crosshair touch-none block"
        />
        
        {/* Overlay de ayuda en móvil */}
        {isMobile && points.length > 0 && (
          <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs p-2 rounded-lg">
            <div className="flex items-center justify-between">
              <span>Arrastra puntos azules</span>
              <span>2 dedos: zoom/rotar</span>
            </div>
          </div>
        )}
      </div>

      {/* Controles de polígono */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Polígono de Recorte</h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleAddPoint}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <FiPlus className="w-4 h-4" />
                <span>{points.length === 0 ? "Crear Polígono" : "Reiniciar"}</span>
              </button>
              
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                disabled={points.length === 0}
              >
                <FiTrash2 className="w-4 h-4" />
                <span>Limpiar</span>
              </button>
              
              <button
                type="button"
                onClick={handleCrop}
                disabled={points.length === 0}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <FiScissors className="w-4 h-4" />
                <span>Recortar</span>
              </button>
            </div>
          </div>
          
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Estadísticas</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500">Puntos</div>
                <div className="text-lg font-semibold text-gray-800">{points.length}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500">Área</div>
                <div className="text-lg font-semibold text-gray-800">
                  {points.length > 2 ? "Definida" : "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <MdOutlineGpsFixed className="w-5 h-5 text-gray-500" />
          <h4 className="text-sm font-medium text-gray-700">Instrucciones</h4>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {isMobile ? (
            <>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <MdTouchApp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Pantalla táctil</span>
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Toca y arrastra puntos azules</li>
                  <li>• Un dedo: mover imagen</li>
                  <li>• Dos dedos (pinch): zoom</li>
                  <li>• Giro de dedos: rotar</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <MdMouse className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Ratón</span>
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Arrastra puntos azules</li>
                  <li>• Rueda: zoom in/out</li>
                  <li>• Shift + arrastrar: mover</li>
                  <li>• Ctrl + arrastrar: rotar</li>
                </ul>
              </div>
            </>
          )}
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <FiGrid className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Atajos</span>
            </div>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• ↶ ↷ Rotar 90°</li>
              <li>• + - Control de zoom</li>
              <li>• ⊡ Ajustar a pantalla</li>
              <li>• ⇄ Voltear imagen</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropPolygon;