// components/PhotoEditor.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUpload,
  FaSpinner,
  FaExchangeAlt,
  FaEraser,
  FaDownload,
  FaEyeDropper,
} from 'react-icons/fa';

const MAX_CANVAS_WIDTH = 1920;
const MAX_CANVAS_HEIGHT = 1080;

export default function PhotoEditor() {
  const [image, setImage] = useState(null);
  const [filterValues, setFilterValues] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
  });
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Crop state
  const [cropMode, setCropMode] = useState(false);
  const [cropRect, setCropRect] = useState(null);
  const [appliedCrop, setAppliedCrop] = useState(null);
  const cropDragInfo = useRef(null);

  // Numeric inputs (X, Y, W, H)
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

  // Color replacer state
  const [replaceMode, setReplaceMode] = useState(false);
  const [pickingTarget, setPickingTarget] = useState(true);
  const [targetColor, setTargetColor] = useState(null);
  const [replacementColor, setReplacementColor] = useState('#ff0000');
  const [tolerance, setTolerance] = useState(30);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const replaceInputRef = useRef(null);
  const ctxRef = useRef(null);
  const imageRef = useRef(null);
  const canvasScale = useRef(1);

  // Drag‑to‑adjust input state (for X/Y/W/H)
  const [editingInputKey, setEditingInputKey] = useState(null);
  const [isDraggingInput, setIsDraggingInput] = useState(false);
  const [dragInputKey, setDragInputKey] = useState(null);
  const [dragStartValue, setDragStartValue] = useState(0);
  const [dragStartPointerX, setDragStartPointerX] = useState(0);
  const lastTapForInputRef = useRef({ time: 0, key: null });

  // ─── Load Background Removal library from CDN ────────────
  useEffect(() => {
    const scriptId = 'imgly-bg-removal';
    if (document.getElementById(scriptId)) {
      setBgRemovalLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.id = scriptId;
    script.src =
      'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/dist/bundle.iife.js';
    script.async = true;
    script.onload = () => setBgRemovalLoaded(true);
    script.onerror = () =>
      console.warn('CDN library failed to load, using fallback');
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

  // ─── Drag‑to‑adjust useEffect (for X/Y/W/H) ──────────────
  useEffect(() => {
    if (!isDraggingInput) return;
    const onPointerMove = (e) => {
      const deltaX = e.clientX - dragStartPointerX;
      const sensitivity = 2;
      let newValue = Math.round(dragStartValue + deltaX * sensitivity);
      if (dragInputKey === 'cropX') setCropX(Math.max(0, newValue));
      else if (dragInputKey === 'cropY') setCropY(Math.max(0, newValue));
      else if (dragInputKey === 'cropW') setCropW(Math.max(1, newValue));
      else if (dragInputKey === 'cropH') setCropH(Math.max(1, newValue));

      if (cropRect && imageRef.current) {
        const imgW = imageRef.current.width;
        const imgH = imageRef.current.height;
        let x = dragInputKey === 'cropX' ? Math.max(0, newValue) : cropRect.x;
        let y = dragInputKey === 'cropY' ? Math.max(0, newValue) : cropRect.y;
        let w = dragInputKey === 'cropW' ? Math.max(1, newValue) : cropRect.w;
        let h = dragInputKey === 'cropH' ? Math.max(1, newValue) : cropRect.h;

        x = Math.min(x, imgW - w);
        y = Math.min(y, imgH - h);
        x = Math.max(0, x);
        y = Math.max(0, y);
        w = Math.min(w, imgW - x);
        h = Math.min(h, imgH - y);
        setCropRect({ x, y, w, h });
      }
    };
    const onPointerUp = () => {
      setIsDraggingInput(false);
      setDragInputKey(null);
      if (cropRect && imageRef.current) {
        const imgW = imageRef.current.width;
        const imgH = imageRef.current.height;
        let x = Math.max(0, Math.min(cropRect.x, imgW - cropRect.w));
        let y = Math.max(0, Math.min(cropRect.y, imgH - cropRect.h));
        let w = Math.min(cropRect.w, imgW - x);
        let h = Math.min(cropRect.h, imgH - y);
        setCropRect({ x, y, w, h });
      }
    };
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    return () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };
  }, [
    isDraggingInput,
    dragStartPointerX,
    dragStartValue,
    dragInputKey,
    cropRect,
  ]);

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
      setReplaceMode(false);
      setTargetColor(null);
      setPickingTarget(true);
    };
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    loadImage(file);
  };

  const handleReplaceImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    loadImage(file);
  };

  // ─── Background Removal ──────────────────────────────────
  const handleRemoveBackground = async () => {
    const img = imageRef.current;
    if (!img || removingBackground) return;

    if (!originalImage && !backgroundRemoved) {
      setOriginalImage(img);
    }

    setRemovingBackground(true);
    setRemovalProgress(0);

    try {
      if (bgRemovalLoaded && window.removeBackground) {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, 'image/png')
        );
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
          saveHistory();
        };
        newImg.onerror = () => {
          setRemovingBackground(false);
          advancedCanvasRemoval(img);
        };
      } else {
        advancedCanvasRemoval(img);
      }
    } catch (error) {
      console.error('Background removal failed:', error);
      advancedCanvasRemoval(img);
    }
  };

  const advancedCanvasRemoval = (img) => {
    setRemovingBackground(true);
    setRemovalProgress(10);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(img, 0, 0);

    setRemovalProgress(30);

    const imageData = tempCtx.getImageData(
      0,
      0,
      tempCanvas.width,
      tempCanvas.height
    );
    const data = imageData.data;

    const edgeSamples = [];
    const step = 20;
    for (let x = 0; x < tempCanvas.width; x += step) {
      edgeSamples.push({ x, y: 0 });
      edgeSamples.push({ x, y: 1 });
    }
    for (let x = 0; x < tempCanvas.width; x += step) {
      edgeSamples.push({ x, y: tempCanvas.height - 1 });
      edgeSamples.push({ x, y: tempCanvas.height - 2 });
    }
    for (let y = 0; y < tempCanvas.height; y += step) {
      edgeSamples.push({ x: 0, y });
      edgeSamples.push({ x: 1, y });
    }
    for (let y = 0; y < tempCanvas.height; y += step) {
      edgeSamples.push({ x: tempCanvas.width - 1, y });
      edgeSamples.push({ x: tempCanvas.width - 2, y });
    }

    let totalR = 0,
      totalG = 0,
      totalB = 0;
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

    let variance = 0;
    edgeSamples.forEach(({ x, y }) => {
      const idx = (y * tempCanvas.width + x) * 4;
      variance += Math.pow(data[idx] - avgR, 2);
      variance += Math.pow(data[idx + 1] - avgG, 2);
      variance += Math.pow(data[idx + 2] - avgB, 2);
    });
    variance = Math.sqrt(variance / (count * 3));

    const baseTolerance = 50;
    const adaptiveTolerance = Math.max(
      30,
      Math.min(120, baseTolerance + variance * 5)
    );

    setRemovalProgress(70);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const colorDistance = Math.sqrt(
        Math.pow(r - avgR, 2) +
          Math.pow(g - avgG, 2) +
          Math.pow(b - avgB, 2)
      );

      const x = (i / 4) % tempCanvas.width;
      const y = Math.floor(i / 4 / tempCanvas.width);
      const distToEdge = Math.min(
        x,
        y,
        tempCanvas.width - x,
        tempCanvas.height - y
      );
      const edgeFactor = Math.min(1, distToEdge / 50);

      const adjustedTolerance =
        adaptiveTolerance * (0.5 + edgeFactor * 0.5);

      if (colorDistance < adjustedTolerance) {
        const alpha = Math.max(
          0,
          Math.min(
            255,
            Math.round(
              (1 - colorDistance / adjustedTolerance) * 255
            )
          )
        );
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
          const full = {
            x: 0,
            y: 0,
            w: newImg.width,
            h: newImg.height,
          };
          setCropRect(full);
          setAppliedCrop(full);
          setBackgroundRemoved(true);
          setRemovingBackground(false);
          setRemovalProgress(100);
          saveHistory();
        };
      } else {
        setRemovingBackground(false);
      }
    }, 'image/png');
  };

  const handleRestoreOriginal = () => {
    if (originalImage) {
      imageRef.current = originalImage;
      setImage(originalImage);
      const full = {
        x: 0,
        y: 0,
        w: originalImage.width,
        h: originalImage.height,
      };
      setCropRect(full);
      setAppliedCrop(full);
      setBackgroundRemoved(false);
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
        const patternSize = 12;
        for (let y = 0; y < canvas.height; y += patternSize) {
          for (let x = 0; x < canvas.width; x += patternSize) {
            const isEven =
              (Math.floor(x / patternSize) +
                Math.floor(y / patternSize)) %
                2 ===
              0;
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
            const isEven =
              (Math.floor(x / patternSize) +
                Math.floor(y / patternSize)) %
                2 ===
              0;
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
      ctx.drawImage(
        img,
        crop.x,
        crop.y,
        crop.w,
        crop.h,
        0,
        0,
        drawWidth,
        drawHeight
      );
    }
    ctx.filter = 'none';

    // Crop overlay
    if (cropMode && cropRect) {
      const s = canvasScale.current;
      const cr = {
        x: cropRect.x * s,
        y: cropRect.y * s,
        w: cropRect.w * s,
        h: cropRect.h * s,
      };
      const rect = canvas.getBoundingClientRect();
      const scaleX = rect.width ? canvas.width / rect.width : 1;
      const scaleY = rect.height ? canvas.height / rect.height : 1;
      const avgDisplayScale = (scaleX + scaleY) / 2;
      const handleSize = Math.max(10 * avgDisplayScale, 4);
      canvas._cropScale = {
        handleCanvasSize: handleSize,
        hitCanvasRadius: handleSize * 1.2,
        imageToCanvasScale: s,
      };
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3 * avgDisplayScale;
      ctx.strokeRect(cr.x, cr.y, cr.w, cr.h);
      const corners = [
        [cr.x, cr.y],
        [cr.x + cr.w, cr.y],
        [cr.x, cr.y + cr.h],
        [cr.x + cr.w, cr.y + cr.h],
      ];
      ctx.fillStyle = '#ff0';
      corners.forEach(([cx, cy]) => {
        ctx.fillRect(
          cx - handleSize / 2,
          cy - handleSize / 2,
          handleSize,
          handleSize
        );
      });
    }
  }, [
    filterValues,
    cropMode,
    cropRect,
    appliedCrop,
    backgroundRemoved,
    bgColor,
  ]);

  useEffect(() => {
    drawImage();
  }, [drawImage]);

  // ─── History ─────────────────────────────────────────────
  const saveHistory = () => {
    if (!canvasRef.current) return;
    setHistory((prev) => [...prev, canvasRef.current.toDataURL()]);
    setRedoStack([]);
  };


  // ─── Color helpers ─────────────────────────────────────
  const colorDistance = (c1, c2) => {
    return Math.sqrt(
      Math.pow(c1[0] - c2[0], 2) +
        Math.pow(c1[1] - c2[1], 2) +
        Math.pow(c1[2] - c2[2], 2)
    );
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : [0, 0, 0];
  };

  const pickColor = (cx, cy) => {
    const canvas = canvasRef.current;
    if (!canvas) return '#000000';
    const ctx = canvas.getContext('2d');
    const pixel = ctx.getImageData(cx, cy, 1, 1).data;
    return (
      '#' +
      ((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2])
        .toString(16)
        .slice(1)
    );
  };

  const applyColorReplace = () => {
    if (!targetColor || !replacementColor) return;
    saveHistory();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const targetRGB = hexToRgb(targetColor);
    const replacementRGB = hexToRgb(replacementColor);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (colorDistance([r, g, b], targetRGB) <= tolerance) {
        data[i] = replacementRGB[0];
        data[i + 1] = replacementRGB[1];
        data[i + 2] = replacementRGB[2];
      }
    }
    ctx.putImageData(imageData, 0, 0);
    const newImg = new Image();
    newImg.src = canvas.toDataURL();
    newImg.onload = () => {
      imageRef.current = newImg;
      setImage(newImg);
    };
  };

  // ─── Mouse helpers ──────────────────────────────────────
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const toImageCoords = (cx, cy) => {
    const s = canvasScale.current || 1;
    return { x: cx / s, y: cy / s };
  };

  const handleCanvasClickForReplace = (e) => {
    if (!replaceMode) return;
    const { x: mx, y: my } = getCanvasCoords(e);
    const color = pickColor(mx, my);
    if (pickingTarget) {
      setTargetColor(color);
      setPickingTarget(false);
    } else {
      setReplacementColor(color);
    }
  };

  const toggleReplaceMode = () => {
    if (replaceMode) {
      setReplaceMode(false);
      setTargetColor(null);
      setPickingTarget(true);
    } else {
      if (cropMode) return;
      setReplaceMode(true);
      setTargetColor(null);
      setPickingTarget(true);
    }
  };

  const handleMouseDown = (e) => {
    if (replaceMode) {
      handleCanvasClickForReplace(e);
      return;
    }
    const { x: mx, y: my } = getCanvasCoords(e);
    if (cropMode && cropRect) {
      const { x: ix, y: iy } = toImageCoords(mx, my);
      const hitCanvasRadius =
        canvasRef.current._cropScale?.hitCanvasRadius || 20;
      const s = canvasScale.current || 1;
      const hitImageRadius = hitCanvasRadius / s;
      const handles = [
        { x: cropRect.x, y: cropRect.y },
        { x: cropRect.x + cropRect.w, y: cropRect.y },
        { x: cropRect.x, y: cropRect.y + cropRect.h },
        {
          x: cropRect.x + cropRect.w,
          y: cropRect.y + cropRect.h,
        },
      ];
      let handle = null;
      for (const h of handles) {
        if (
          Math.abs(ix - h.x) < hitImageRadius &&
          Math.abs(iy - h.y) < hitImageRadius
        ) {
          handle = h;
          break;
        }
      }
      if (handle) {
        cropDragInfo.current = {
          type: 'handle',
          handle,
          startX: ix,
          startY: iy,
          origRect: { ...cropRect },
        };
        return;
      }
      if (
        ix >= cropRect.x &&
        ix <= cropRect.x + cropRect.w &&
        iy >= cropRect.y &&
        iy <= cropRect.y + cropRect.h
      ) {
        cropDragInfo.current = {
          type: 'move',
          startX: ix,
          startY: iy,
          origX: cropRect.x,
          origY: cropRect.y,
        };
        return;
      }
      return;
    }
    if (!cropMode && ctxRef.current && !replaceMode) {
      setDrawing(true);
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(mx, my);
      ctxRef.current.strokeStyle = brushColor;
      ctxRef.current.lineWidth = brushSize;
    }
  };

  const handleMouseMove = (e) => {
    if (replaceMode) return;
    const { x: mx, y: my } = getCanvasCoords(e);
    if (cropMode && cropDragInfo.current) {
      const { x: ix, y: iy } = toImageCoords(mx, my);
      const info = cropDragInfo.current;
      const orig = info.origRect;
      let newRect = { ...cropRect };
      if (info.type === 'move') {
        const dx = ix - info.startX,
          dy = iy - info.startY;
        const iw = imageRef.current.width,
          ih = imageRef.current.height;
        newRect.x = Math.max(
          0,
          Math.min(info.origX + dx, iw - newRect.w)
        );
        newRect.y = Math.max(
          0,
          Math.min(info.origY + dy, ih - newRect.h)
        );
      } else if (info.type === 'handle') {
        const dx = ix - info.startX,
          dy = iy - info.startY,
          handle = info.handle;
        if (handle.x === orig.x) {
          newRect.x = Math.min(
            orig.x + orig.w - 10,
            orig.x + dx
          );
          newRect.w = orig.w - (newRect.x - orig.x);
        } else {
          newRect.w = Math.max(10, orig.w + dx);
        }
        if (handle.y === orig.y) {
          newRect.y = Math.min(
            orig.y + orig.h - 10,
            orig.y + dy
          );
          newRect.h = orig.h - (newRect.y - orig.y);
        } else {
          newRect.h = Math.max(10, orig.h + dy);
        }
        const iw = imageRef.current.width,
          ih = imageRef.current.height;
        newRect.x = Math.max(0, newRect.x);
        newRect.y = Math.max(0, newRect.y);
        if (newRect.x + newRect.w > iw) newRect.w = iw - newRect.x;
        if (newRect.y + newRect.h > ih) newRect.h = ih - newRect.y;
      }
      setCropRect(newRect);
      return;
    }
    if (drawing && ctxRef.current) {
      ctxRef.current.lineTo(mx, my);
      ctxRef.current.stroke();
    }
  };

  const handleMouseUp = () => {
    if (cropDragInfo.current) {
      cropDragInfo.current = null;
      return;
    }
    if (drawing) {
      ctxRef.current?.closePath();
      setDrawing(false);
      saveHistory();
    }
  };

  // ─── Crop actions ────────────────────────────────────────
  const applyPreset = (ratioW, ratioH) => {
    const img = imageRef.current;
    if (!img) return;
    const iw = img.width,
      ih = img.height;
    let newW, newH;
    if (iw / ih > ratioW / ratioH) {
      newH = ih;
      newW = Math.round(ih * (ratioW / ratioH));
    } else {
      newW = iw;
      newH = Math.round(iw / (ratioW / ratioH));
    }
    setCropRect({
      x: Math.round((iw - newW) / 2),
      y: Math.round((ih - newH) / 2),
      w: newW,
      h: newH,
    });
  };

  const enterCropMode = () => {
    const img = imageRef.current;
    if (!img) return;
    saveHistory();
    setCropRect(
      appliedCrop || { x: 0, y: 0, w: img.width, h: img.height }
    );
    setCropMode(true);
  };
  const applyCrop = () => {
    saveHistory();
    setAppliedCrop(cropRect);
    setCropMode(false);
  };
  const cancelCrop = () => {
    setCropRect(appliedCrop);
    setCropMode(false);
  };
  const resetCrop = () => {
    const img = imageRef.current;
    if (!img) return;
    const full = { x: 0, y: 0, w: img.width, h: img.height };
    setCropRect(full);
    setAppliedCrop(full);
    setCropMode(false);
    drawImage();
  };
  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'edited_image.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  // ─── Crop input drag helpers ─────────────────────────────
  const handleCropInputDragStart = (key, currentValue, e) => {
    if (e.button !== 0) return;
    if (editingInputKey && editingInputKey !== key) return;
    if (editingInputKey === key) return;
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
    setDragStartValue(currentValue);
    setDragStartPointerX(e.clientX);
  };

  const handleCropInputDoubleClick = (key) => {
    setEditingInputKey(key);
  };

  const cropInputFields = [
    { label: 'X', key: 'cropX', value: cropX, color: 'var(--red)' },
    { label: 'Y', key: 'cropY', value: cropY, color: 'var(--orange)' },
    { label: 'W', key: 'cropW', value: cropW, color: 'var(--yellow)' },
    { label: 'H', key: 'cropH', value: cropH, color: 'var(--pink)' },
  ];

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: 'var(--white)', color: 'var(--black)' }}
    >
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
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
            style={{ backgroundColor: 'var(--red)', color: 'var(--white)' }}
          >
            <FaUpload size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--black)' }}>
              Photo Editor
            </h2>
            <p className="text-xs" style={{ color: 'var(--gray)' }}>
              Edit, enhance, and remove backgrounds
            </p>
          </div>
        </div>

        {image && (
          <div className="flex flex-wrap items-center gap-2">
            <motion.label
              htmlFor="photo-replace"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5"
              style={{ backgroundColor: 'var(--blue)', color: 'var(--white)' }}
            >
              <FaExchangeAlt size={12} /> Replace
            </motion.label>

          

            <div
              className="w-px h-6"
              style={{ backgroundColor: 'var(--border)' }}
            />

            {!backgroundRemoved ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleRemoveBackground}
                disabled={removingBackground}
                className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 disabled:opacity-60 shadow-lg"
                style={{
                  backgroundColor: 'var(--red)',
                  color: 'var(--white)',
                  boxShadow: '0 4px 16px rgba(239,68,68,0.3)',
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
                  style={{
                    backgroundColor: 'var(--orange)',
                    color: 'var(--white)',
                  }}
                >
                  Restore
                </motion.button>
                <div className="flex items-center gap-1">
                  {[
                    'transparent',
                    '#ffffff',
                    '#000000',
                    '#ff0000',
                    '#00ff00',
                    '#0000ff',
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() => setBgColor(color)}
                      className="w-6 h-6 rounded-full border-2 cursor-pointer transition-all"
                      style={{
                        backgroundColor:
                          color === 'transparent' ? 'transparent' : color,
                        borderColor:
                          bgColor === color
                            ? 'var(--red)'
                            : 'var(--border)',
                        backgroundImage:
                          color === 'transparent'
                            ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)'
                            : 'none',
                        backgroundSize:
                          color === 'transparent' ? '8px 8px' : 'auto',
                        backgroundPosition:
                          color === 'transparent'
                            ? '0 0, 4px 4px'
                            : '0 0',
                      }}
                    />
                  ))}
                </div>
              </>
            )}

            <div
              className="w-px h-6"
              style={{ backgroundColor: 'var(--border)' }}
            />

            {!cropMode ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={enterCropMode}
                className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                style={{
                  backgroundColor: 'var(--lightgray)',
                  color: 'var(--black)',
                }}
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
                  style={{
                    backgroundColor: 'var(--green)',
                    color: 'var(--white)',
                  }}
                >
                  ✅ Apply
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={cancelCrop}
                  className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                  style={{
                    backgroundColor: 'var(--red)',
                    color: 'var(--white)',
                  }}
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
              style={{
                backgroundColor: 'var(--lightgray)',
                color: 'var(--black)',
              }}
            >
              ↺ Reset Crop
            </motion.button>

            {/* ─── Color Replacer toggle ─────────────────── */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={toggleReplaceMode}
              disabled={cropMode}
              className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              style={{
                backgroundColor: replaceMode
                  ? 'var(--red)'
                  : 'var(--lightgray)',
                color: replaceMode ? 'var(--white)' : 'var(--black)',
              }}
            >
              <FaEyeDropper size={12} />{' '}
              {replaceMode ? 'Exit Replace' : 'Color Replace'}
            </motion.button>

            <div
              className="w-px h-6"
              style={{ backgroundColor: 'var(--border)' }}
            />

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
                backgroundColor: 'var(--red)',
                color: 'var(--white)',
                boxShadow: '0 4px 16px rgba(239,68,68,0.3)',
              }}
            >
              <FaDownload size={14} /> Export
            </motion.button>
          </div>
        )}
      </div>

      {/* ─── Replace Panel ───────────────────────────────── */}
      <AnimatePresence>
        {replaceMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 border-t"
            style={{
              backgroundColor: 'var(--white)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border"
                  style={{
                    backgroundColor: targetColor || '#ccc',
                    borderColor: 'var(--border)',
                  }}
                />
                <div>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: 'var(--black)' }}
                  >
                    Target
                  </p>
                  <p className="text-xs" style={{ color: 'var(--gray)' }}>
                    {pickingTarget
                      ? 'Click image to pick'
                      : targetColor || 'none'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border"
                  style={{
                    backgroundColor: replacementColor,
                    borderColor: 'var(--border)',
                  }}
                />
                <div>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: 'var(--black)' }}
                  >
                    Replace with
                  </p>
                  <p className="text-xs" style={{ color: 'var(--gray)' }}>
                    {pickingTarget ? 'pick target first' : replacementColor}
                  </p>
                </div>
              </div>
              {!pickingTarget && (
                <input
                  type="color"
                  value={replacementColor}
                  onChange={(e) => setReplacementColor(e.target.value)}
                  className="w-8 h-8 p-0 border rounded cursor-pointer"
                />
              )}
              <div className="flex items-center gap-2 ml-auto">
                <label
                  className="flex items-center gap-1 text-xs"
                  style={{ color: 'var(--black)' }}
                >
                  Tolerance
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={tolerance}
                    onChange={(e) => setTolerance(+e.target.value)}
                    className="w-20"
                  />
                  <span
                    className="font-mono"
                    style={{ color: 'var(--gray)' }}
                  >
                    {tolerance}
                  </span>
                </label>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={applyColorReplace}
                  disabled={!targetColor || pickingTarget}
                  className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--red)',
                    color: 'var(--white)',
                  }}
                >
                  Apply Replace
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setTargetColor(null);
                    setPickingTarget(true);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                  style={{
                    backgroundColor: 'var(--lightgray)',
                    color: 'var(--black)',
                  }}
                >
                  Reset Pick
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Content Area ──────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {!image ? (
          <div className="flex items-center justify-center h-full p-4">
            <motion.label
              htmlFor="photo-upload"
              className="flex flex-col items-center gap-4 p-12 rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-300 w-full max-w-lg"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--lightgray)',
              }}
              whileHover={{ scale: 1.02, borderColor: 'var(--red)' }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--red)',
                  color: 'var(--white)',
                }}
              >
                <FaUpload size={32} />
              </motion.div>
              <div className="text-center">
                <h3
                  className="text-lg font-bold mb-1"
                  style={{ color: 'var(--black)' }}
                >
                  Upload Image
                </h3>
                <p className="text-sm" style={{ color: 'var(--gray)' }}>
                  Click or drag & drop to get started
                </p>
              </div>
            </motion.label>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {/* Filter Sliders */}
            <div
              className="flex flex-wrap gap-3 justify-center p-3 rounded-2xl"
              style={{ backgroundColor: 'var(--lightgray)' }}
            >
              {[
                {
                  name: 'Brightness',
                  key: 'brightness',
                  max: 200,
                  icon: '☀️',
                },
                {
                  name: 'Contrast',
                  key: 'contrast',
                  max: 200,
                  icon: '🌓',
                },
                {
                  name: 'Saturation',
                  key: 'saturation',
                  max: 200,
                  icon: '🎨',
                },
                {
                  name: 'Blur',
                  key: 'blur',
                  max: 10,
                  step: 0.1,
                  icon: '💧',
                },
              ].map(({ name, key, max, step = 1, icon }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl"
                  style={{
                    backgroundColor: 'var(--white)',
                    color: 'var(--black)',
                  }}
                >
                  <span>{icon}</span>
                  <span>{name}</span>
                  <input
                    type="range"
                    min="0"
                    max={max}
                    step={step}
                    value={filterValues[key]}
                    onChange={(e) => {
                      setFilterValues((f) => ({
                        ...f,
                        [key]: +e.target.value,
                      }));
                      saveHistory();
                    }}
                    className="w-20"
                  />
                </label>
              ))}
            </div>

            {/* Progress Bar */}
            <AnimatePresence>
              {removingBackground && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div
                    className="w-full h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--lightgray)' }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: 'var(--red)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${removalProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p
                    className="text-xs text-center mt-1"
                    style={{ color: 'var(--gray)' }}
                  >
                    Removing background... {removalProgress}%
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Crop Panel */}
            <AnimatePresence>
              {cropMode && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-2xl space-y-3"
                  style={{ backgroundColor: 'var(--lightgray)' }}
                >
                  <div className="flex items-center justify-between">
                    <p
                      className="font-bold text-sm"
                      style={{ color: 'var(--black)' }}
                    >
                      Crop Area (pixels)
                    </p>
                    <div className="flex gap-2">
                      {[
                        [16, 9],
                        [4, 3],
                        [1, 1],
                        [9, 16],
                        [21, 9],
                      ].map(([w, h]) => (
                        <motion.button
                          key={`${w}-${h}`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => applyPreset(w, h)}
                          className="px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer"
                          style={{
                            backgroundColor: 'var(--white)',
                            color: 'var(--black)',
                          }}
                        >
                          {w}:{h}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {cropInputFields.map((f) => {
                      const isEditing = editingInputKey === f.key;
                      return (
                        <label
                          key={f.key}
                          className="flex flex-col text-xs font-medium"
                          style={{ color: 'var(--gray)' }}
                        >
                          <span
                            className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold mb-1"
                            style={{
                              backgroundColor: f.color,
                              color: 'var(--white)',
                            }}
                          >
                            {f.label}
                          </span>
                          <input
                            type="number"
                            value={
                              isEditing ? f.value : Math.round(f.value)
                            }
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              if (f.key === 'cropX') setCropX(val);
                              else if (f.key === 'cropY') setCropY(val);
                              else if (f.key === 'cropW') setCropW(val);
                              else if (f.key === 'cropH') setCropH(val);
                              if (isEditing && cropRect) {
                                const img = imageRef.current;
                                if (!img) return;
                                let x = cropRect.x,
                                  y = cropRect.y,
                                  w = cropRect.w,
                                  h = cropRect.h;
                                if (f.key === 'cropX')
                                  x = Math.max(0, val);
                                else if (f.key === 'cropY')
                                  y = Math.max(0, val);
                                else if (f.key === 'cropW')
                                  w = Math.max(1, val);
                                else if (f.key === 'cropH')
                                  h = Math.max(1, val);
                                x = Math.min(x, img.width - w);
                                y = Math.min(y, img.height - h);
                                w = Math.min(w, img.width - x);
                                h = Math.min(h, img.height - y);
                                setCropRect({ x, y, w, h });
                              }
                            }}
                            onPointerDown={(e) =>
                              handleCropInputDragStart(
                                f.key,
                                f.value,
                                e
                              )
                            }
                            onDoubleClick={() =>
                              handleCropInputDoubleClick(f.key)
                            }
                            onBlur={() => {
                              if (isEditing) {
                                setEditingInputKey(null);
                                const img = imageRef.current;
                                if (img && cropRect) {
                                  let x = cropRect.x,
                                    y = cropRect.y,
                                    w = cropRect.w,
                                    h = cropRect.h;
                                  x = Math.max(
                                    0,
                                    Math.min(x, img.width - w)
                                  );
                                  y = Math.max(
                                    0,
                                    Math.min(y, img.height - h)
                                  );
                                  w = Math.min(w, img.width - x);
                                  h = Math.min(h, img.height - y);
                                  setCropRect({ x, y, w, h });
                                }
                              }
                            }}
                            onKeyDown={(e) => {
                              if (
                                isEditing &&
                                e.key === 'Enter'
                              ) {
                                e.target.blur();
                              }
                            }}
                            className={`p-1.5 rounded-lg text-xs font-semibold border ${
                              isEditing
                                ? 'cursor-text border-blue-500 ring-1 ring-blue-200'
                                : 'cursor-ew-resize'
                            }`}
                            style={{
                              backgroundColor: 'var(--white)',
                              color: 'var(--black)',
                              borderColor: isEditing
                                ? 'var(--blue)'
                                : 'var(--border)',
                            }}
                            readOnly={!isEditing}
                          />
                        </label>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Canvas */}
            <div className="flex items-center justify-center">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="rounded-2xl shadow-2xl"
                style={{
                  border: '4px solid var(--white)',
                  maxWidth: '100%',
                  maxHeight: '55vh',
                  objectFit: 'contain',
                  cursor: replaceMode
                    ? 'crosshair'
                    : cropMode
                    ? 'default'
                    : drawing
                    ? 'crosshair'
                    : 'default',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}