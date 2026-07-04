"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaArrowsAlt,
  FaDownload,
  FaExchangeAlt,
  FaImages,
  FaPlus,
  FaRedo,
  FaTrash,
  FaUndo,
} from "react-icons/fa";

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

  // Drag-to-adjust input state
  const [editingInputKey, setEditingInputKey] = useState(null);
  const [isDraggingInput, setIsDraggingInput] = useState(false);
  const [dragInputKey, setDragInputKey] = useState(null);
  const [dragStartValue, setDragStartValue] = useState(0);
  const [dragStartPointerX, setDragStartPointerX] = useState(0);
  const lastTapForInputRef = useRef({ time: 0, key: null });

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

  // ─── Drag-to-adjust useEffect ───
  useEffect(() => {
    if (!isDraggingInput) return;
    const onPointerMove = (e) => {
      const deltaX = e.clientX - dragStartPointerX;
      const sensitivity = canvasSize.width * 0.01; // 1% of canvas width
      const newValue = Math.round((dragStartValue * canvasSize.width + deltaX * sensitivity) * 10) / 10;
      const clip = elements.find((c) => c.frameIdx === selectedFrame);
      if (clip) {
        const newTransform = { ...clip.transform, [dragInputKey]: newValue / canvasSize.width };
        if (dragInputKey === "w" || dragInputKey === "h") {
          if (newTransform[dragInputKey] < 0.01) newTransform[dragInputKey] = 0.01;
        }
        setElements((prev) =>
          prev.map((el) =>
            el.frameIdx === selectedFrame ? { ...el, transform: newTransform } : el
          )
        );
      }
    };
    const onPointerUp = () => {
      setIsDraggingInput(false);
      setDragInputKey(null);
    };
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
    };
  }, [isDraggingInput, dragStartPointerX, dragStartValue, dragInputKey, selectedFrame, elements, canvasSize]);

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

  // --- Mouse handlers (unchanged) ---
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
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "var(--white)", color: "var(--black)" }}
    >
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
          >
            <FaImages size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "var(--black)" }}>
              Photo Collage
            </h2>
            <p className="text-xs" style={{ color: "var(--gray)" }}>
              Create stunning photo layouts with presets
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
            id="photo-upload"
          />
          <motion.label
            htmlFor="photo-upload"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer flex items-center gap-2 shadow-lg"
            style={{
              backgroundColor: "var(--red)",
              color: "var(--white)",
              boxShadow: "0 4px 16px rgba(239, 68, 68, 0.3)",
            }}
          >
            <FaPlus size={14} /> Add Photos
          </motion.label>

          <div className="flex items-center gap-1 ml-2">
            <FaImages size={12} style={{ color: "var(--gray)" }} />
            <select
              value={preset?.name}
              onChange={(e) =>
                applyPreset(PRESETS.find((p) => p.name === e.target.value) || PRESETS[0])
              }
              className="px-3 py-2 rounded-xl text-sm font-semibold cursor-pointer border"
              style={{
                backgroundColor: "var(--white)",
                borderColor: "var(--border)",
                color: "var(--black)",
              }}
            >
              {PRESETS.map((p) => (
                <option key={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          <select
            value={canvasSizeKey}
            onChange={(e) => setCanvasSizeKey(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm font-semibold cursor-pointer border"
            style={{
              backgroundColor: "var(--white)",
              borderColor: "var(--border)",
              color: "var(--black)",
            }}
          >
            {Object.keys(CANVAS_PRESETS).map((key) => (
              <option key={key}>{key}</option>
            ))}
          </select>

          <div className="flex gap-1.5 ml-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLayoutMode(!layoutMode)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all"
              style={{
                backgroundColor: layoutMode ? "var(--red)" : "var(--lightgray)",
                color: layoutMode ? "var(--white)" : "var(--black)",
              }}
            >
              <FaArrowsAlt size={12} /> {layoutMode ? "Done" : "Layout"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSwapMode(!swapMode);
                swapFirstFrameRef.current = null;
                if (!swapMode) setSelectedFrame(null);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all"
              style={{
                backgroundColor: swapMode ? "var(--red)" : "var(--lightgray)",
                color: swapMode ? "var(--white)" : "var(--black)",
              }}
            >
              <FaExchangeAlt size={12} /> {swapMode ? "Swapping" : "Swap"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportCollage}
              className="px-4 py-2 rounded-xl text-sm font-bold cursor-pointer flex items-center gap-2 shadow-lg"
              style={{
                backgroundColor: "var(--red)",
                color: "var(--white)",
                boxShadow: "0 4px 16px rgba(239, 68, 68, 0.3)",
              }}
            >
              <FaDownload size={14} /> Export
            </motion.button>
          </div>
        </div>
      </div>

      {/* ─── Canvas Area ──────────────────────────────────── */}
      <div
        className="flex-1 flex items-center justify-center p-4 overflow-auto"
        style={{ backgroundColor: "var(--lightgray)" }}
      >
        <motion.div
          className="rounded-2xl overflow-hidden shadow-2xl"
          style={{ border: "4px solid var(--white)" }}
          whileHover={{ scale: 1.005 }}
          transition={{ duration: 0.3 }}
        >
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="max-w-full max-h-full block"
            style={{
              maxHeight: "calc(100vh - 260px)",
              maxWidth: "calc(100vw - 40px)",
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onClick={handleCanvasClick}
            onContextMenu={handleCanvasContextMenu}
          />
        </motion.div>
      </div>

      {/* ─── Transform Controls (always visible when frame selected) ─── */}
      <AnimatePresence>
        {selectedFrame !== null && !layoutMode && !swapMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-wrap gap-2 p-2 rounded-xl text-xs font-medium mb-2 border-t"
            style={{
              backgroundColor: "var(--lightgray)",
              borderColor: "var(--border)",
            }}
          >
            {["X", "Y", "W", "H"].map((label, i) => {
              const key = ["x", "y", "w", "h"][i];
              const colors = ["var(--red)", "var(--orange)", "var(--yellow)", "var(--pink)"];
              const clip = elements.find((c) => c.frameIdx === selectedFrame);
              if (!clip) return null;
              const pixelValue = clip.transform[key] * canvasSize.width;
              const isEditing = editingInputKey === key;
              return (
                <label
                  key={label}
                  className="flex items-center gap-1"
                  style={{ color: "var(--black)" }}
                >
                  <span
                    className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold"
                    style={{
                      backgroundColor: colors[i],
                      color: "var(--white)",
                    }}
                  >
                    {label}
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={isEditing ? pixelValue : Math.round(pixelValue)}
                    onChange={(e) => {
                      if (clip && isEditing) {
                        const val = Number(e.target.value) / canvasSize.width;
                        setElements((prev) =>
                          prev.map((el) =>
                            el.frameIdx === selectedFrame
                              ? { ...el, transform: { ...el.transform, [key]: val } }
                              : el
                          )
                        );
                      }
                    }}
                    onPointerDown={(e) => {
                      if (e.button !== 0) return;
                      if (isEditing) return; // let default input behavior happen

                      // Double‑tap detection
                      const now = Date.now();
                      const lastTap = lastTapForInputRef.current;
                      if (lastTap.key === key && now - lastTap.time < 300) {
                        e.preventDefault();
                        setEditingInputKey(key);
                        lastTapForInputRef.current = { time: 0, key: null };
                        return;
                      }
                      lastTapForInputRef.current = { time: now, key: key };

                      e.preventDefault();
                      setIsDraggingInput(true);
                      setDragInputKey(key);
                      setDragStartValue(clip.transform[key]);
                      setDragStartPointerX(e.clientX);
                    }}
                    onBlur={() => {
                      if (isEditing) {
                        setEditingInputKey(null);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (isEditing && e.key === "Enter") {
                        e.target.blur();
                      }
                    }}
                    className={`w-16 p-1.5 rounded-lg text-xs font-semibold border ${
                      isEditing
                        ? "cursor-text border-blue-500 ring-1 ring-blue-200"
                        : "cursor-ew-resize"
                    }`}
                    style={{
                      backgroundColor: "var(--white)",
                      color: "var(--black)",
                      borderColor: isEditing ? "var(--blue)" : "var(--border)",
                    }}
                    readOnly={!isEditing}
                  />
                  <span className="text-[10px]" style={{ color: "var(--gray)" }}>
                    px
                  </span>
                </label>
              );
            })}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const clip = elements.find((c) => c.frameIdx === selectedFrame);
                if (clip) {
                  // Reset to original frame from preset
                  const originalFrame = preset.frames[clip.frameIdx];
                  if (originalFrame) {
                    setElements((prev) =>
                      prev.map((el) =>
                        el.frameIdx === selectedFrame
                          ? { ...el, transform: { ...originalFrame } }
                          : el
                      )
                    );
                  }
                }
              }}
              className="flex items-center px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
              style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
            >
              <FaUndo size={10} className="mr-2" /> Reset
            </motion.button>
            <div className="flex gap-1 ml-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={deleteFramePhoto}
                className="px-2 py-1 rounded text-[10px] font-bold cursor-pointer flex items-center gap-1"
                style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
              >
                <FaTrash size={10} /> Delete
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={replaceFramePhoto}
                className="px-2 py-1 rounded text-[10px] font-bold cursor-pointer flex items-center gap-1"
                style={{ backgroundColor: "var(--blue)", color: "var(--white)" }}
              >
                <FaExchangeAlt size={10} /> Replace
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Pan/Zoom controls (existing, below transform) ─── */}
      <AnimatePresence>
        {selectedFrame !== null && !layoutMode && !swapMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex items-center justify-between gap-4 px-4 py-3 border-t text-sm"
            style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
              >
                <FaImages size={14} />
              </div>
              <span className="font-bold" style={{ color: "var(--black)" }}>
                Frame {selectedFrame + 1}
              </span>
            </div>
            <div className="h-6" style={{ backgroundColor: "var(--border)" }} />
            <span className="sm:hidden l:block text-xs font-medium" style={{ color: "var(--gray)" }}>
              🖱️ Drag inside frame to pan
            </span>
            <div className=" h-6" style={{ backgroundColor: "var(--border)" }} />
            <label
              className="flex items-center gap-2 text-xs font-medium"
              style={{ color: "var(--black)" }}
            >
              Zoom
              <input
                type="range"
                min={0.5}
                max={3}
                step={0.01}
                value={selectedPanZoom.zoom}
                onChange={(e) =>
                  setPanZoom((prev) => ({
                    ...prev,
                    [selectedFrame]: {
                      ...prev[selectedFrame],
                      zoom: parseFloat(e.target.value),
                    },
                  }))
                }
                className="w-24"
              />
              <span className="font-mono text-xs" style={{ color: "var(--gray)" }}>
                {selectedPanZoom.zoom.toFixed(2)}x
              </span>
            </label>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                setPanZoom((prev) => ({
                  ...prev,
                  [selectedFrame]: { offsetX: 0, offsetY: 0, zoom: 1 },
                }))
              }
              className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ml-auto flex items-center gap-1.5"
              style={{ backgroundColor: "var(--lightgray)", color: "var(--black)" }}
            >
              <FaUndo size={11} /> Reset
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Layout Mode (when enabled) ─── */}
      <AnimatePresence>
        {layoutMode && selectedFrame !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex items-center gap-3 px-4 py-3 border-t text-xs font-medium"
            style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
              >
                <FaArrowsAlt size={14} />
              </div>
              <span className="font-bold text-sm" style={{ color: "var(--red)" }}>
                Layout Mode
              </span>
            </div>
            <div className="w-px h-6" style={{ backgroundColor: "var(--border)" }} />
            {["X", "Y", "W", "H"].map((label, i) => {
              const key = ["x", "y", "w", "h"][i];
              const colors = ["var(--red)", "var(--orange)", "var(--yellow)", "var(--pink)"];
              return (
                <label
                  key={label}
                  className="flex items-center gap-1.5"
                  style={{ color: "var(--black)" }}
                >
                  <span
                    className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold"
                    style={{ backgroundColor: colors[i], color: "var(--white)" }}
                  >
                    {label}
                  </span>
                  <input
                    type="number"
                    value={Math.round(
                      (elements.find((e) => e.frameIdx === selectedFrame)?.transform[key] || 0) *
                        100
                    )}
                    onChange={(e) => {
                      const val = Number(e.target.value) / 100;
                      setElements((prev) =>
                        prev.map((el) =>
                          el.frameIdx === selectedFrame
                            ? { ...el, transform: { ...el.transform, [key]: val } }
                            : el
                        )
                      );
                    }}
                    className="w-16 p-1.5 rounded-lg text-xs font-semibold border"
                    style={{
                      backgroundColor: "var(--lightgray)",
                      color: "var(--black)",
                      borderColor: "var(--border)",
                    }}
                  />
                  <span className="text-[10px]" style={{ color: "var(--gray)" }}>
                    %
                  </span>
                </label>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Context Menu ─────────────────────────────────── */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 rounded-2xl shadow-2xl border py-2 w-48 overflow-hidden"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
              backgroundColor: "var(--white)",
              borderColor: "var(--border)",
            }}
          >
            <button
              onClick={deleteFramePhoto}
              className="w-full text-left px-4 py-2.5 text-sm font-semibold flex items-center gap-3 cursor-pointer transition-colors hover:opacity-80"
              style={{ color: "var(--red)" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
              >
                <FaTrash size={12} />
              </div>
              Delete Photo
            </button>
            <button
              onClick={replaceFramePhoto}
              className="w-full text-left px-4 py-2.5 text-sm font-semibold flex items-center gap-3 cursor-pointer transition-colors hover:opacity-80"
              style={{ color: "var(--black)" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
              >
                <FaRedo size={12} />
              </div>
              Replace Photo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Export Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {(exporting || exportBlob || exportError) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              backgroundColor: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(8px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center space-y-4"
              style={{ backgroundColor: "var(--white)" }}
            >
              {exportError ? (
                <>
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                    style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
                  >
                    <FaTimes size={24} />
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: "var(--black)" }}>
                    Export Failed
                  </h3>
                  <p className="text-sm" style={{ color: "var(--gray)" }}>
                    {exportError}
                  </p>
                  <button
                    onClick={closeModal}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer w-full"
                    style={{ backgroundColor: "var(--lightgray)", color: "var(--black)" }}
                  >
                    Close
                  </button>
                </>
              ) : exportBlob ? (
                <>
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                    style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
                  >
                    <FaCheck size={24} />
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: "var(--black)" }}>
                    Collage Ready!
                  </h3>
                  <p className="text-sm" style={{ color: "var(--gray)" }}>
                    Your collage has been exported successfully.
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={downloadBlob}
                      className="px-5 py-3 rounded-xl text-sm font-bold cursor-pointer shadow-lg flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: "var(--red)",
                        color: "var(--white)",
                        boxShadow: "0 4px 16px rgba(239, 68, 68, 0.3)",
                      }}
                    >
                      <FaDownload size={14} /> Download PNG
                    </button>
                    <button
                      onClick={closeModal}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                      style={{ backgroundColor: "var(--lightgray)", color: "var(--black)" }}
                    >
                      Close
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                    style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <FaImages size={24} />
                    </motion.div>
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: "var(--black)" }}>
                    Exporting Collage
                  </h3>
                  <div
                    className="w-full h-2.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: "var(--lightgray)" }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: "var(--red)" }}
                      animate={{ width: ["0%", "100%"] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <p className="text-xs" style={{ color: "var(--gray)" }}>
                    Generating high-quality PNG...
                  </p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}