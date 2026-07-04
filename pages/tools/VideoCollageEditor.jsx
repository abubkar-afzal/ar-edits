"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaVideo,
  FaMusic,
  FaPlay,
  FaPause,
  FaExpand,
  FaCompress,
  FaUndo,
  FaRedo,
  FaTrash,
  FaExchangeAlt,
  FaDownload,
} from "react-icons/fa";

const CANVAS_PRESETS = {
  "1:1 (1080x1080)": { width: 1080, height: 1080 },
  "16:9 (1920x1080)": { width: 1920, height: 1080 },
  "9:16 (1080x1920)": { width: 1080, height: 1920 },
  "4:5 (1080x1350)": { width: 1080, height: 1350 },
  "21:9 (2560x1080)": { width: 2560, height: 1080 },
};

const DEFAULT_CANVAS = { width: 1280, height: 720 };
const FPS = 30;
const FRAME_MS = 1000 / FPS;

const generateId = () => Math.random().toString(36).substr(2, 9);

const PRESETS = [
  { name: "2 Grid H", frames: [{ x: 0, y: 0, w: 0.5, h: 1 }, { x: 0.5, y: 0, w: 0.5, h: 1 }] },
  { name: "2 Grid V", frames: [{ x: 0, y: 0, w: 1, h: 0.5 }, { x: 0, y: 0.5, w: 1, h: 0.5 }] },
  { name: "3 Grid", frames: [{ x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 }, { x: 0, y: 0.5, w: 1, h: 0.5 }] },
  { name: "4 Grid", frames: [{ x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 }, { x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }] },
  { name: "PIP Bottom Right", frames: [{ x: 0, y: 0, w: 1, h: 1 }, { x: 0.65, y: 0.65, w: 0.3, h: 0.3 }] },
  { name: "3 Vertical", frames: [{ x: 0, y: 0, w: 1 / 3, h: 1 }, { x: 1 / 3, y: 0, w: 1 / 3, h: 1 }, { x: 2 / 3, y: 0, w: 1 / 3, h: 1 }] },
  { name: "Sidebar", frames: [{ x: 0, y: 0, w: 0.7, h: 1 }, { x: 0.7, y: 0, w: 0.3, h: 0.5 }, { x: 0.7, y: 0.5, w: 0.3, h: 0.5 }] },
  { name: "3 Equal Horizontal", frames: [{ x: 0, y: 0, w: 1, h: 1 / 3 }, { x: 0, y: 1 / 3, w: 1, h: 1 / 3 }, { x: 0, y: 2 / 3, w: 1, h: 1 / 3 }] },
  { name: "6 Grid", frames: Array.from({ length: 6 }, (_, i) => ({ x: (i % 3) / 3, y: Math.floor(i / 3) / 2, w: 1 / 3, h: 1 / 2 })) },
  { name: "9 Grid", frames: Array.from({ length: 9 }, (_, i) => ({ x: (i % 3) / 3, y: Math.floor(i / 3) / 3, w: 1 / 3, h: 1 / 3 })) },
];

export default function VideoCollageEditor() {
  // ---------- State ----------
  const [sourceVideos, setSourceVideos] = useState([]);
  const [elements, setElements] = useState([]);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [preset, setPreset] = useState(PRESETS[0]);
  const [layoutMode, setLayoutMode] = useState(false);
  const [panZoom, setPanZoom] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [projectDuration, setProjectDuration] = useState(0);
  const [backgroundAudio, setBackgroundAudio] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [isDraggingPan, setIsDraggingPan] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [canvasSizeKey, setCanvasSizeKey] = useState("16:9 (1920x1080)");
  const canvasSize = CANVAS_PRESETS[canvasSizeKey] || DEFAULT_CANVAS;
  const [swapMode, setSwapMode] = useState(false);
  const swapFirstFrameRef = useRef(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(5);

  // Export state
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportDone, setExportDone] = useState(false);
  const [exportBlob, setExportBlob] = useState(null);
  const [exportError, setExportError] = useState(null);
  const cancelledRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const bgAudioElRef = useRef(null);
  const exportAudioElRef = useRef(null);

  // Drag-to-adjust input state
  const [editingInputKey, setEditingInputKey] = useState(null);
  const [isDraggingInput, setIsDraggingInput] = useState(false);
  const [dragInputKey, setDragInputKey] = useState(null);
  const [dragStartValue, setDragStartValue] = useState(0);
  const [dragStartPointerX, setDragStartPointerX] = useState(0);
  const lastTapForInputRef = useRef({ time: 0, key: null });

  const canvasRef = useRef(null);
  const videoElementsRef = useRef(new Map());
  const animationFrameRef = useRef(null);
  const playStartTimeRef = useRef(0);
  const isExportingRef = useRef(false);

  // ---------- Helpers ----------
  const getSourceVideo = (id) => sourceVideos.find((v) => v.id === id);

  const clearVideoElement = useCallback((sourceVideoId) => {
    if (videoElementsRef.current.has(sourceVideoId)) {
      const old = videoElementsRef.current.get(sourceVideoId);
      old.pause();
      old.src = "";
      videoElementsRef.current.delete(sourceVideoId);
    }
  }, []);

  const getVideoElement = useCallback(
    (sourceVideoId) => {
      if (!sourceVideoId) return null;
      if (videoElementsRef.current.has(sourceVideoId))
        return videoElementsRef.current.get(sourceVideoId);
      const src = getSourceVideo(sourceVideoId)?.url;
      if (!src) return null;
      const video = document.createElement("video");
      video.src = src;
      video.preload = "auto";
      video.playsInline = true;
      video.muted = true;
      video.playbackRate = 1;
      videoElementsRef.current.set(sourceVideoId, video);
      return video;
    },
    [sourceVideos]
  );

  const getPanZoom = (frameIdx) => panZoom[frameIdx] || { offsetX: 0, offsetY: 0, zoom: 1 };

  useEffect(() => { setPanZoom({}); }, [canvasSizeKey]);

  useEffect(() => {
    if (sourceVideos.length === 0) {
      setElements([]);
      return;
    }
    const newElements = preset.frames.map((frame, idx) => {
      const vid = sourceVideos[idx % sourceVideos.length];
      return {
        id: generateId(),
        sourceVideoId: vid ? vid.id : null,
        frameIdx: idx,
        transform: { ...frame },
        trimStart: 0,
        trimEnd: vid ? vid.duration : 5,
        muted: true,
      };
    });
    setElements(newElements);
    setPanZoom({});
  }, [sourceVideos, preset]);

  useEffect(() => {
    let max = 0;
    elements.forEach((el) => {
      if (el.sourceVideoId) max = Math.max(max, el.trimEnd - el.trimStart);
    });
    setProjectDuration(max);
  }, [elements]);

  useEffect(() => {
    if (selectedFrame !== null) {
      const el = elements.find((e) => e.frameIdx === selectedFrame);
      if (el?.sourceVideoId) {
        setTrimStart(el.trimStart);
        setTrimEnd(el.trimEnd);
      }
    }
  }, [selectedFrame, elements]);

  const handleTrimChange = (type, value) => {
    if (selectedFrame === null) return;
    const src = getSourceVideo(elements.find((e) => e.frameIdx === selectedFrame)?.sourceVideoId);
    if (!src) return;
    const max = src.duration;
    setElements((prev) =>
      prev.map((el) => {
        if (el.frameIdx !== selectedFrame) return el;
        if (type === "start")
          return { ...el, trimStart: Math.max(0, Math.min(value, el.trimEnd - 0.1)) };
        else return { ...el, trimEnd: Math.min(max, Math.max(value, el.trimStart + 0.1)) };
      })
    );
  };

  // ---------- Canvas drawing ----------
  const drawOnCanvas = useCallback(
    (canvas, hideOverlay = false) => {
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const { width, height } = canvasSize;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);

      elements.forEach((el) => {
        if (!el.sourceVideoId) return;
        const video = getVideoElement(el.sourceVideoId);
        if (!video || video.readyState < 2) return;

        const f = el.transform;
        const x = f.x * width,
          y = f.y * height,
          w = f.w * width,
          h = f.h * height;
        const pz = getPanZoom(el.frameIdx);
        const zoom = pz.zoom,
          ox = pz.offsetX,
          oy = pz.offsetY;

        const vw = video.videoWidth || width,
          vh = video.videoHeight || height;
        const vAspect = vw / vh,
          fAspect = w / h;
        let bw, bh;
        if (vAspect > fAspect) {
          bh = h;
          bw = vw * (h / vh);
        } else {
          bw = w;
          bh = vh * (w / vw);
        }
        const dw = bw * zoom,
          dh = bh * zoom;
        const cx = x + w / 2,
          cy = y + h / 2;
        const dx = cx - dw / 2 + ox,
          dy = cy - dh / 2 + oy;

        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        ctx.drawImage(video, dx, dy, dw, dh);
        ctx.restore();

        if (!hideOverlay && !isExportingRef.current && selectedFrame === el.frameIdx) {
          ctx.strokeStyle = "#00f";
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, w, h);
        }
      });
    },
    [elements, getVideoElement, selectedFrame, panZoom, canvasSize]
  );

  const drawStaticPreview = useCallback(() => drawOnCanvas(canvasRef.current, false), [drawOnCanvas]);
  useEffect(() => { drawStaticPreview(); }, [drawStaticPreview]);

  // Video ready listener
  useEffect(() => {
    const handler = () => drawStaticPreview();
    sourceVideos.forEach((v) => {
      const el = getVideoElement(v.id);
      if (el) {
        el.addEventListener("loadeddata", handler);
        el.addEventListener("canplay", handler);
      }
    });
    return () => {
      sourceVideos.forEach((v) => {
        const el = getVideoElement(v.id);
        if (el) {
          el.removeEventListener("loadeddata", handler);
          el.removeEventListener("canplay", handler);
        }
      });
    };
  }, [sourceVideos, drawStaticPreview, getVideoElement]);

  // ---------- Background audio ----------
  useEffect(() => {
    if (backgroundAudio && !bgAudioElRef.current) {
      const a = new Audio(backgroundAudio.url);
      a.loop = false;
      bgAudioElRef.current = a;
    } else if (!backgroundAudio && bgAudioElRef.current) {
      bgAudioElRef.current.pause();
      bgAudioElRef.current.src = "";
      bgAudioElRef.current = null;
    }
    return () => {
      if (bgAudioElRef.current) {
        bgAudioElRef.current.pause();
        bgAudioElRef.current.src = "";
        bgAudioElRef.current = null;
      }
    };
  }, [backgroundAudio]);

  useEffect(() => {
    const audio = bgAudioElRef.current;
    if (!audio || !backgroundAudio) return;
    if (isPlaying) {
      audio.currentTime = backgroundAudio.trimStart || 0;
      audio.play().catch(() => {});
    } else audio.pause();
  }, [isPlaying, backgroundAudio]);

  // ---------- Playback ----------
  const stopPlayback = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
    videoElementsRef.current.forEach((v) => v.pause());
    if (bgAudioElRef.current) bgAudioElRef.current.pause();
    setIsPlaying(false);
  }, []);

  const startPlayback = useCallback(() => {
    if (elements.length === 0) return;
    stopPlayback();
    const start = currentTime >= projectDuration ? 0 : currentTime;
    setCurrentTime(start);
    playStartTimeRef.current = performance.now() / 1000;

    elements.forEach((el) => {
      if (!el.sourceVideoId) return;
      const v = getVideoElement(el.sourceVideoId);
      if (!v) return;
      v.currentTime = el.trimStart;
      v.playbackRate = 1;
      v.play().catch(() => {});
    });
    setIsPlaying(true);

    const animate = () => {
      const now = performance.now() / 1000;
      const elapsed = now - playStartTimeRef.current;
      const newTime = start + elapsed;
      setCurrentTime(newTime);

      elements.forEach((el) => {
        if (!el.sourceVideoId) return;
        const v = getVideoElement(el.sourceVideoId);
        if (!v) return;
        const local = el.trimStart + newTime;
        if (local <= el.trimEnd) {
          if (Math.abs(v.currentTime - local) > 0.2) v.currentTime = local;
          if (v.paused) v.play().catch(() => {});
        } else v.pause();
      });

      if (bgAudioElRef.current && backgroundAudio) {
        const dur = backgroundAudio.trimEnd - backgroundAudio.trimStart;
        if (elapsed > dur && !bgAudioElRef.current.paused) bgAudioElRef.current.pause();
      }

      drawStaticPreview();

      if (newTime >= projectDuration) {
        stopPlayback();
        return;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [currentTime, projectDuration, elements, getVideoElement, drawStaticPreview, stopPlayback, backgroundAudio]);

  // ─── Drag-to-adjust useEffect ───
  useEffect(() => {
    if (!isDraggingInput) return;
    const onPointerMove = (e) => {
      const deltaX = e.clientX - dragStartPointerX;
      const sensitivity = canvasSize.width * 0.01;
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

  // ---------- Mouse handlers ----------
  const handleCanvasMouseDown = (e) => {
    if (layoutMode || swapMode || selectedFrame === null) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width,
      scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX,
      my = (e.clientY - rect.top) * scaleY;
    const el = elements.find((el) => el.frameIdx === selectedFrame);
    if (!el) return;
    const f = el.transform;
    const fx = f.x * canvas.width,
      fy = f.y * canvas.height,
      fw = f.w * canvas.width,
      fh = f.h * canvas.height;
    if (mx >= fx && mx <= fx + fw && my >= fy && my <= fy + fh) {
      setIsDraggingPan(true);
      dragStartRef.current = { x: mx, y: my };
      e.preventDefault();
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDraggingPan) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width,
      scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX,
      my = (e.clientY - rect.top) * scaleY;
    const dx = mx - dragStartRef.current.x,
      dy = my - dragStartRef.current.y;
    setPanZoom((prev) => {
      const curr = prev[selectedFrame] || { offsetX: 0, offsetY: 0, zoom: 1 };
      return {
        ...prev,
        [selectedFrame]: {
          ...curr,
          offsetX: curr.offsetX + dx,
          offsetY: curr.offsetY + dy,
        },
      };
    });
    dragStartRef.current = { x: mx, y: my };
  };

  const handleCanvasMouseUp = () => setIsDraggingPan(false);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width,
      scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX,
      my = (e.clientY - rect.top) * scaleY;
    let hitIdx = null;
    elements.forEach((el) => {
      const f = el.transform;
      if (
        mx >= f.x * canvas.width &&
        mx <= (f.x + f.w) * canvas.width &&
        my >= f.y * canvas.height &&
        my <= (f.y + f.h) * canvas.height
      )
        hitIdx = el.frameIdx;
    });

    if (swapMode && hitIdx !== null) {
      if (swapFirstFrameRef.current === null) {
        swapFirstFrameRef.current = hitIdx;
        setSelectedFrame(hitIdx);
      } else if (swapFirstFrameRef.current !== hitIdx) {
        const frameA = swapFirstFrameRef.current,
          frameB = hitIdx;
        setElements((prev) => {
          const newEls = prev.map((el) => ({ ...el }));
          const a = newEls.find((el) => el.frameIdx === frameA),
            b = newEls.find((el) => el.frameIdx === frameB);
          if (a && b) {
            [a.sourceVideoId, b.sourceVideoId] = [b.sourceVideoId, a.sourceVideoId];
            [a.muted, b.muted] = [b.muted, a.muted];
            [a.trimStart, b.trimStart] = [b.trimStart, a.trimStart];
            [a.trimEnd, b.trimEnd] = [b.trimEnd, a.trimEnd];
          }
          return newEls;
        });
        setPanZoom((prev) => {
          const n = { ...prev };
          delete n[frameA];
          delete n[frameB];
          return n;
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
    const scaleX = canvas.width / rect.width,
      scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX,
      my = (e.clientY - rect.top) * scaleY;
    let hitIdx = null;
    elements.forEach((el) => {
      const f = el.transform;
      if (
        mx >= f.x * canvas.width &&
        mx <= (f.x + f.w) * canvas.width &&
        my >= f.y * canvas.height &&
        my <= (f.y + f.h) * canvas.height
      )
        hitIdx = el.frameIdx;
    });
    if (hitIdx !== null) {
      setSelectedFrame(hitIdx);
      setContextMenu({ x: e.clientX, y: e.clientY, frameIdx: hitIdx });
    }
  };

  const deleteFrameClip = () => {
    if (!contextMenu) return;
    setElements((prev) =>
      prev.map((el) =>
        el.frameIdx === contextMenu.frameIdx ? { ...el, sourceVideoId: null } : el
      )
    );
    setContextMenu(null);
  };

  const replaceFrameClip = () => {
    if (!contextMenu) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.src = url;
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        const newId = generateId();
        const newObj = {
          id: newId,
          file,
          url,
          duration: video.duration,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
        };
        const oldEl = elements.find((el) => el.frameIdx === contextMenu.frameIdx);
        if (oldEl?.sourceVideoId) clearVideoElement(oldEl.sourceVideoId);
        setSourceVideos((prev) => [...prev, newObj]);
        setElements((prev) =>
          prev.map((el) =>
            el.frameIdx === contextMenu.frameIdx
              ? { ...el, sourceVideoId: newId, trimStart: 0, trimEnd: video.duration }
              : el
          )
        );
        setContextMenu(null);
        const newVe = getVideoElement(newId);
        if (newVe) newVe.addEventListener("canplay", () => drawStaticPreview(), { once: true });
      };
    };
    input.click();
  };

  const handleVideoUpload = (e) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.src = url;
      video.preload = "metadata";
      video.onloadedmetadata = () =>
        setSourceVideos((prev) => [
          ...prev,
          {
            id: generateId(),
            file,
            url,
            duration: video.duration,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
          },
        ]);
    });
  };

  // ─── Background Audio Upload / Replace / Remove ──────────
  const handleBgAudioUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const actx = new (window.AudioContext || window.webkitAudioContext)();
    fetch(url)
      .then((r) => r.arrayBuffer())
      .then((b) => actx.decodeAudioData(b))
      .then((decoded) => {
        setBackgroundAudio({
          file,
          url,
          duration: decoded.duration,
          waveform: decoded.getChannelData(0),
          trimStart: 0,
          trimEnd: decoded.duration,
        });
      })
      .catch(() =>
        setBackgroundAudio({
          file,
          url,
          duration: 0,
          waveform: null,
          trimStart: 0,
          trimEnd: 0,
        })
      );
  };

  const replaceBgAudio = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // Stop current playback
      if (bgAudioElRef.current) {
        bgAudioElRef.current.pause();
        bgAudioElRef.current.src = "";
      }
      const url = URL.createObjectURL(file);
      const actx = new (window.AudioContext || window.webkitAudioContext)();
      fetch(url)
        .then((r) => r.arrayBuffer())
        .then((b) => actx.decodeAudioData(b))
        .then((decoded) => {
          setBackgroundAudio({
            file,
            url,
            duration: decoded.duration,
            waveform: decoded.getChannelData(0),
            trimStart: 0,
            trimEnd: decoded.duration,
          });
        })
        .catch(() =>
          setBackgroundAudio({
            file,
            url,
            duration: 0,
            waveform: null,
            trimStart: 0,
            trimEnd: 0,
          })
        );
    };
    input.click();
  };

  const removeBgAudio = () => {
    if (bgAudioElRef.current) {
      bgAudioElRef.current.pause();
      bgAudioElRef.current.src = "";
    }
    setBackgroundAudio(null);
  };
  // ---------- Export (unchanged except minor) ----------
  const exportVideo = async () => {
    if (elements.length === 0 || projectDuration <= 0) {
      setExportError("Add at least one video with duration.");
      setExporting(true);
      setExportDone(true);
      return;
    }
    cancelledRef.current = false;
    setExporting(true);
    setExportProgress(0);
    setExportDone(false);
    setExportBlob(null);
    setExportError(null);

    isExportingRef.current = true;
    drawStaticPreview();

    await Promise.all(
      elements.map((el) => {
        if (!el.sourceVideoId) return Promise.resolve();
        const v = getVideoElement(el.sourceVideoId);
        if (!v) return Promise.resolve();
        return new Promise((resolve) => {
          if (v.readyState >= 3) resolve();
          else {
            v.addEventListener("canplay", resolve, { once: true });
            setTimeout(resolve, 3000);
          }
        });
      })
    );

    elements.forEach((el) => {
      if (!el.sourceVideoId) return;
      const v = getVideoElement(el.sourceVideoId);
      if (!v) return;
      v.currentTime = el.trimStart;
      v.playbackRate = 1;
      v.muted = true;
      v.play().catch(() => {});
    });

    if (backgroundAudio && bgAudioElRef.current) {
      bgAudioElRef.current.pause();
      const exportAudio = new Audio(backgroundAudio.url);
      exportAudio.loop = false;
      exportAudio.currentTime = backgroundAudio.trimStart || 0;
      exportAudioElRef.current = exportAudio;
      await exportAudio.play().catch(() => {});
    }

    const offscreen = document.createElement("canvas");
    offscreen.width = canvasSize.width;
    offscreen.height = canvasSize.height;

    const canvasStream = offscreen.captureStream(FPS);
    let combinedStream = canvasStream;

    let audioCtx = null,
      sourceNode = null;
    if (exportAudioElRef.current) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        sourceNode = audioCtx.createMediaElementSource(exportAudioElRef.current);
        const dest = audioCtx.createMediaStreamDestination();
        sourceNode.connect(dest);
        const vt = canvasStream.getVideoTracks()[0];
        const at = dest.stream.getAudioTracks()[0];
        combinedStream = new MediaStream([vt, at]);
      } catch (err) {
        console.warn("Audio mix failed", err);
      }
    }

    const mime = MediaRecorder.isTypeSupported("video/webm; codecs=vp9")
      ? "video/webm; codecs=vp9"
      : "video/webm";
    const recorder = new MediaRecorder(combinedStream, {
      mimeType: mime,
      videoBitsPerSecond: 5000000,
    });
    mediaRecorderRef.current = recorder;
    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };

    recorder.onstop = () => {
      if (chunks.length === 0) {
        setExportError("No data recorded.");
        cleanupExport();
        return;
      }
      setExportBlob(new Blob(chunks, { type: mime }));
      setExportDone(true);
      setExporting(false);
      cleanupExport();
    };

    const cleanupExport = () => {
      elements.forEach((el) => {
        if (el.sourceVideoId) getVideoElement(el.sourceVideoId)?.pause();
      });
      if (exportAudioElRef.current) {
        exportAudioElRef.current.pause();
        exportAudioElRef.current.src = "";
        exportAudioElRef.current = null;
      }
      if (sourceNode) {
        sourceNode.disconnect();
        sourceNode = null;
      }
      if (audioCtx) {
        audioCtx.close();
        audioCtx = null;
      }
      isExportingRef.current = false;
      drawStaticPreview();
    };

    recorder.start();

    const startTime = performance.now() / 1000;
    const drawInterval = setInterval(() => {
      if (cancelledRef.current) {
        clearInterval(drawInterval);
        recorder.stop();
        cleanupExport();
        return;
      }

      const now = performance.now() / 1000;
      const elapsed = now - startTime;
      setExportProgress(Math.min(100, Math.round((elapsed / projectDuration) * 100)));

      elements.forEach((el) => {
        if (!el.sourceVideoId) return;
        const v = getVideoElement(el.sourceVideoId);
        if (!v) return;
        const local = el.trimStart + elapsed;
        if (local <= el.trimEnd) {
          if (Math.abs(v.currentTime - local) > 0.2) v.currentTime = local;
          if (v.paused) v.play().catch(() => {});
        } else v.pause();
      });

      drawOnCanvas(offscreen, true);

      if (elapsed >= projectDuration) {
        drawOnCanvas(offscreen, true);
        if (recorder.state === "recording") recorder.requestData();
        clearInterval(drawInterval);
        setTimeout(() => {
          if (recorder.state === "recording") recorder.stop();
        }, 100);
      }
    }, FRAME_MS);

    setTimeout(() => {
      if (recorder.state === "recording") {
        clearInterval(drawInterval);
        drawOnCanvas(offscreen, true);
        recorder.requestData();
        recorder.stop();
      }
    }, projectDuration * 1500);
  };

  const cancelExport = () => {
    cancelledRef.current = true;
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    setExporting(false);
    setExportDone(false);
  };

  const downloadBlob = () => {
    if (!exportBlob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(exportBlob);
    a.download = "video-collage.webm";
    a.click();
  };

  const closeModal = () => {
    setExporting(false);
    setExportDone(false);
    setExportBlob(null);
    setExportError(null);
  };

  // ---------- UI rendering ----------
   const selectedPanZoom = selectedFrame !== null ? getPanZoom(selectedFrame) : { offsetX: 0, offsetY: 0, zoom: 1 };
  const selectedElement = selectedFrame !== null ? elements.find((e) => e.frameIdx === selectedFrame) : null;
  const selectedSourceVideo = selectedElement ? getSourceVideo(selectedElement.sourceVideoId) : null;

  return (
    <div
      className="flex flex-col h-full overflow-x-hidden overflow-y-scroll"
      style={{ backgroundColor: "var(--white)", color: "var(--black)" }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
          >
            <FaVideo size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "var(--black)" }}>
              Video Collage
            </h2>
            <p className="text-xs" style={{ color: "var(--gray)" }}>
              Combine multiple videos into one frame
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept="video/*"
            multiple
            onChange={handleVideoUpload}
            className="hidden"
            id="video-upload"
          />
          <motion.label
            htmlFor="video-upload"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer flex items-center gap-2 shadow-lg"
            style={{
              backgroundColor: "var(--red)",
              color: "var(--white)",
              boxShadow: "0 4px 16px rgba(239, 68, 68, 0.3)",
            }}
          >
            <FaVideo size={14} /> Add Videos
          </motion.label>

          <select
            value={preset?.name}
            onChange={(e) =>
              setPreset(PRESETS.find((p) => p.name === e.target.value) || PRESETS[0])
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
            {Object.keys(CANVAS_PRESETS).map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>

          <div className="flex flex-wrap gap-1.5 ml-auto">
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
              <FaExpand size={12} /> {layoutMode ? "Done" : "Layout"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSwapMode(!swapMode);
                swapFirstFrameRef.current = null;
                if (!swapMode) setSelectedFrame(null);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer flex  items-center gap-1.5 transition-all"
              style={{
                backgroundColor: swapMode ? "var(--red)" : "var(--lightgray)",
                color: swapMode ? "var(--white)" : "var(--black)",
              }}
            >
              <FaExchangeAlt size={12} /> {swapMode ? "Swapping" : "Swap"}
            </motion.button>

            <input
              type="file"
              accept="audio/*"
              onChange={handleBgAudioUpload}
              className="hidden"
              id="bg-audio-upload"
            />
            <motion.label
              htmlFor="bg-audio-upload"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5"
              style={{ backgroundColor: "var(--lightgray)", color: "var(--black)" }}
            >
              <FaMusic size={12} /> Audio
            </motion.label>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportVideo}
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
        className="flex-1 flex items-center justify-center p-4"
        style={{ backgroundColor: "var(--white)" }}
      >
        <motion.div
          className="rounded-2xl overflow-x-hidden overflow-y-scroll shadow-2xl"
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
              maxHeight: "calc(100vh - 300px)",
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

      {/* ─── Playback Controls ────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-t"
        style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isPlaying ? stopPlayback : startPlayback}
          className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer shadow-lg"
          style={{
            backgroundColor: isPlaying ? "var(--red)" : "var(--green)",
            color: "var(--white)",
            boxShadow: isPlaying
              ? "0 4px 16px rgba(239,68,68,0.4)"
              : "0 4px 16px rgba(34,197,94,0.3)",
          }}
        >
          {isPlaying ? <FaPause size={16} /> : <FaPlay size={16} />}
        </motion.button>
        <span
          className="text-sm font-mono font-bold"
          style={{ color: "var(--black)" }}
        >
          {currentTime.toFixed(1)}s
        </span>
        <input
          type="range"
          min={0}
          max={projectDuration || 0}
          step={0.01}
          value={currentTime}
          onChange={(e) => {
            const t = Number(e.target.value);
            setCurrentTime(t);
            if (!isPlaying) {
              elements.forEach((el) => {
                if (!el.sourceVideoId) return;
                const v = getVideoElement(el.sourceVideoId);
                if (v) v.currentTime = el.trimStart + t;
              });
              drawStaticPreview();
            }
          }}
          className="flex-1"
        />
        <span
          className="text-sm font-mono font-bold"
          style={{ color: "var(--black)" }}
        >
          {projectDuration.toFixed(1)}s
        </span>
      </div>

      {/* ─── Background Audio Timeline ────────────────────── */}
       <AnimatePresence>
        {backgroundAudio && backgroundAudio.waveform && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-3 border-t"
            style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-3 text-xs mb-2">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
                >
                  <FaMusic size={10} />
                </div>
                <span
                  className="sm:hidden l:block font-semibold truncate max-w-[150px]"
                  style={{ color: "var(--black)" }}
                >
                  {backgroundAudio.file.name}
                </span>
              </div>
              <div
                className="w-px h-4"
                style={{ backgroundColor: "var(--border)" }}
              />
              <div className="flex sm:flex-col l:flex-row items-center">
              <label className="flex items-center gap-1.5" style={{ color: "var(--black)" }}>
                Start{" "}
                <input
                  type="range"
                  min={0}
                  max={backgroundAudio.duration}
                  step={0.1}
                  value={backgroundAudio.trimStart}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setBackgroundAudio((prev) => ({
                      ...prev,
                      trimStart: Math.min(v, prev.trimEnd - 0.1),
                    }));
                  }}
                  className="w-20"
                />
                <span className="font-mono">{backgroundAudio.trimStart.toFixed(1)}s</span>
              </label>
              <label className="flex items-center gap-1.5" style={{ color: "var(--black)" }}>
                End{" "}
                <input
                  type="range"
                  min={0}
                  max={backgroundAudio.duration}
                  step={0.1}
                  value={backgroundAudio.trimEnd}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setBackgroundAudio((prev) => ({
                      ...prev,
                      trimEnd: Math.max(v, prev.trimStart + 0.1),
                    }));
                  }}
                  className="w-20"
                />
                <span className="font-mono">{backgroundAudio.trimEnd.toFixed(1)}s</span>
              </label></div>
              {/* ─── Replace & Remove Buttons ─── */}
              <div className="flex sm:flex-col l:flex-row gap-1 ml-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={replaceBgAudio}
                  className="px-2 py-1 rounded text-[10px] font-bold cursor-pointer flex items-center gap-1"
                  style={{ backgroundColor: "var(--blue)", color: "var(--white)" }}
                >
                  <FaExchangeAlt size={10} /> Replace
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={removeBgAudio}
                  className="px-2 py-1 rounded text-[10px] font-bold cursor-pointer flex items-center gap-1"
                  style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
                >
                  <FaTrash size={10} /> Remove
                </motion.button>
              </div>
            </div>
            <div
              className="relative h-8 rounded-xl overflow-x-hidden overflow-y-scroll"
              style={{ backgroundColor: "var(--lightgray)" }}
            >
              <AudioWaveform waveformData={backgroundAudio.waveform} width={800} height={32} />
              <div
                className="absolute top-0 bottom-0"
                style={{
                  left: `${(backgroundAudio.trimStart / backgroundAudio.duration) * 100}%`,
                  width: `${
                    ((backgroundAudio.trimEnd - backgroundAudio.trimStart) /
                      backgroundAudio.duration) *
                    100
                  }%`,
                  backgroundColor: "rgba(239,68,68,0.25)",
                  borderLeft: "2px solid var(--red)",
                  borderRight: "2px solid var(--red)",
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Transform Controls (visible when frame selected, not in layout/swap) ─── */}
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
                      if (isEditing) return;

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
                onClick={deleteFrameClip}
                className="px-2 py-1 rounded text-[10px] font-bold cursor-pointer flex items-center gap-1"
                style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
              >
                <FaTrash size={10} /> Delete
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={replaceFrameClip}
                className="px-2 py-1 rounded text-[10px] font-bold cursor-pointer flex items-center gap-1"
                style={{ backgroundColor: "var(--blue)", color: "var(--white)" }}
              >
                <FaExchangeAlt size={10} /> Replace
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Trim controls (when a clip is selected) ────────── */}
      <AnimatePresence>
        {selectedFrame !== null && !layoutMode && !swapMode && selectedSourceVideo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex items-center gap-4 px-4 py-3 border-t text-sm"
            style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
              >
                <FaVideo size={14} />
              </div>
              <span className="sm:hidden l:block font-bold" style={{ color: "var(--black)" }}>
                Frame {selectedFrame + 1}
              </span>
              <span
                className="sm:hidden l:block text-xs truncate max-w-[120px]"
                style={{ color: "var(--gray)" }}
              >
                {selectedSourceVideo.file?.name}
              </span>
            </div>
            <div className="w-px h-6" style={{ backgroundColor: "var(--border)" }} />
            <div className="flex sm:flex-col l:flex-row items-center">
            <label
              className="flex items-center gap-2 text-xs font-medium"
              style={{ color: "var(--black)" }}
            >
              Start
              <input
                type="range"
                min={0}
                max={selectedSourceVideo.duration}
                step={0.1}
                value={trimStart}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setTrimStart(v);
                  handleTrimChange("start", v);
                }}
                className="w-24"
              />
              <span className="font-mono">{trimStart.toFixed(1)}s</span>
            </label>
            <label
              className="flex items-center gap-2 text-xs font-medium"
              style={{ color: "var(--black)" }}
            >
              End
              <input
                type="range"
                min={0}
                max={selectedSourceVideo.duration}
                step={0.1}
                value={trimEnd}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setTrimEnd(v);
                  handleTrimChange("end", v);
                }}
                className="w-24"
              />
              <span className="font-mono">{trimEnd.toFixed(1)}s</span>
            </label></div>
            <span className="text-xs" style={{ color: "var(--gray)" }}>
              Full: {selectedSourceVideo.duration.toFixed(1)}s
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Pan/Zoom controls (existing) ─── */}
      <AnimatePresence>
        {selectedFrame !== null && !layoutMode && !swapMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex items-center gap-4 px-4 py-3 border-t text-sm"
            style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}
          >
            <span className="sm:hidden l:block text-xs font-medium" style={{ color: "var(--gray)" }}>
              🖱️ Drag inside frame to pan
            </span>
            <div className="w-px h-6" style={{ backgroundColor: "var(--border)" }} />
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
                <FaExpand size={14} />
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
            className="fixed z-50 rounded-2xl shadow-2xl border py-2 w-48 overflow-x-hidden overflow-y-scroll"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
              backgroundColor: "var(--white)",
              borderColor: "var(--border)",
            }}
          >
            <button
              onClick={deleteFrameClip}
              className="w-full text-left px-4 py-2.5 text-sm font-semibold flex items-center gap-3 cursor-pointer transition-colors hover:opacity-80"
              style={{ color: "var(--red)" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
              >
                <FaTrash size={12} />
              </div>
              Delete Clip
            </button>
            <button
              onClick={replaceFrameClip}
              className="w-full text-left px-4 py-2.5 text-sm font-semibold flex items-center gap-3 cursor-pointer transition-colors hover:opacity-80"
              style={{ color: "var(--black)" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
              >
                <FaExchangeAlt size={12} />
              </div>
              Replace Clip
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Export Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {(exporting || exportDone || exportError) && (
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
              ) : exportDone && exportBlob ? (
                <>
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                    style={{ backgroundColor: "var(--green)", color: "var(--white)" }}
                  >
                    <FaCheck size={24} />
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: "var(--black)" }}>
                    Export Complete
                  </h3>
                  <p className="text-sm" style={{ color: "var(--gray)" }}>
                    Your video collage is ready!
                  </p>
                  <video
                    src={URL.createObjectURL(exportBlob)}
                    controls
                    className="w-full rounded-xl"
                    style={{ maxHeight: "180px" }}
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={downloadBlob}
                      className="px-5 py-3 rounded-xl text-sm font-bold cursor-pointer shadow-lg flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: "var(--red)",
                        color: "var(--white)",
                        boxShadow: "0 4px 16px rgba(239,68,68,0.3)",
                      }}
                    >
                      <FaDownload size={14} /> Download WebM
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
                      <FaVideo size={24} />
                    </motion.div>
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: "var(--black)" }}>
                    Exporting Video
                  </h3>
                  <div
                    className="w-full h-2.5 rounded-full overflow-x-hidden overflow-y-scroll"
                    style={{ backgroundColor: "var(--lightgray)" }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: "var(--red)" }}
                      animate={{ width: ["0%", "100%"] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <p className="text-sm font-mono" style={{ color: "var(--gray)" }}>
                    {exportProgress}%
                  </p>
                  <button
                    onClick={cancelExport}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer w-full"
                    style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
                  >
                    Cancel Export
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Audio Waveform Component ──────────────────────────────
function AudioWaveform({ waveformData, width, height }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData) return;
    const ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    const step = Math.ceil(waveformData.length / width);
    for (let i = 0; i < width; i++) {
      let min = 1.0,
        max = -1.0;
      for (let j = 0; j < step; j++) {
        const idx = i * step + j;
        if (idx < waveformData.length) {
          const v = waveformData[idx];
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
      const y1 = ((min + 1) / 2) * height,
        y2 = ((max + 1) / 2) * height;
      ctx.moveTo(i, y1);
      ctx.lineTo(i, y2);
    }
    ctx.strokeStyle = "#00ff00";
    ctx.stroke();
  }, [waveformData, width, height]);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}