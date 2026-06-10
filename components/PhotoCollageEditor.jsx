"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

const CANVAS_PRESETS = {
  "1:1 (1080x1080)": { width: 1080, height: 1080 },
  "16:9 (1920x1080)": { width: 1920, height: 1080 },
  "9:16 (1080x1920)": { width: 1080, height: 1920 },
  "4:5 (1080x1350)": { width: 1080, height: 1350 },
  "21:9 (2560x1080)": { width: 2560, height: 1080 },
};

const DEFAULT_CANVAS = { width: 1080, height: 1080 };

const generateId = () => Math.random().toString(36).substr(2, 9);

const PRESETS = [
  { name: "2 Horizontal", frames: [{ x: 0, y: 0, w: 0.5, h: 1 }, { x: 0.5, y: 0, w: 0.5, h: 1 }] },
  { name: "2 Vertical", frames: [{ x: 0, y: 0, w: 1, h: 0.5 }, { x: 0, y: 0.5, w: 1, h: 0.5 }] },
  { name: "3 Grid", frames: [{ x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 }, { x: 0, y: 0.5, w: 1, h: 0.5 }] },
  { name: "4 Square", frames: [{ x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 }, { x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }] },
  { name: "6 Grid", frames: Array.from({ length: 6 }, (_, i) => ({ x: (i % 3) / 3, y: Math.floor(i / 3) / 2, w: 1 / 3, h: 1 / 2 })) },
  { name: "9 Grid", frames: Array.from({ length: 9 }, (_, i) => ({ x: (i % 3) / 3, y: Math.floor(i / 3) / 3, w: 1 / 3, h: 1 / 3 })) },
  { name: "Pyramid", frames: [{ x: 0.25, y: 0, w: 0.5, h: 0.5 }, { x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }] },
  { name: "Diagonal 2", frames: [{ x: 0, y: 0, w: 0.6, h: 0.6 }, { x: 0.4, y: 0.4, w: 0.6, h: 0.6 }] },
  { name: "4 Uneven", frames: [{ x: 0, y: 0, w: 0.6, h: 0.6 }, { x: 0.6, y: 0, w: 0.4, h: 0.4 }, { x: 0, y: 0.6, w: 0.4, h: 0.4 }, { x: 0.4, y: 0.6, w: 0.6, h: 0.4 }] },
  { name: "3 Vertical", frames: [{ x: 0, y: 0, w: 1 / 3, h: 1 }, { x: 1 / 3, y: 0, w: 1 / 3, h: 1 }, { x: 2 / 3, y: 0, w: 1 / 3, h: 1 }] },
];

export default function PhotoCollageEditor() {
  const [photos, setPhotos] = useState([]);
  const [elements, setElements] = useState([]);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [preset, setPreset] = useState(PRESETS[0]);
  const [layoutMode, setLayoutMode] = useState(false);
  const [panZoom, setPanZoom] = useState({});
  const [contextMenu, setContextMenu] = useState(null);
  const [isDraggingPan, setIsDraggingPan] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [canvasSizeKey, setCanvasSizeKey] = useState("1:1 (1080x1080)");
  const canvasSize = CANVAS_PRESETS[canvasSizeKey] || DEFAULT_CANVAS;
  const [swapMode, setSwapMode] = useState(false);
  const swapFirstFrameRef = useRef(null);

  // Export state
  const [exporting, setExporting] = useState(false);
  const [exportBlob, setExportBlob] = useState(null);
  const [exportError, setExportError] = useState(null);

  const canvasRef = useRef(null);
  const imageCache = useRef({});

  const preloadImage = useCallback((src) => {
    if (!imageCache.current[src]) {
      const img = new Image();
      img.src = src;
      imageCache.current[src] = img;
    }
    return imageCache.current[src];
  }, []);

  useEffect(() => { setPanZoom({}); }, [canvasSizeKey]);

  useEffect(() => {
    if (photos.length === 0) {
      setElements([]);
      return;
    }
    const newElements = preset.frames.map((frame, idx) => {
      const photo = photos[idx % photos.length];
      return {
        id: generateId(),
        photoId: photo ? photo.id : null,
        frameIdx: idx,
        transform: { ...frame },
        visible: !!photo,
      };
    });
    setElements(newElements);
    setPanZoom({});
  }, [photos, preset]);

  const getPanZoom = (frameIdx) => panZoom[frameIdx] || { offsetX: 0, offsetY: 0, zoom: 1 };

  const drawCanvas = useCallback((hideOverlay = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { width, height } = canvasSize;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    elements.forEach((el) => {
      if (!el.visible || !el.photoId) return;
      const photo = photos.find((p) => p.id === el.photoId);
      if (!photo) return;
      const img = preloadImage(photo.url);
      if (!img || !img.complete) return;

      const frame = el.transform;
      const x = frame.x * width;
      const y = frame.y * height;
      const w = frame.w * width;
      const h = frame.h * height;

      const pz = getPanZoom(el.frameIdx);
      const zoom = pz.zoom;
      const offsetX = pz.offsetX;
      const offsetY = pz.offsetY;

      const imgAspect = img.width / img.height;
      const frameAspect = w / h;
      let baseWidth, baseHeight;
      if (imgAspect > frameAspect) {
        baseHeight = h;
        baseWidth = img.width * (h / img.height);
      } else {
        baseWidth = w;
        baseHeight = img.height * (w / img.width);
      }
      const drawWidth = baseWidth * zoom;
      const drawHeight = baseHeight * zoom;
      const centerX = x + w / 2;
      const centerY = y + h / 2;
      const drawX = centerX - drawWidth / 2 + offsetX;
      const drawY = centerY - drawHeight / 2 + offsetY;

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();

      if (!hideOverlay && selectedFrame === el.frameIdx) {
        ctx.strokeStyle = "#00f";
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);
      }
    });
  }, [elements, photos, selectedFrame, preloadImage, panZoom, canvasSize]);

  useEffect(() => { drawCanvas(); }, [drawCanvas]);

  useEffect(() => {
    photos.forEach((photo) => {
      const img = preloadImage(photo.url);
      if (img && !img.complete) {
        img.onload = () => drawCanvas();
        img.onerror = () => drawCanvas();
      }
    });
  }, [photos, drawCanvas, preloadImage]);

  const handlePhotoUpload = (e) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const id = generateId();
      const url = URL.createObjectURL(file);
      setPhotos((prev) => [...prev, { id, url, file }]);
    });
  };

  const applyPreset = (presetObj) => setPreset(presetObj);

  // --- Mouse handlers ---
  const handleCanvasMouseDown = (e) => {
    if (layoutMode || swapMode || selectedFrame === null) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const el = elements.find((el) => el.frameIdx === selectedFrame);
    if (!el) return;
    const f = el.transform;
    const fx = f.x * canvas.width;
    const fy = f.y * canvas.height;
    const fw = f.w * canvas.width;
    const fh = f.h * canvas.height;
    if (mx >= fx && mx <= fx + fw && my >= fy && my <= fy + fh) {
      setIsDraggingPan(true);
      dragStartRef.current = { x: mx, y: my };
      e.preventDefault();
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDraggingPan || selectedFrame === null || layoutMode || swapMode) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const dx = mx - dragStartRef.current.x;
    const dy = my - dragStartRef.current.y;

    setPanZoom((prev) => {
      const current = prev[selectedFrame] || { offsetX: 0, offsetY: 0, zoom: 1 };
      return {
        ...prev,
        [selectedFrame]: {
          ...current,
          offsetX: current.offsetX + dx,
          offsetY: current.offsetY + dy,
        },
      };
    });
    dragStartRef.current = { x: mx, y: my };
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingPan(false);
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    let hitIdx = null;
    elements.forEach((el) => {
      const f = el.transform;
      const x = f.x * canvas.width;
      const y = f.y * canvas.height;
      const w = f.w * canvas.width;
      const h = f.h * canvas.height;
      if (mx >= x && mx <= x + w && my >= y && my <= y + h) {
        hitIdx = el.frameIdx;
      }
    });

    if (swapMode && hitIdx !== null) {
      if (swapFirstFrameRef.current === null) {
        swapFirstFrameRef.current = hitIdx;
        setSelectedFrame(hitIdx);
      } else if (swapFirstFrameRef.current !== hitIdx) {
        const frameA = swapFirstFrameRef.current;
        const frameB = hitIdx;
        setElements((prev) => {
          const newElements = prev.map((el) => ({ ...el }));
          const elA = newElements.find((el) => el.frameIdx === frameA);
          const elB = newElements.find((el) => el.frameIdx === frameB);
          if (elA && elB) {
            const tempPhotoId = elA.photoId;
            const tempVisible = elA.visible;
            elA.photoId = elB.photoId;
            elA.visible = elB.visible;
            elB.photoId = tempPhotoId;
            elB.visible = tempVisible;
          }
          return newElements;
        });
        setPanZoom((prev) => {
          const newPZ = { ...prev };
          delete newPZ[frameA];
          delete newPZ[frameB];
          return newPZ;
        });
        swapFirstFrameRef.current = null;
        setSelectedFrame(null);
        setSwapMode(false);
      }
      return;
    }

    setSelectedFrame(hitIdx);
    swapFirstFrameRef.current = null;
  };

  const handleCanvasContextMenu = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    let hitIdx = null;
    elements.forEach((el) => {
      const f = el.transform;
      const x = f.x * canvas.width;
      const y = f.y * canvas.height;
      const w = f.w * canvas.width;
      const h = f.h * canvas.height;
      if (mx >= x && mx <= x + w && my >= y && my <= y + h) hitIdx = el.frameIdx;
    });
    if (hitIdx !== null) {
      setSelectedFrame(hitIdx);
      setContextMenu({ x: e.clientX, y: e.clientY, frameIdx: hitIdx });
    }
  };

  const deleteFramePhoto = () => {
    if (!contextMenu) return;
    setElements((prev) =>
      prev.map((el) =>
        el.frameIdx === contextMenu.frameIdx ? { ...el, photoId: null, visible: false } : el
      )
    );
    setContextMenu(null);
  };

  const replaceFramePhoto = () => {
    if (!contextMenu) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const id = generateId();
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      img.onload = () => {
        setPhotos((prev) => [...prev, { id, url, file }]);
        setElements((prev) =>
          prev.map((el) =>
            el.frameIdx === contextMenu.frameIdx
              ? { ...el, photoId: id, visible: true }
              : el
          )
        );
        setContextMenu(null);
        drawCanvas();
      };
      img.onerror = () => setContextMenu(null);
    };
    input.click();
  };

  const exportCollage = async () => {
    if (elements.length === 0) return;
    setExporting(true);
    setExportError(null);
    setExportBlob(null);

    drawCanvas(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        }, "image/png");
      });
      setExportBlob(blob);
      setExporting(false);
    } catch (err) {
      setExportError(err.message);
      setExporting(false);
    } finally {
      drawCanvas(false);
    }
  };

  const downloadBlob = () => {
    if (!exportBlob) return;
    const url = URL.createObjectURL(exportBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "collage.png";
    a.click();
  };

  const closeModal = () => {
    setExporting(false);
    setExportBlob(null);
    setExportError(null);
  };

  const selectedPanZoom = selectedFrame !== null ? getPanZoom(selectedFrame) : { offsetX: 0, offsetY: 0, zoom: 1 };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white" onContextMenu={(e) => e.preventDefault()}>
      {/* Toolbar */}
      <div className="p-3 bg-gray-800 flex flex-wrap gap-3 items-center border-b border-gray-700">
        <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" id="photo-upload" />
        <label htmlFor="photo-upload" className="px-3 py-1 bg-blue-600 rounded text-sm cursor-pointer">Add Photos</label>

        <select value={preset?.name} onChange={(e) => applyPreset(PRESETS.find(p => p.name === e.target.value) || PRESETS[0])} className="bg-gray-700 rounded px-2 py-1 text-sm">
          {PRESETS.map(p => <option key={p.name}>{p.name}</option>)}
        </select>

        <select value={canvasSizeKey} onChange={(e) => setCanvasSizeKey(e.target.value)} className="bg-gray-700 rounded px-2 py-1 text-sm">
          {Object.keys(CANVAS_PRESETS).map(key => <option key={key}>{key}</option>)}
        </select>

        <button onClick={() => setLayoutMode(!layoutMode)} className={`px-3 py-1 rounded text-sm ${layoutMode ? 'bg-green-600' : 'bg-gray-600'}`}>
          {layoutMode ? "Layout Mode" : "Layout"}
        </button>
        <button onClick={() => { setSwapMode(!swapMode); swapFirstFrameRef.current = null; if (!swapMode) setSelectedFrame(null); }} className={`px-3 py-1 rounded text-sm ${swapMode ? 'bg-yellow-600' : 'bg-gray-600'}`}>
          {swapMode ? "Swapping (click two frames)" : "Swap Media"}
        </button>
        <button onClick={exportCollage} className="px-3 py-1 bg-yellow-600 rounded text-sm ml-auto">Export PNG</button>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center bg-black relative">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="max-w-full max-h-full object-contain"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onClick={handleCanvasClick}
          onContextMenu={handleCanvasContextMenu}
        />
      </div>

      {/* Pan/zoom panel */}
      {selectedFrame !== null && !layoutMode && !swapMode && (
        <div className="bg-gray-800 p-2 flex flex-wrap gap-4 items-center text-xs border-t border-gray-700">
          <span>Pan: drag inside frame</span>
          <label>Zoom:
            <input type="range" min={0.5} max={3} step={0.01} value={selectedPanZoom.zoom} onChange={(e) => { const val = parseFloat(e.target.value); setPanZoom(prev => ({ ...prev, [selectedFrame]: { ...prev[selectedFrame], zoom: val } })); }} className="w-32 ml-2" />
            <span className="ml-1">{selectedPanZoom.zoom.toFixed(2)}x</span>
          </label>
          <button onClick={() => setPanZoom(prev => ({ ...prev, [selectedFrame]: { offsetX: 0, offsetY: 0, zoom: 1 } }))} className="px-2 py-1 bg-gray-600 rounded">Reset</button>
        </div>
      )}

      {/* Layout controls */}
      {layoutMode && selectedFrame !== null && (
        <div className="bg-gray-800 p-2 flex flex-wrap gap-2 text-xs border-t border-gray-700">
          <label>Left % <input type="number" value={Math.round((elements.find(e => e.frameIdx === selectedFrame)?.transform.x || 0) * 100)} onChange={(e) => { const val = Number(e.target.value) / 100; setElements(prev => prev.map(el => el.frameIdx === selectedFrame ? { ...el, transform: { ...el.transform, x: val } } : el)); }} className="w-16 bg-gray-700 p-1 rounded" /></label>
          <label>Top % <input type="number" value={Math.round((elements.find(e => e.frameIdx === selectedFrame)?.transform.y || 0) * 100)} onChange={(e) => { const val = Number(e.target.value) / 100; setElements(prev => prev.map(el => el.frameIdx === selectedFrame ? { ...el, transform: { ...el.transform, y: val } } : el)); }} className="w-16 bg-gray-700 p-1 rounded" /></label>
          <label>Width % <input type="number" value={Math.round((elements.find(e => e.frameIdx === selectedFrame)?.transform.w || 0) * 100)} onChange={(e) => { const val = Number(e.target.value) / 100; setElements(prev => prev.map(el => el.frameIdx === selectedFrame ? { ...el, transform: { ...el.transform, w: val } } : el)); }} className="w-16 bg-gray-700 p-1 rounded" /></label>
          <label>Height % <input type="number" value={Math.round((elements.find(e => e.frameIdx === selectedFrame)?.transform.h || 0) * 100)} onChange={(e) => { const val = Number(e.target.value) / 100; setElements(prev => prev.map(el => el.frameIdx === selectedFrame ? { ...el, transform: { ...el.transform, h: val } } : el)); }} className="w-16 bg-gray-700 p-1 rounded" /></label>
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <div className="fixed bg-gray-700 border border-gray-600 rounded shadow-lg py-1 text-sm z-50" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <button onClick={deleteFramePhoto} className="block w-full text-left px-4 py-1 hover:bg-gray-600">Delete Photo</button>
          <button onClick={replaceFramePhoto} className="block w-full text-left px-4 py-1 hover:bg-gray-600">Replace Photo</button>
        </div>
      )}

      {/* Export Modal */}
      {(exporting || exportBlob || exportError) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-gray-800 rounded-xl p-6 w-80 text-center space-y-4">
            {exportError ? (
              <>
                <h3 className="text-lg font-semibold text-red-400">Export Error</h3>
                <p className="text-sm">{exportError}</p>
                <button onClick={closeModal} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm">Close</button>
              </>
            ) : exportBlob ? (
              <>
                <h3 className="text-lg font-semibold text-green-400">Export Complete</h3>
                <p className="text-sm">Your collage is ready.</p>
                <div className="flex flex-col gap-2">
                  <button onClick={downloadBlob} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm">Download PNG</button>
                  <button onClick={closeModal} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm">Close</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold">Exporting...</h3>
                <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div className="bg-blue-500 h-4 rounded-full animate-pulse w-full" />
                </div>
                <p className="text-sm">Generating image...</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}