// components/PhotoEditor.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUpload, FaMagic, FaSpinner, FaExchangeAlt, FaEraser, FaDownload } from 'react-icons/fa';

const MAX_CANVAS_WIDTH = 1920;
const MAX_CANVAS_HEIGHT = 1080;

export default function PhotoEditor() {
  const [image, setImage] = useState(null);
  const [filterValues, setFilterValues] = useState({
    brightness: 100, contrast: 100, saturation: 100, blur: 0,
  });
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Crop state
  const [cropMode, setCropMode] = useState(false);
  const [cropRect, setCropRect] = useState(null);
  const [appliedCrop, setAppliedCrop] = useState(null);
  const cropDragInfo = useRef(null);

  // Numeric inputs
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropW, setCropW] = useState(0);
  const [cropH, setCropH] = useState(0);

  // Drawing brush
  const [drawing, setDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#ff0000');
  const [brushSize, setBrushSize] = useState(4);

  // Background removal state
  const [removingBackground, setRemovingBackground] = useState(false);
  const [backgroundRemoved, setBackgroundRemoved] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);
  const [removalProgress, setRemovalProgress] = useState(0);
  const [bgRemovalLoaded, setBgRemovalLoaded] = useState(false);
  
  // Background color/transparency options
  const [bgColor, setBgColor] = useState('transparent');
  const [showBgOptions, setShowBgOptions] = useState(false);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const replaceInputRef = useRef(null);
  const ctxRef = useRef(null);
  const imageRef = useRef(null);
  const canvasScale = useRef(1);

  // ─── Load Background Removal library from CDN ────────────
  useEffect(() => {
    const scriptId = 'imgly-bg-removal';
    if (document.getElementById(scriptId)) {
      setBgRemovalLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/dist/bundle.iife.js';
    script.async = true;
    script.onload = () => setBgRemovalLoaded(true);
    script.onerror = () => console.warn('CDN library failed to load, using fallback');
    document.head.appendChild(script);
  }, []);

  // ─── Sync numeric inputs ─────────────────────────────────
  useEffect(() => {
    if (cropRect) {
      setCropX(cropRect.x);
      setCropY(cropRect.y);
      setCropW(cropRect.w);
      setCropH(cropRect.h);
    }
  }, [cropRect]);

  // ─── Load image ──────────────────────────────────────────
  const loadImage = (file) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      imageRef.current = img;
      setImage(img);
      setOriginalImage(img);
      const full = { x: 0, y: 0, w: img.width, h: img.height };
      setCropRect(full);
      setAppliedCrop(full);
      setCropMode(false);
      setHistory([]);
      setRedoStack([]);
      setBackgroundRemoved(false);
      setShowBgOptions(false);
    };
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    loadImage(file);
  };

  // ─── Replace Image ───────────────────────────────────────
  const handleReplaceImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    loadImage(file);
  };

  // ─── Improved Background Removal ─────────────────────────
  const handleRemoveBackground = async () => {
    const img = imageRef.current;
    if (!img || removingBackground) return;

    if (!originalImage && !backgroundRemoved) {
      setOriginalImage(img);
    }

    setRemovingBackground(true);
    setRemovalProgress(0);

    try {
      // Try CDN library first
      if (bgRemovalLoaded && window.removeBackground) {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        if (!blob) throw new Error('Failed to create image blob');

        const resultBlob = await window.removeBackground(blob, {
          progress: (key, current, total) => {
            setRemovalProgress(Math.round((current / total) * 100));
          },
          model: 'medium',
          output: { format: 'image/png' },
        });

        const url = URL.createObjectURL(resultBlob);
        const newImg = new Image();
        newImg.src = url;
        newImg.onload = () => {
          imageRef.current = newImg;
          setImage(newImg);
          const full = { x: 0, y: 0, w: newImg.width, h: newImg.height };
          setCropRect(full);
          setAppliedCrop(full);
          setBackgroundRemoved(true);
          setRemovingBackground(false);
          setRemovalProgress(100);
          setShowBgOptions(true);
          saveHistory();
        };
        newImg.onerror = () => {
          setRemovingBackground(false);
          // Try fallback
          advancedCanvasRemoval(img);
        };
      } else {
        // Use advanced canvas-based removal
        advancedCanvasRemoval(img);
      }
    } catch (error) {
      console.error('Background removal failed:', error);
      advancedCanvasRemoval(img);
    }
  };

  // ─── Advanced Canvas Background Removal ──────────────────
  const advancedCanvasRemoval = (img) => {
    setRemovingBackground(true);
    setRemovalProgress(10);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(img, 0, 0);

    setRemovalProgress(30);

    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;

    // Sample multiple points along edges for better background detection
    const edgeSamples = [];
    const step = 20;
    // Top edge
    for (let x = 0; x < tempCanvas.width; x += step) {
      edgeSamples.push({ x, y: 0 });
      edgeSamples.push({ x, y: 1 });
    }
    // Bottom edge
    for (let x = 0; x < tempCanvas.width; x += step) {
      edgeSamples.push({ x, y: tempCanvas.height - 1 });
      edgeSamples.push({ x, y: tempCanvas.height - 2 });
    }
    // Left edge
    for (let y = 0; y < tempCanvas.height; y += step) {
      edgeSamples.push({ x: 0, y });
      edgeSamples.push({ x: 1, y });
    }
    // Right edge
    for (let y = 0; y < tempCanvas.height; y += step) {
      edgeSamples.push({ x: tempCanvas.width - 1, y });
      edgeSamples.push({ x: tempCanvas.width - 2, y });
    }

    // Calculate average background color from edge samples
    let totalR = 0, totalG = 0, totalB = 0;
    edgeSamples.forEach(({ x, y }) => {
      const idx = (y * tempCanvas.width + x) * 4;
      totalR += data[idx];
      totalG += data[idx + 1];
      totalB += data[idx + 2];
    });
    const count = edgeSamples.length;
    const avgR = Math.round(totalR / count);
    const avgG = Math.round(totalG / count);
    const avgB = Math.round(totalB / count);

    setRemovalProgress(50);

    // Calculate variance for adaptive tolerance
    let variance = 0;
    edgeSamples.forEach(({ x, y }) => {
      const idx = (y * tempCanvas.width + x) * 4;
      variance += Math.pow(data[idx] - avgR, 2);
      variance += Math.pow(data[idx + 1] - avgG, 2);
      variance += Math.pow(data[idx + 2] - avgB, 2);
    });
    variance = Math.sqrt(variance / (count * 3));

    // Adaptive tolerance based on variance
    const baseTolerance = 50;
    const adaptiveTolerance = Math.max(30, Math.min(120, baseTolerance + variance * 0.5));

    setRemovalProgress(70);

    // Process pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const colorDistance = Math.sqrt(
        Math.pow(r - avgR, 2) +
        Math.pow(g - avgG, 2) +
        Math.pow(b - avgB, 2)
      );

      // Edge-aware alpha: pixels closer to edges get more transparency
      const x = (i / 4) % tempCanvas.width;
      const y = Math.floor((i / 4) / tempCanvas.width);
      const distToEdge = Math.min(x, y, tempCanvas.width - x, tempCanvas.height - y);
      const edgeFactor = Math.min(1, distToEdge / 50);

      const adjustedTolerance = adaptiveTolerance * (0.5 + edgeFactor * 0.5);

      if (colorDistance < adjustedTolerance) {
        // Smooth alpha transition
        const alpha = Math.max(0, Math.min(255, Math.round((1 - colorDistance / adjustedTolerance) * 255)));
        data[i + 3] = alpha > 200 ? 0 : alpha;
      }
    }

    setRemovalProgress(85);

    tempCtx.putImageData(imageData, 0, 0);

    tempCanvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const newImg = new Image();
        newImg.src = url;
        newImg.onload = () => {
          imageRef.current = newImg;
          setImage(newImg);
          const full = { x: 0, y: 0, w: newImg.width, h: newImg.height };
          setCropRect(full);
          setAppliedCrop(full);
          setBackgroundRemoved(true);
          setRemovingBackground(false);
          setRemovalProgress(100);
          setShowBgOptions(true);
          saveHistory();
        };
      } else {
        setRemovingBackground(false);
      }
    }, 'image/png');
  };

  // ─── Restore original ────────────────────────────────────
  const handleRestoreOriginal = () => {
    if (originalImage) {
      imageRef.current = originalImage;
      setImage(originalImage);
      const full = { x: 0, y: 0, w: originalImage.width, h: originalImage.height };
      setCropRect(full);
      setAppliedCrop(full);
      setBackgroundRemoved(false);
      setShowBgOptions(false);
      saveHistory();
    }
  };

  // ─── Draw image ──────────────────────────────────────────
  const drawImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;

    const img = imageRef.current;
    if (!img) return;

    const iw = img.width;
    const ih = img.height;
    let drawWidth, drawHeight, scale;

    if (cropMode) {
      scale = Math.min(MAX_CANVAS_WIDTH / iw, MAX_CANVAS_HEIGHT / ih, 1);
      drawWidth = Math.round(iw * scale);
      drawHeight = Math.round(ih * scale);
      canvasScale.current = scale;
    } else {
      const crop = appliedCrop || { x: 0, y: 0, w: iw, h: ih };
      scale = 1;
      drawWidth = crop.w;
      drawHeight = crop.h;
      canvasScale.current = 1;
    }

    canvas.width = drawWidth;
    canvas.height = drawHeight;

    // Background
    if (backgroundRemoved) {
      if (bgColor === 'transparent') {
        // Checkerboard for transparency
        const patternSize = 12;
        for (let y = 0; y < canvas.height; y += patternSize) {
          for (let x = 0; x < canvas.width; x += patternSize) {
            const isEven = (Math.floor(x / patternSize) + Math.floor(y / patternSize)) % 2 === 0;
            ctx.fillStyle = isEven ? '#e8e8e8' : '#ffffff';
            ctx.fillRect(x, y, patternSize, patternSize);
          }
        }
      } else {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    ctx.filter = `brightness(${filterValues.brightness}%) contrast(${filterValues.contrast}%) saturate(${filterValues.saturation}%) blur(${filterValues.blur}px)`;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw background after clearRect
    if (backgroundRemoved) {
      if (bgColor === 'transparent') {
        const patternSize = 12;
        for (let y = 0; y < canvas.height; y += patternSize) {
          for (let x = 0; x < canvas.width; x += patternSize) {
            const isEven = (Math.floor(x / patternSize) + Math.floor(y / patternSize)) % 2 === 0;
            ctx.fillStyle = isEven ? '#e8e8e8' : '#ffffff';
            ctx.fillRect(x, y, patternSize, patternSize);
          }
        }
      } else {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    if (cropMode) {
      ctx.drawImage(img, 0, 0, drawWidth, drawHeight);
    } else {
      const crop = appliedCrop || { x: 0, y: 0, w: iw, h: ih };
      ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, drawWidth, drawHeight);
    }
    ctx.filter = 'none';

    // Crop overlay
    if (cropMode && cropRect) {
      const s = canvasScale.current;
      const cr = {
        x: cropRect.x * s, y: cropRect.y * s,
        w: cropRect.w * s, h: cropRect.h * s,
      };
      const rect = canvas.getBoundingClientRect();
      const scaleX = rect.width ? canvas.width / rect.width : 1;
      const scaleY = rect.height ? canvas.height / rect.height : 1;
      const avgDisplayScale = (scaleX + scaleY) / 2;
      const handleSize = Math.max(10 * avgDisplayScale, 4);
      canvas._cropScale = { handleCanvasSize: handleSize, hitCanvasRadius: handleSize * 1.2, imageToCanvasScale: s };
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3 * avgDisplayScale;
      ctx.strokeRect(cr.x, cr.y, cr.w, cr.h);
      const corners = [[cr.x, cr.y], [cr.x + cr.w, cr.y], [cr.x, cr.y + cr.h], [cr.x + cr.w, cr.y + cr.h]];
      ctx.fillStyle = '#ff0';
      corners.forEach(([cx, cy]) => { ctx.fillRect(cx - handleSize/2, cy - handleSize/2, handleSize, handleSize); });
    }
  }, [filterValues, cropMode, cropRect, appliedCrop, backgroundRemoved, bgColor]);

  useEffect(() => { drawImage(); }, [drawImage]);

  // ─── History ─────────────────────────────────────────────
  const saveHistory = () => {
    if (!canvasRef.current) return;
    setHistory((prev) => [...prev, canvasRef.current.toDataURL()]);
    setRedoStack([]);
  };

  const undo = () => {
    if (history.length === 0) return;
    const prevState = history[history.length - 1];
    setRedoStack((r) => [canvasRef.current.toDataURL(), ...r]);
    setHistory((h) => h.slice(0, -1));
    const img = new Image();
    img.src = prevState;
    img.onload = () => { imageRef.current = img; setImage(img); };
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[0];
    setHistory((h) => [...h, canvasRef.current.toDataURL()]);
    setRedoStack((r) => r.slice(1));
    const img = new Image();
    img.src = nextState;
    img.onload = () => { imageRef.current = img; setImage(img); };
  };

  // ─── Mouse helpers ──────────────────────────────────────
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const toImageCoords = (cx, cy) => {
    const s = canvasScale.current || 1;
    return { x: cx / s, y: cy / s };
  };

  const handleMouseDown = (e) => {
    const { x: mx, y: my } = getCanvasCoords(e);
    if (cropMode && cropRect) {
      const { x: ix, y: iy } = toImageCoords(mx, my);
      const hitCanvasRadius = canvasRef.current._cropScale?.hitCanvasRadius || 20;
      const s = canvasScale.current || 1;
      const hitImageRadius = hitCanvasRadius / s;
      const handles = [
        { x: cropRect.x, y: cropRect.y }, { x: cropRect.x + cropRect.w, y: cropRect.y },
        { x: cropRect.x, y: cropRect.y + cropRect.h }, { x: cropRect.x + cropRect.w, y: cropRect.y + cropRect.h },
      ];
      let handle = null;
      for (const h of handles) {
        if (Math.abs(ix - h.x) < hitImageRadius && Math.abs(iy - h.y) < hitImageRadius) { handle = h; break; }
      }
      if (handle) { cropDragInfo.current = { type: 'handle', handle, startX: ix, startY: iy, origRect: { ...cropRect } }; return; }
      if (ix >= cropRect.x && ix <= cropRect.x + cropRect.w && iy >= cropRect.y && iy <= cropRect.y + cropRect.h) {
        cropDragInfo.current = { type: 'move', startX: ix, startY: iy, origX: cropRect.x, origY: cropRect.y }; return;
      }
      return;
    }
    if (!cropMode && ctxRef.current) {
      setDrawing(true);
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(mx, my);
      ctxRef.current.strokeStyle = brushColor;
      ctxRef.current.lineWidth = brushSize;
    }
  };

  const handleMouseMove = (e) => {
    const { x: mx, y: my } = getCanvasCoords(e);
    if (cropMode && cropDragInfo.current) {
      const { x: ix, y: iy } = toImageCoords(mx, my);
      const info = cropDragInfo.current;
      const orig = info.origRect;
      let newRect = { ...cropRect };
      if (info.type === 'move') {
        const dx = ix - info.startX, dy = iy - info.startY;
        const iw = imageRef.current.width, ih = imageRef.current.height;
        newRect.x = Math.max(0, Math.min(info.origX + dx, iw - newRect.w));
        newRect.y = Math.max(0, Math.min(info.origY + dy, ih - newRect.h));
      } else if (info.type === 'handle') {
        const dx = ix - info.startX, dy = iy - info.startY, handle = info.handle;
        if (handle.x === orig.x) { newRect.x = Math.min(orig.x + orig.w - 10, orig.x + dx); newRect.w = orig.w - (newRect.x - orig.x); }
        else { newRect.w = Math.max(10, orig.w + dx); }
        if (handle.y === orig.y) { newRect.y = Math.min(orig.y + orig.h - 10, orig.y + dy); newRect.h = orig.h - (newRect.y - orig.y); }
        else { newRect.h = Math.max(10, orig.h + dy); }
        const iw = imageRef.current.width, ih = imageRef.current.height;
        newRect.x = Math.max(0, newRect.x); newRect.y = Math.max(0, newRect.y);
        if (newRect.x + newRect.w > iw) newRect.w = iw - newRect.x;
        if (newRect.y + newRect.h > ih) newRect.h = ih - newRect.y;
      }
      setCropRect(newRect);
      return;
    }
    if (drawing && ctxRef.current) { ctxRef.current.lineTo(mx, my); ctxRef.current.stroke(); }
  };

  const handleMouseUp = () => {
    if (cropDragInfo.current) { cropDragInfo.current = null; return; }
    if (drawing) { ctxRef.current?.closePath(); setDrawing(false); saveHistory(); }
  };

  const updateCropFromInputs = () => {
    const img = imageRef.current; if (!img) return;
    const iw = img.width, ih = img.height;
    setCropRect({
      x: Math.max(0, Math.min(cropX, iw - 1)),
      y: Math.max(0, Math.min(cropY, ih - 1)),
      w: Math.max(10, Math.min(cropW, iw - Math.max(0, Math.min(cropX, iw - 1)))),
      h: Math.max(10, Math.min(cropH, ih - Math.max(0, Math.min(cropY, ih - 1)))),
    });
  };

  const applyPreset = (ratioW, ratioH) => {
    const img = imageRef.current; if (!img) return;
    const iw = img.width, ih = img.height;
    let newW, newH;
    if (iw / ih > ratioW / ratioH) { newH = ih; newW = Math.round(ih * (ratioW / ratioH)); }
    else { newW = iw; newH = Math.round(iw / (ratioW / ratioH)); }
    setCropRect({ x: Math.round((iw - newW) / 2), y: Math.round((ih - newH) / 2), w: newW, h: newH });
  };

  const enterCropMode = () => { const img = imageRef.current; if (!img) return; saveHistory(); setCropRect(appliedCrop || { x: 0, y: 0, w: img.width, h: img.height }); setCropMode(true); };
  const applyCrop = () => { saveHistory(); setAppliedCrop(cropRect); setCropMode(false); };
  const cancelCrop = () => { setCropRect(appliedCrop); setCropMode(false); };
  const resetCrop = () => { const img = imageRef.current; if (!img) return; const full = { x: 0, y: 0, w: img.width, h: img.height }; setCropRect(full); setAppliedCrop(full); setCropMode(false); drawImage(); };
  const download = () => { const canvas = canvasRef.current; if (!canvas) return; const link = document.createElement('a'); link.download = 'edited_image.png'; link.href = canvas.toDataURL(); link.click(); };

    return (
  <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: "var(--white)", color: "var(--black)" }}>
    {/* ─── Header ──────────────────────────────────────── */}
    <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
      {/* Hidden file inputs – always present so labels can reference them */}
      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        ref={fileInputRef}
        id="photo-upload"
        className="hidden"
      />
      <input
        type="file"
        accept="image/*"
        onChange={handleReplaceImage}
        ref={replaceInputRef}
        id="photo-replace"
        className="hidden"
      />

      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
        >
          <FaUpload size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--black)" }}>Photo Editor</h2>
          <p className="text-xs" style={{ color: "var(--gray)" }}>Edit, enhance, and remove backgrounds</p>
        </div>
      </div>

      {image && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Replace button now uses the always-present input */}
          <motion.label
            htmlFor="photo-replace"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5"
            style={{ backgroundColor: "var(--blue)", color: "var(--white)" }}
          >
            <FaExchangeAlt size={12} /> Replace
          </motion.label>

          {/* Undo, Redo, Remove BG, Crop, etc. remain unchanged */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={undo}
            className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5"
            style={{ backgroundColor: "var(--lightgray)", color: "var(--black)" }}
          >
            ↩ Undo
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={redo}
            className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5"
            style={{ backgroundColor: "var(--lightgray)", color: "var(--black)" }}
          >
            ↪ Redo
          </motion.button>

          <div className="w-px h-6" style={{ backgroundColor: "var(--border)" }} />

          {!backgroundRemoved ? (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleRemoveBackground}
              disabled={removingBackground}
              className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 disabled:opacity-60 shadow-lg"
              style={{
                backgroundColor: "var(--red)",
                color: "var(--white)",
                boxShadow: "0 4px 16px rgba(239, 68, 68, 0.3)",
              }}
            >
              {removingBackground ? (
                <>
                  <FaSpinner className="animate-spin" size={12} /> Removing
                </>
              ) : (
                <>
                  <FaEraser size={12} /> Remove BG
                </>
              )}
            </motion.button>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleRestoreOriginal}
                className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                style={{ backgroundColor: "var(--orange)", color: "var(--white)" }}
              >
                Restore
              </motion.button>
              <div className="flex items-center gap-1">
                {['transparent', '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setBgColor(color)}
                    className="w-6 h-6 rounded-full border-2 cursor-pointer transition-all"
                    style={{
                      backgroundColor: color === 'transparent' ? 'transparent' : color,
                      borderColor: bgColor === color ? 'var(--red)' : 'var(--border)',
                      backgroundImage:
                        color === 'transparent'
                          ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)'
                          : 'none',
                      backgroundSize: color === 'transparent' ? '8px 8px' : 'auto',
                      backgroundPosition: color === 'transparent' ? '0 0, 4px 4px' : '0 0',
                    }}
                  />
                ))}
              </div>
            </>
          )}

          <div className="w-px h-6" style={{ backgroundColor: "var(--border)" }} />

          {!cropMode ? (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={enterCropMode}
              className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              style={{ backgroundColor: "var(--lightgray)", color: "var(--black)" }}
            >
              ✂ Crop
            </motion.button>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={applyCrop}
                className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                style={{ backgroundColor: "var(--green)", color: "var(--white)" }}
              >
                ✅ Apply
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={cancelCrop}
                className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
              >
                ❌ Cancel
              </motion.button>
            </>
          )}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={resetCrop}
            className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            style={{ backgroundColor: "var(--lightgray)", color: "var(--black)" }}
          >
            ↺ Reset
          </motion.button>

          <div className="w-px h-6" style={{ backgroundColor: "var(--border)" }} />

          <label className="flex items-center gap-1.5">
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="w-7 h-7 p-0 border-0 rounded-lg cursor-pointer"
            />
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(+e.target.value)}
              className="w-16"
            />
          </label>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={download}
            className="px-4 py-2 rounded-xl text-sm font-bold cursor-pointer flex items-center gap-2 shadow-lg ml-auto"
            style={{
              backgroundColor: "var(--red)",
              color: "var(--white)",
              boxShadow: "0 4px 16px rgba(239, 68, 68, 0.3)",
            }}
          >
            <FaDownload size={14} /> Export
          </motion.button>
        </div>
      )}
    </div>

    {/* ─── Content Area ──────────────────────────────────── */}
    <div className="flex-1 overflow-auto">
      {!image ? (
        <div className="flex items-center justify-center h-full p-4">
          <motion.label
            htmlFor="photo-upload"
            className="flex flex-col items-center gap-4 p-12 rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-300 w-full max-w-lg"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--lightgray)" }}
            whileHover={{ scale: 1.02, borderColor: "var(--red)" }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
            >
              <FaUpload size={32} />
            </motion.div>
            <div className="text-center">
              <h3 className="text-lg font-bold mb-1" style={{ color: "var(--black)" }}>Upload Image</h3>
              <p className="text-sm" style={{ color: "var(--gray)" }}>Click or drag & drop to get started</p>
            </div>
          </motion.label>
        </div>
      ) : (
        <div className="p-4 space-y-3">
            {/* Filter Sliders */}
            <div className="flex flex-wrap gap-3 justify-center p-3 rounded-2xl" style={{ backgroundColor: "var(--lightgray)" }}>
              {[
                { name: 'Brightness', key: 'brightness', max: 200, icon: '☀️' },
                { name: 'Contrast', key: 'contrast', max: 200, icon: '🌓' },
                { name: 'Saturation', key: 'saturation', max: 200, icon: '🎨' },
                { name: 'Blur', key: 'blur', max: 10, step: 0.1, icon: '💧' },
              ].map(({ name, key, max, step = 1, icon }) => (
                <label key={key} className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl" style={{ backgroundColor: "var(--white)", color: "var(--black)" }}>
                  <span>{icon}</span>
                  <span>{name}</span>
                  <input type="range" min="0" max={max} step={step} value={filterValues[key]}
                    onChange={(e) => { setFilterValues(f => ({ ...f, [key]: +e.target.value })); saveHistory(); }} className="w-20" />
                </label>
              ))}
            </div>

            {/* Progress Bar */}
            <AnimatePresence>
              {removingBackground && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--lightgray)" }}>
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: "var(--red)" }}
                      initial={{ width: 0 }} animate={{ width: `${removalProgress}%` }} transition={{ duration: 0.3 }} />
                  </div>
                  <p className="text-xs text-center mt-1" style={{ color: "var(--gray)" }}>Removing background... {removalProgress}%</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Crop Panel */}
            <AnimatePresence>
              {cropMode && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-2xl space-y-3" style={{ backgroundColor: "var(--lightgray)" }}>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm" style={{ color: "var(--black)" }}>Crop Area (pixels)</p>
                    <div className="flex gap-2">
                      {[[16,9],[4,3],[1,1],[9,16],[21,9]].map(([w,h]) => (
                        <motion.button key={`${w}-${h}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => applyPreset(w,h)}
                          className="px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer"
                          style={{ backgroundColor: "var(--white)", color: "var(--black)" }}>{w}:{h}</motion.button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[{ label: 'X', value: cropX, setter: setCropX, color: 'var(--red)' }, { label: 'Y', value: cropY, setter: setCropY, color: 'var(--orange)' }, { label: 'W', value: cropW, setter: setCropW, color: 'var(--yellow)' }, { label: 'H', value: cropH, setter: setCropH, color: 'var(--pink)' }].map(f => (
                      <label key={f.label} className="flex flex-col text-xs font-medium" style={{ color: "var(--gray)" }}>
                        <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold mb-1" style={{ backgroundColor: f.color, color: "var(--white)" }}>{f.label}</span>
                        <input type="number" value={f.value} onChange={(e) => f.setter(+e.target.value)} onBlur={updateCropFromInputs}
                          className="p-1.5 rounded-lg text-xs font-semibold border" style={{ backgroundColor: "var(--white)", color: "var(--black)", borderColor: "var(--border)" }} />
                      </label>
                    ))}
                  </div>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={updateCropFromInputs}
                    className="px-4 py-2 rounded-lg text-xs font-bold cursor-pointer w-full"
                    style={{ backgroundColor: "var(--red)", color: "var(--white)" }}>Apply Numbers</motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Canvas */}
            <div className="flex items-center justify-center">
              <canvas ref={canvasRef}
                onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
                className="rounded-2xl shadow-2xl"
                style={{
                  border: "4px solid var(--white)",
                  maxWidth: '100%',
                  maxHeight: '55vh',
                  objectFit: 'contain',
                  cursor: cropMode ? 'default' : drawing ? 'crosshair' : 'default',
                }} />
            </div>
          </div>
      )}
    </div>
  </div>
);
}