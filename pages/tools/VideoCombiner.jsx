"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaVideo,
  FaMusic,
  FaPlay,
  FaPause,
  FaUndo,
  FaTrash,
  FaExchangeAlt,
  FaDownload,
  FaTimes,
  FaCheck,
} from "react-icons/fa";
import { generateThumbnail, formatDuration } from "@/utils/generateThumbnail";

const PIXELS_PER_SECOND = 150;
const PRELOAD_THRESHOLD = 0.5;
const generateId = () => Math.random().toString(36).substr(2, 9);

const ASPECT_RATIOS = {
  "1:1": { width: 1080, height: 1080 },
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  "4:5": { width: 1080, height: 1350 },
  "21:9": { width: 2560, height: 1080 },
};

export default function VideoCombiner() {
  const [sourceVideos, setSourceVideos] = useState([]);
  const [clips, setClips] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [projectDuration, setProjectDuration] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportETA, setExportETA] = useState(null);
  const [exportDone, setExportDone] = useState(false);
  const [exportBlob, setExportBlob] = useState(null);
  const [exportError, setExportError] = useState(null);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [selectedClipId, setSelectedClipId] = useState(null);
  const [isDraggingTransform, setIsDraggingTransform] = useState(false);
  const [dragType, setDragType] = useState(null);
  const [backgroundAudioClip, setBackgroundAudioClip] = useState(null);
  const [selectedBgAudioId, setSelectedBgAudioId] = useState(null);

  // --- mobile dropdown states (ADDED) ---
  const [showMobileLeft, setShowMobileLeft] = useState(false);
  const [showMobileRight, setShowMobileRight] = useState(false);
  const leftPanelRef = useRef(null);
  const rightPanelRef = useRef(null);

  // --- drag-to-adjust state for transform inputs ---
  const [isDraggingInput, setIsDraggingInput] = useState(false);
  const [dragInputKey, setDragInputKey] = useState(null);
  const [dragStartValue, setDragStartValue] = useState(0);
  const [dragStartPointerX, setDragStartPointerX] = useState(0);

  const { width: canvasW, height: canvasH } = ASPECT_RATIOS[aspectRatio];

  const videoElementsRef = useRef(new Map());
  const activeVideoRef = useRef(null);
  const nextVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const playStartTimeRef = useRef(0);
  const masterClockRef = useRef(0);
  const audioContextRef = useRef(null);
  const audioNodesRef = useRef(new Map());
  const ffmpegRef = useRef(null);
  const cancelledRef = useRef(false);
  const bgAudioRef = useRef(null); // plain <audio> element for background (simpler)
  const bgAudioReadyRef = useRef(false);

  const getSourceVideo = (id) => sourceVideos.find((v) => v.id === id);

  // ---- close mobile dropdowns on outside click (ADDED) ----
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (leftPanelRef.current && !leftPanelRef.current.contains(e.target)) {
        setShowMobileLeft(false);
      }
      if (rightPanelRef.current && !rightPanelRef.current.contains(e.target)) {
        setShowMobileRight(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ---- duration ----
  useEffect(() => {
    let max = 0;
    clips.forEach((clip) => {
      const end = clip.startTime + (clip.trimEnd - clip.trimStart);
      if (end > max) max = end;
    });
    setProjectDuration(max);
  }, [clips]);

  // ---- prevent scroll when exporting ----
  useEffect(() => {
    if (exporting) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [exporting]);

  // ---- transform helpers ----
  const getContainTransform = (sourceVideo) => {
    const vidW = sourceVideo.videoWidth || 640;
    const vidH = sourceVideo.videoHeight || 360;
    const scale = Math.min(canvasW / vidW, canvasH / vidH);
    const width = vidW * scale;
    const height = vidH * scale;
    const x = (canvasW - width) / 2;
    const y = (canvasH - height) / 2;
    return { x, y, width, height };
  };

  // ---- audio context ----
  const initAudioContext = () => {
    if (!audioContextRef.current) audioContextRef.current = new AudioContext();
  };

  const ensureAudioNodes = (video, sourceId) => {
    initAudioContext();
    if (audioNodesRef.current.has(sourceId)) return;
    try {
      const sourceNode = audioContextRef.current.createMediaElementSource(video);
      const gainNode = audioContextRef.current.createGain();
      sourceNode.connect(gainNode).connect(audioContextRef.current.destination);
      audioNodesRef.current.set(sourceId, { sourceNode, gainNode });
    } catch (e) {
      console.warn("Audio node error:", e);
    }
  };

  const setClipGain = (sourceId, muted) => {
    const nodes = audioNodesRef.current.get(sourceId);
    if (nodes) nodes.gainNode.gain.value = muted ? 0 : 1;
  };

  // ---- video elements ----
  const getVideoElement = (sourceVideoId) => {
    if (videoElementsRef.current.has(sourceVideoId))
      return videoElementsRef.current.get(sourceVideoId);
    const src = sourceVideos.find((v) => v.id === sourceVideoId)?.url;
    if (!src) return null;
    const video = document.createElement("video");
    video.src = src;
    video.preload = "auto";
    video.crossOrigin = "anonymous";
    video.playsInline = true;
    videoElementsRef.current.set(sourceVideoId, video);
    return video;
  };

  // ---- clip lookup ----
  const getActiveClip = (time) => {
    return (
      clips.find((clip) => {
        const clipDuration = clip.trimEnd - clip.trimStart;
        return time >= clip.startTime && time < clip.startTime + clipDuration;
      }) || null
    );
  };

  const getNextClip = (time) => {
    const sorted = [...clips].sort((a, b) => a.startTime - b.startTime);
    const active = getActiveClip(time);
    const idx = active ? sorted.indexOf(active) : -1;
    return idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;
  };

  // ---- playback control ----
  const stopPlayback = useCallback(() => {
    if (animationFrameRef.current)
      cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
    videoElementsRef.current.forEach((video) => video.pause());
    activeVideoRef.current = null;
    nextVideoRef.current = null;
    if (bgAudioRef.current) {
      bgAudioRef.current.pause();
      bgAudioRef.current = null;
      bgAudioReadyRef.current = false;
    }
    setIsPlaying(false);
  }, []);

  const startPlayback = useCallback(() => {
    if (clips.length === 0) return;
    initAudioContext();
    if (audioContextRef.current?.state === "suspended")
      audioContextRef.current.resume();

    const startTime = currentTime >= projectDuration ? 0 : currentTime;
    setCurrentTime(startTime);
    masterClockRef.current = startTime;
    playStartTimeRef.current = performance.now() / 1000;

    const activeClip = getActiveClip(startTime);
    if (activeClip) {
      const video = getVideoElement(activeClip.sourceVideoId);
      if (video) {
        ensureAudioNodes(video, activeClip.sourceVideoId);
        setClipGain(activeClip.sourceVideoId, activeClip.muted);
        video.currentTime =
          activeClip.trimStart + (startTime - activeClip.startTime);
        video.play();
        activeVideoRef.current = video;
      }
    }

    // ---- Start background audio ----
    if (backgroundAudioClip && !backgroundAudioClip.muted) {
      const bg = document.createElement("audio");
      bg.src = backgroundAudioClip.url;
      bg.crossOrigin = "anonymous";
      bg.preload = "auto";
      bg.volume = backgroundAudioClip.volume;

      // Compute offset and set currentTime
      const bgStartOffset = backgroundAudioClip.trimStart + (startTime - backgroundAudioClip.startTime);
      bg.currentTime = Math.max(0, Math.min(bgStartOffset, backgroundAudioClip.trimEnd - 0.01));

      // Wait until enough data is loaded before playing
      const playBg = () => {
        if (bg.readyState >= 2) {
          bg.play().catch(() => {});
          bgAudioReadyRef.current = true;
        } else {
          bg.addEventListener('canplay', () => {
            bg.play().catch(() => {});
            bgAudioReadyRef.current = true;
          }, { once: true });
        }
      };
      playBg();
      bgAudioRef.current = bg;
    }

    setIsPlaying(true);

    const animate = () => {
      const now = performance.now() / 1000;
      const elapsed = now - playStartTimeRef.current;
      const newTime = startTime + elapsed;
      masterClockRef.current = newTime;
      setCurrentTime(newTime);

      const currentActive = getActiveClip(newTime);
      const previousVideo = activeVideoRef.current;
      const nextClip = getNextClip(newTime);

      // Video switching logic (unchanged)
      if (nextClip && currentActive) {
        const clipEnd =
          currentActive.startTime +
          (currentActive.trimEnd - currentActive.trimStart);
        if (newTime > clipEnd - PRELOAD_THRESHOLD && !nextVideoRef.current) {
          const nextVideo = getVideoElement(nextClip.sourceVideoId);
          if (nextVideo) {
            ensureAudioNodes(nextVideo, nextClip.sourceVideoId);
            nextVideo.currentTime = nextClip.trimStart;
            nextVideoRef.current = nextVideo;
          }
        }
      }

      if (currentActive) {
        const newVideo = getVideoElement(currentActive.sourceVideoId);
        if (newVideo && newVideo !== previousVideo) {
          if (previousVideo) previousVideo.pause();
          ensureAudioNodes(newVideo, currentActive.sourceVideoId);
          setClipGain(currentActive.sourceVideoId, currentActive.muted);
          newVideo.currentTime =
            currentActive.trimStart + (newTime - currentActive.startTime);
          newVideo.play();
          activeVideoRef.current = newVideo;
          nextVideoRef.current = null;
        }
      } else {
        if (previousVideo) previousVideo.pause();
        activeVideoRef.current = null;
      }

      // Background audio time update
      if (bgAudioRef.current && backgroundAudioClip) {
        const bgStart = backgroundAudioClip.startTime;
        const bgEnd = bgStart + (backgroundAudioClip.trimEnd - backgroundAudioClip.trimStart);
        if (newTime < bgStart || newTime >= bgEnd) {
          bgAudioRef.current.pause();
          bgAudioRef.current = null;
          bgAudioReadyRef.current = false;
        } else {
          // Only update if the audio is ready and not paused due to buffering
          if (bgAudioReadyRef.current && !bgAudioRef.current.paused) {
            const targetTime = backgroundAudioClip.trimStart + (newTime - bgStart);
            // Avoid excessive seeking (only update if difference > 0.1s)
            if (Math.abs(bgAudioRef.current.currentTime - targetTime) > 0.05) {
              bgAudioRef.current.currentTime = targetTime;
            }
          }
        }
      }

      // Draw frame (unchanged)
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvasW, canvasH);
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvasW, canvasH);

        clips.forEach((clip) => {
          const video = getVideoElement(clip.sourceVideoId);
          if (video && video.readyState >= 2) {
            const t = clip.transform;
            const isActive = clip.id === currentActive?.id;
            if (isActive) {
              ctx.drawImage(video, t.x, t.y, t.width, t.height);
            }
          }
        });

        if (selectedClipId && currentActive?.id === selectedClipId) {
          const t = currentActive.transform;
          ctx.strokeStyle = "var(--red)";
          ctx.lineWidth = 2;
          ctx.strokeRect(t.x, t.y, t.width, t.height);
          const handleSize = 8;
          const corners = [
            [t.x, t.y],
            [t.x + t.width, t.y],
            [t.x, t.y + t.height],
            [t.x + t.width, t.y + t.height],
          ];
          ctx.fillStyle = "var(--red)";
          corners.forEach(([cx, cy]) => {
            ctx.fillRect(
              cx - handleSize / 2,
              cy - handleSize / 2,
              handleSize,
              handleSize,
            );
          });
        }
      }

      if (newTime >= projectDuration) {
        stopPlayback();
        return;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [
    currentTime,
    projectDuration,
    clips,
    canvasW,
    canvasH,
    stopPlayback,
    selectedClipId,
    backgroundAudioClip,
  ]);

  // ---- stop on aspect change ----
  useEffect(() => {
    stopPlayback();
  }, [aspectRatio, stopPlayback]);

  // ---- seek ----
  const seekToTime = useCallback(
    (time) => {
      const t = Math.max(0, Math.min(time, projectDuration));
      const wasPlaying = isPlaying;
      if (wasPlaying) stopPlayback();
      setCurrentTime(t);
      if (wasPlaying) setTimeout(() => startPlayback(), 0);
    },
    [isPlaying, projectDuration, stopPlayback, startPlayback],
  );

  // ---- import videos ----
  const handleImportVideo = async (e) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.src = url;
      video.preload = "metadata";
      await new Promise((resolve) => {
        video.onloadedmetadata = async () => {
          let thumbnail = null;
          try {
            thumbnail = await generateThumbnail(file);
          } catch (err) {}
          setSourceVideos((prev) => [
            ...prev,
            {
              id: generateId(),
              file,
              url,
              duration: video.duration,
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              thumbnail,
            },
          ]);
          resolve();
        };
      });
    }
  };

  // ---- add clip ----
  const addClipToTimeline = (sourceVideoId, trimStart, trimEnd) => {
    const src = getSourceVideo(sourceVideoId);
    if (!src) return;
    const transform = getContainTransform(src);
    const newClip = {
      id: generateId(),
      sourceVideoId,
      startTime: projectDuration,
      trimStart,
      trimEnd,
      muted: false,
      transform,
    };
    setClips((prev) => [...prev, newClip]);
  };

  // ---- clip drag ----
  const handleClipDrag = (clipId, newStartTime) => {
    setClips((prev) =>
      prev.map((c) =>
        c.id === clipId ? { ...c, startTime: Math.max(0, newStartTime) } : c,
      ),
    );
  };

  // ---- trim ----
  const handleTrimChange = (clipId, side, value) => {
    setClips((prev) =>
      prev.map((c) => {
        if (c.id !== clipId) return c;
        const source = getSourceVideo(c.sourceVideoId);
        if (!source) return c;
        if (side === "start") {
          const newTrim = Math.min(value, c.trimEnd - 0.1);
          return { ...c, trimStart: Math.max(0, newTrim) };
        } else {
          const newTrim = Math.max(value, c.trimStart + 0.1);
          return { ...c, trimEnd: Math.min(source.duration, newTrim) };
        }
      }),
    );
  };

  // ---- background audio ----
  const handleBackgroundAudioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const audio = document.createElement("audio");
    audio.src = url;
    await new Promise((resolve) => {
      audio.onloadedmetadata = () => {
        setBackgroundAudioClip({
          id: generateId(),
          file,
          url,
          startTime: 0,
          trimStart: 0,
          trimEnd: audio.duration,
          originalDuration: audio.duration,
          volume: 1,
          muted: false,
        });
        resolve();
      };
    });
  };

  // ---- mute ----
  const toggleMuteClip = (clipId, muted) => {
    setClips((prev) =>
      prev.map((c) => {
        if (c.id !== clipId) return c;
        setClipGain(c.sourceVideoId, muted);
        return { ...c, muted };
      }),
    );
  };

  // ---- transform ----
  const updateClipTransform = (clipId, newTransform) => {
    setClips((prev) =>
      prev.map((c) =>
        c.id === clipId ? { ...c, transform: newTransform } : c,
      ),
    );
  };

  // ---- transform control actions ----
  const deleteSelectedClip = () => {
    if (selectedClipId) {
      setClips((prev) => prev.filter((c) => c.id !== selectedClipId));
      setSelectedClipId(null);
    }
  };

  const toggleMuteSelectedClip = () => {
    if (selectedClipId) {
      const clip = clips.find((c) => c.id === selectedClipId);
      if (clip) toggleMuteClip(clip.id, !clip.muted);
    }
  };

  const replaceSelectedClip = () => {
    if (!selectedClipId) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.src = url;
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        const newSourceId = generateId();
        setSourceVideos((prev) => [
          ...prev,
          {
            id: newSourceId,
            file,
            url,
            duration: video.duration,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
          },
        ]);
        setClips((prev) =>
          prev.map((c) => {
            if (c.id !== selectedClipId) return c;
            const newTransform = getContainTransform({
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
            });
            return {
              ...c,
              sourceVideoId: newSourceId,
              trimStart: 0,
              trimEnd: video.duration,
              transform: newTransform,
            };
          }),
        );
      };
    };
    input.click();
  };

  const replaceBgAudio = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const audio = document.createElement("audio");
      audio.src = url;
      await new Promise((resolve) => {
        audio.onloadedmetadata = () => {
          setBackgroundAudioClip({
            id: generateId(),
            file,
            url,
            startTime: backgroundAudioClip?.startTime ?? 0,
            trimStart: 0,
            trimEnd: audio.duration,
            originalDuration: audio.duration,
            volume: 1,
            muted: false,
          });
          resolve();
        };
      });
    };
    input.click();
  };

  // ---- canvas interactions (updated to pointer events) ----
  const handleCanvasPointerDown = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasW / rect.width;
    const scaleY = canvasH / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check if click is on transform handles of selected clip
    if (selectedClipId) {
      const clip = clips.find((c) => c.id === selectedClipId);
      if (clip) {
        const t = clip.transform;
        const handleSize = 16; // larger for touch
        const corners = [
          [t.x, t.y],
          [t.x + t.width, t.y],
          [t.x, t.y + t.height],
          [t.x + t.width, t.y + t.height],
        ];
        for (let i = 0; i < corners.length; i++) {
          const [cx, cy] = corners[i];
          if (
            x >= cx - handleSize / 2 &&
            x <= cx + handleSize / 2 &&
            y >= cy - handleSize / 2 &&
            y <= cy + handleSize / 2
          ) {
            setIsDraggingTransform(true);
            setDragType(i);
            return;
          }
        }
      }
    }
    // Otherwise select clip or deselect
    // handled by click
  };

  const handleCanvasPointerMove = (e) => {
    e.preventDefault();
    if (!isDraggingTransform || selectedClipId === null) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasW / rect.width;
    const scaleY = canvasH / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const clip = clips.find((c) => c.id === selectedClipId);
    if (!clip) return;
    const t = clip.transform;
    const newTransform = { ...t };
    const minSize = 10;
    switch (dragType) {
      case 0: // top-left
        newTransform.x = Math.min(x, t.x + t.width - minSize);
        newTransform.y = Math.min(y, t.y + t.height - minSize);
        newTransform.width = t.x + t.width - newTransform.x;
        newTransform.height = t.y + t.height - newTransform.y;
        break;
      case 1: // top-right
        newTransform.y = Math.min(y, t.y + t.height - minSize);
        newTransform.height = t.y + t.height - newTransform.y;
        newTransform.width = Math.max(minSize, x - t.x);
        break;
      case 2: // bottom-left
        newTransform.x = Math.min(x, t.x + t.width - minSize);
        newTransform.width = t.x + t.width - newTransform.x;
        newTransform.height = Math.max(minSize, y - t.y);
        break;
      case 3: // bottom-right
        newTransform.width = Math.max(minSize, x - t.x);
        newTransform.height = Math.max(minSize, y - t.y);
        break;
      default:
        return;
    }
    if (newTransform.width > 0 && newTransform.height > 0) {
      updateClipTransform(selectedClipId, newTransform);
    }
  };

  const handleCanvasPointerUp = () => {
    setIsDraggingTransform(false);
    setDragType(null);
  };

  const handleCanvasClick = (e) => {
    // select clip based on click
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasW / rect.width;
    const scaleY = canvasH / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Find which clip is under the click (reverse order for topmost)
    const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime);
    let found = null;
    for (let i = sortedClips.length - 1; i >= 0; i--) {
      const clip = sortedClips[i];
      const t = clip.transform;
      if (x >= t.x && x <= t.x + t.width && y >= t.y && y <= t.y + t.height) {
        found = clip;
        break;
      }
    }
    if (found) {
      setSelectedClipId(found.id);
    } else {
      setSelectedClipId(null);
    }
  };

  // ---- drag-to-adjust inputs (updated to pointer events) ----
  useEffect(() => {
    if (!isDraggingInput) return;
    const onPointerMove = (e) => {
      const deltaX = e.clientX - dragStartPointerX;
      const newValue = Math.round(dragStartValue + deltaX * 0.5);
      const clip = clips.find((c) => c.id === selectedClipId);
      if (clip) {
        const newTransform = { ...clip.transform, [dragInputKey]: newValue };
        if (dragInputKey === 'width' || dragInputKey === 'height') {
          if (newTransform[dragInputKey] < 1) newTransform[dragInputKey] = 1;
        }
        updateClipTransform(selectedClipId, newTransform);
      }
    };
    const onPointerUp = () => {
      setIsDraggingInput(false);
      setDragInputKey(null);
    };
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    return () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };
  }, [isDraggingInput, dragStartPointerX, dragStartValue, dragInputKey, selectedClipId, clips, updateClipTransform]);

  // ---- EXPORT (client-side FFmpeg) ----
  const exportVideo = async () => {
    cancelledRef.current = false;
    setExporting(true);
    setExportProgress(0);
    setExportETA(null);
    setExportDone(false);
    setExportBlob(null);
    setExportError(null);

    if (!ffmpegRef.current) {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;
      try {
        await ffmpegRef.current.load();
      } catch (err) {
        setExportError("Failed to load FFmpeg: " + err.message);
        return;
      }
    }
    const ffmpeg = ffmpegRef.current;

    let logs = [];
    const logHandler = ({ message }) => {
      logs.push(message);
      if (logs.length > 50) logs.shift();
    };
    ffmpeg.on("log", logHandler);

    const startTime = performance.now();

    try {
      // 1. Write all source videos
      for (const src of sourceVideos) {
        if (cancelledRef.current) throw new Error("cancelled");
        await ffmpeg.writeFile(src.file.name, await fetchFile(src.url));
      }

      // 2. Sort clips by start time
      const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime);

      const targetW = ASPECT_RATIOS[aspectRatio].width;
      const targetH = ASPECT_RATIOS[aspectRatio].height;
      const TARGET_FPS = 30;

      const trimmedFiles = [];
      const totalClips = sortedClips.length;

      // Step 1: Trim and scale each clip (video + audio) with mute support
      for (let i = 0; i < totalClips; i++) {
        if (cancelledRef.current) throw new Error("cancelled");
        const clip = sortedClips[i];
        const src = getSourceVideo(clip.sourceVideoId);
        if (!src) continue;

        const inputName = src.file.name;
        const outputName = `trimmed_${i}.mp4`;

        const filterComplex =
          `[0:v]scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease,` +
          `pad=${targetW}:${targetH}:trunc((ow-iw)/2):trunc((oh-ih)/2),` +
          `setsar=1,` +
          `trim=start=${clip.trimStart}:end=${clip.trimEnd},` +
          `setpts=PTS-STARTPTS,` +
          `fps=${TARGET_FPS},` +
          `format=yuv420p[vout];` +
          `[0:a]atrim=start=${clip.trimStart}:end=${clip.trimEnd},` +
          `asetpts=PTS-STARTPTS` +
          (clip.muted ? `,volume=0` : ``) +
          `[aout]`;

        const trimCmd = [
          "-i", inputName,
          "-filter_complex", filterComplex,
          "-map", "[vout]",
          "-map", "[aout]",
          "-c:v", "libx264",
          "-preset", "ultrafast",
          "-pix_fmt", "yuv420p",
          "-r", String(TARGET_FPS),
          "-c:a", "aac",
          "-b:a", "128k",
          "-ac", "2",
          "-ar", "44100",
          outputName
        ];

        console.log(`Trimming clip ${i+1}/${totalClips}:`, trimCmd.join(" "));
        await ffmpeg.exec(trimCmd);

        trimmedFiles.push(outputName);

        const progress = Math.round((i + 1) / totalClips * 50);
        setExportProgress(progress);
        const elapsed = (performance.now() - startTime) / 1000;
        if (i > 0) {
          const avgTime = elapsed / (i + 1);
          const remaining = (totalClips - i - 1) * avgTime;
          setExportETA(Math.max(0, Math.round(remaining)));
        }
      }

      // 2. Concatenate trimmed clips using concat demuxer (video + audio)
      if (cancelledRef.current) throw new Error("cancelled");
      let concatList = "";
      for (const f of trimmedFiles) {
        concatList += `file '${f}'\n`;
      }
      await ffmpeg.writeFile("concat.txt", concatList);

      const concatCmd = [
        "-f", "concat",
        "-safe", "0",
        "-i", "concat.txt",
        "-c", "copy",
        "concatenated.mp4"
      ];
      console.log("Concatenating:", concatCmd.join(" "));
      await ffmpeg.exec(concatCmd);
      setExportProgress(70);
      setExportETA(null);

      // 3. Add background audio with trim, offset, and volume
      if (cancelledRef.current) throw new Error("cancelled");

      const finalCmd = ["-i", "concatenated.mp4"];

      if (backgroundAudioClip && !backgroundAudioClip.muted && !cancelledRef.current) {
        await ffmpeg.writeFile("bg_audio.mp3", await fetchFile(backgroundAudioClip.url));
        finalCmd.push("-i", "bg_audio.mp3");

        const startDelay = backgroundAudioClip.startTime || 0;
        const vol = backgroundAudioClip.volume ?? 1;

        const filterParts = [
          `[1:a]atrim=start=${backgroundAudioClip.trimStart}:end=${backgroundAudioClip.trimEnd},` +
          `asetpts=PTS-STARTPTS,` +
          `volume=${vol},` +
          `adelay=${startDelay * 1000}|${startDelay * 1000}[bga]`,
          `[0:a][bga]amix=inputs=2:duration=first:dropout_transition=2[aout]`
        ];

        finalCmd.push("-filter_complex", filterParts.join(';'));
        finalCmd.push("-map", "0:v");
        finalCmd.push("-map", "[aout]");
        finalCmd.push("-c:v", "copy");
        finalCmd.push("-c:a", "aac");
        finalCmd.push("-b:a", "128k");
      } else {
        // No background audio – just copy video and audio
        finalCmd.push("-c", "copy");
      }

      finalCmd.push("-movflags", "+faststart");
      finalCmd.push("output.mp4");

      console.log("Finalizing:", finalCmd.join(" "));
      await ffmpeg.exec(finalCmd);
      setExportProgress(90);

      if (cancelledRef.current) throw new Error("cancelled");

      // 4. Read final output
      const data = await ffmpeg.readFile("output.mp4");
      if (!data || data.length === 0) throw new Error("Output file is empty.");

      setExportBlob(new Blob([data], { type: "video/mp4" }));
      setExportProgress(100);
      setExportETA(0);
      setExportDone(true);
      setExportError(null);

    } catch (err) {
      console.error("Export error:", err);
      console.error("FFmpeg logs:", logs.join("\n"));

      let errorMsg = err.message || "Unknown error";
      if (errorMsg === "Unknown error" || errorMsg.includes("FFmpeg")) {
        const lastLogs = logs.slice(-10).join("\n");
        errorMsg = `FFmpeg error:\n${lastLogs || "No additional logs."}`;
      }

      if (err.message === "cancelled") {
        setExporting(false);
      } else {
        setExportError(`Export failed: ${errorMsg}`);
        setExportDone(true);
      }
    } finally {
      ffmpeg.off("log", logHandler);
    }
  };

  // ---- cancellation, download, close ----
  const cancelExport = () => {
    cancelledRef.current = true;
    if (ffmpegRef.current) {
      ffmpegRef.current.terminate();
      ffmpegRef.current = null;
    }
    setExporting(false);
  };

  const downloadVideo = () => {
    if (!exportBlob) return;
    const url = URL.createObjectURL(exportBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "combined-video.mp4";
    a.click();
  };

  const closeExportModal = () => {
    setExporting(false);
    setExportDone(false);
    setExportBlob(null);
    setExportError(null);
  };

  // ---- Render ----
  return (
  <div
    className="flex flex-col h-full overflow-hidden"
    style={{ backgroundColor: "var(--white)", color: "var(--black)" }}
  > <div className="sm:flex l:hidden items-center w-full justify-center my-2"><div
        className="w-10 h-10 rounded-xl mx-2 flex items-center justify-center"
        style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
      >
        <FaVideo size={20} />
      </div>
      <h2 className="text-xl font-bold" style={{ color: "var(--black)" }}>
        Video Combiner
      </h2>
      <span className="text-xs ml-auto mx-4" style={{ color: "var(--gray)" }}>
          Merge Multiple Videos
        </span>
      </div>
    {/* Header */}
    <div
      className="p-4 border-b flex items-center gap-3 flex-wrap justify-between"
      style={{ borderColor: "var(--border)" }}
    >
      {/* Mobile toggle: left panel (hidden on md+) */}
      <button
        className="l:hidden p-2 rounded-xl hover:bg-lightgray flex items-center"
        onClick={() => setShowMobileLeft(true)}
        style={{ color: "var(--black)" }}
      >
        <FaVideo size={20} className="mx-2"/>
        Import Video
      </button>

      <select
        value={aspectRatio}
        onChange={(e) => setAspectRatio(e.target.value)}
        className="px-3 py-2 rounded-xl text-sm font-semibold cursor-pointer border "
        style={{
          backgroundColor: "var(--white)",
          borderColor: "var(--border)",
          color: "var(--black)",
        }}
      >
        {Object.keys(ASPECT_RATIOS).map((key) => (
          <option key={key}>{key}</option>
        ))}
      </select>
<div className="sm:hidden l:flex flex-col items-center justify-center my-2">
  <div className="flex items-center">
  <div
        className="w-10 h-10 rounded-xl mx-2 flex items-center justify-center"
        style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
      >
        <FaVideo size={20} />
      </div>
      <h2 className="text-xl font-bold" style={{ color: "var(--black)" }}>
        Video Combiner
      </h2></div>
      <span className="text-xs mt-2" style={{ color: "var(--gray)" }}>
          Merge Multiple Videos
        </span>
        </div>
      {/* Mobile toggle: right panel (hidden on md+) */}
      <button
        className="l:hidden p-2 rounded-xl hover:bg-lightgray flex items-center"
        onClick={() => setShowMobileRight(true)}
        style={{ color: "var(--black)" }}
      >
        <FaMusic size={20} className="mx-2"/>
        Add Background Audio
      </button>

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={exportVideo}
        disabled={exporting || clips.length === 0}
        className="px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer flex items-center gap-2 shadow-lg disabled:opacity-50"
        style={{
          backgroundColor: "var(--red)",
          color: "var(--white)",
          boxShadow: "0 4px 16px rgba(239,68,68,0.3)",
        }}
      >
        <FaDownload size={14} /> Export
      </motion.button>
    </div>

    {/* Mobile drawer: left panel */}
    <>
      {/* Backdrop */}
      {showMobileLeft && (
        <div
          className="fixed inset-0 z-40 l:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowMobileLeft(false)}
        />
      )}
      <div
        ref={leftPanelRef}
        className={`fixed top-0 left-0 z-50 h-full w-64 overflow-y-auto transform transition-transform duration-300 ease-in-out l:hidden`}
        style={{
          backgroundColor: "var(--white)",
          transform: showMobileLeft ? "translateX(0)" : "translateX(-100%)",
          borderRight: "1px solid var(--border)",
        }}
      >
        <div className="p-4 flex justify-between items-center border-b" style={{ borderColor: "var(--border)" }}>
          <h3 className="font-bold">Source Videos</h3>
          <button
            onClick={() => setShowMobileLeft(false)}
            className="p-2 rounded-full hover:bg-lightgray"
            style={{ color: "var(--black)" }}
          >
            <FaTimes size={16} />
          </button>
        </div>
        <div className="p-3 space-y-2">
          <input
            type="file"
            accept="video/*"
            multiple
            onChange={handleImportVideo}
            className="hidden"
            id="video-import-mobile"
          />
          <motion.label
            htmlFor="video-import-mobile"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-2 w-full"
            style={{
              backgroundColor: "var(--lightgray)",
              color: "var(--black)",
            }}
          >
            <FaVideo size={12} /> Add Videos
          </motion.label>
          {sourceVideos.map((src) => (
            <SourceClip
              key={src.id}
              video={src}
              onAddToTimeline={addClipToTimeline}
            />
          ))}
        </div>
      </div>
    </>

    {/* Mobile drawer: right panel */}
    <>
      {showMobileRight && (
        <div
          className="fixed inset-0 z-40 l:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowMobileRight(false)}
        />
      )}
      <div
        ref={rightPanelRef}
        className={`fixed top-0 right-0 z-50 h-full w-64 overflow-y-auto transform transition-transform duration-300 ease-in-out l:hidden`}
        style={{
          backgroundColor: "var(--white)",
          transform: showMobileRight ? "translateX(0)" : "translateX(100%)",
          borderLeft: "1px solid var(--border)",
        }}
      >
        <div className="p-4 flex justify-between items-center border-b" style={{ borderColor: "var(--border)" }}>
          <h3 className="font-bold">Background Audio</h3>
          <button
            onClick={() => setShowMobileRight(false)}
            className="p-2 rounded-full hover:bg-lightgray"
            style={{ color: "var(--black)" }}
          >
            <FaTimes size={16} />
          </button>
        </div>
        <div className="p-3 space-y-2">
          <input
            type="file"
            accept="audio/*"
            onChange={handleBackgroundAudioUpload}
            className="hidden"
            id="bg-audio-import-mobile"
          />
          <motion.label
            htmlFor="bg-audio-import-mobile"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-2 w-full"
            style={{
              backgroundColor: "var(--lightgray)",
              color: "var(--black)",
            }}
          >
            <FaMusic size={12} /> Add Audio
          </motion.label>
          {backgroundAudioClip && (
            <div
              className="p-2 rounded-xl space-y-2"
              style={{ backgroundColor: "var(--lightgray)" }}
            >
              <div className="flex items-center justify-between">
                <span className="truncate text-[10px] font-medium flex-1 mr-1">
                  {backgroundAudioClip.file.name}
                </span>
                <button
                  onClick={() => setBackgroundAudioClip(prev => prev ? { ...prev, muted: !prev.muted } : null)}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold"
                  style={{ backgroundColor: backgroundAudioClip.muted ? "var(--red)" : "var(--green)", color: "var(--white)" }}
                >
                  {backgroundAudioClip.muted ? "Unmute" : "Mute"}
                </button>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <span className="w-8 text-[9px]">Start</span>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, backgroundAudioClip.trimEnd - 0.1)}
                    step={0.1}
                    value={backgroundAudioClip.trimStart}
                    onChange={(e) => setBackgroundAudioClip(prev => ({ ...prev, trimStart: parseFloat(e.target.value) }))}
                    className="flex-1 min-w-0"
                  />
                  <span className="text-[10px] w-10 text-right">
                    {backgroundAudioClip.trimStart.toFixed(1)}s
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-8 text-[9px]">End</span>
                  <input
                    type="range"
                    min={backgroundAudioClip.trimStart + 0.1}
                    max={backgroundAudioClip.originalDuration || backgroundAudioClip.trimEnd}
                    step={0.1}
                    value={backgroundAudioClip.trimEnd}
                    onChange={(e) => setBackgroundAudioClip(prev => ({ ...prev, trimEnd: parseFloat(e.target.value) }))}
                    className="flex-1 min-w-0"
                  />
                  <span className="text-[10px] w-10 text-right">
                    {backgroundAudioClip.trimEnd.toFixed(1)}s
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>

    {/* Main content area */}
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
      {/* Left Panel - visible on md and up */}
      <div
        className="sm:hidden l:block lg:w-56 p-3 border-r overflow-y-auto space-y-2"
        style={{ borderColor: "var(--border)" }}
      >
        <input
          type="file"
          accept="video/*"
          multiple
          onChange={handleImportVideo}
          className="hidden"
          id="video-import"
        />
        <motion.label
          htmlFor="video-import"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-2 w-full"
          style={{
            backgroundColor: "var(--lightgray)",
            color: "var(--black)",
          }}
        >
          <FaVideo size={12} /> Add Videos
        </motion.label>
        {sourceVideos.map((src) => (
          <SourceClip
            key={src.id}
            video={src}
            onAddToTimeline={addClipToTimeline}
          />
        ))}
      </div>

      {/* Center */}
      <div className="flex-1 flex flex-col p-3 min-h-0 overflow-y-scroll overscroll-x-hidden">
        {/* Canvas container */}
        <div
          className="flex-1 flex items-center justify-center rounded-2xl relative"
          style={{
            width: "100%",
            maxWidth: canvasW,
            aspectRatio: `${canvasW}/${canvasH}`,
            backgroundColor: "var(--black)",
            border: "2px solid var(--border)",
          }}
        >
          <canvas
            ref={canvasRef}
            width={canvasW}
            height={canvasH}
            className="max-w-full max-h-full touch-none"
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerLeave={handleCanvasPointerUp}
            onClick={handleCanvasClick}
          />
          {selectedClipId &&
            (() => {
              const clip = clips.find((c) => c.id === selectedClipId);
              if (!clip) return null;
              const t = clip.transform;
              return (
                <div
                  className="absolute border-2 pointer-events-none"
                  style={{
                    left: `${(t.x / canvasW) * 100}%`,
                    top: `${(t.y / canvasH) * 100}%`,
                    width: `${(t.width / canvasW) * 100}%`,
                    height: `${(t.height / canvasH) * 100}%`,
                    borderColor: "var(--red)",
                  }}
                >
                  <div
                    className="absolute -top-2 -left-2 w-4 h-4 rounded-full"
                    style={{ borderColor: "var(--red)" }}
                  />
                  <div
                    className="absolute -top-2 -right-2 w-4 h-4 rounded-full"
                    style={{ borderColor: "var(--red)" }}
                  />
                  <div
                    className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full"
                    style={{ borderColor: "var(--red)" }}
                  />
                  <div
                    className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full"
                    style={{ borderColor: "var(--red)" }}
                  />
                </div>
              );
            })()}
        </div>

        {/* Playback & Transform */}
        <div className="flex items-center gap-3 py-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isPlaying ? stopPlayback : startPlayback}
            className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer shadow-lg flex-shrink-0"
            style={{
              backgroundColor: isPlaying ? "var(--red)" : "var(--green)",
              color: "var(--white)",
            }}
          >
            {isPlaying ? <FaPause size={16} /> : <FaPlay size={16} />}
          </motion.button>
          <span
            className="text-xs font-mono font-bold flex-shrink-0"
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
              if (!isPlaying) seekToTime(t);
            }}
            className="flex-1 min-w-0"
          />
          <span
            className="text-xs font-mono font-bold flex-shrink-0"
            style={{ color: "var(--black)" }}
          >
            {projectDuration.toFixed(1)}s
          </span>
        </div>

        {/* Transform controls for video clips */}
        {selectedClipId && (
          <div
            className="flex flex-wrap gap-2 p-2 rounded-xl text-xs font-medium mb-2"
            style={{ backgroundColor: "var(--lightgray)" }}
          >
            {["X", "Y", "W", "H"].map((label, i) => {
              const key = ["x", "y", "width", "height"][i];
              const colors = [
                "var(--red)",
                "var(--orange)",
                "var(--yellow)",
                "var(--pink)",
              ];
              const clip = clips.find((c) => c.id === selectedClipId);
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
                    value={Math.round(clip?.transform[key] || 0)}
                    onChange={(e) => {
                      if (clip)
                        updateClipTransform(selectedClipId, {
                          ...clip.transform,
                          [key]: Number(e.target.value),
                        });
                    }}
                    onPointerDown={(e) => {
                      if (e.button !== 0) return;
                      e.preventDefault();
                      setIsDraggingInput(true);
                      setDragInputKey(key);
                      setDragStartValue(clip?.transform[key] || 0);
                      setDragStartPointerX(e.clientX);
                    }}
                    className="w-14 p-1 rounded text-xs font-semibold border cursor-ew-resize"
                    style={{
                      backgroundColor: "var(--white)",
                      color: "var(--black)",
                      borderColor: "var(--border)",
                    }}
                  />
                  <span
                    className="text-[10px]"
                    style={{ color: "var(--gray)" }}
                  >
                    px
                  </span>
                </label>
              );
            })}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const clip = clips.find((c) => c.id === selectedClipId);
                if (clip)
                  updateClipTransform(
                    selectedClipId,
                    getContainTransform(
                      getSourceVideo(clip.sourceVideoId) || {
                        videoWidth: 640,
                        videoHeight: 360,
                      },
                    ),
                  );
              }}
              className="px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
              style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
            >
              <FaUndo size={10} /> Reset
            </motion.button>
            <div className="flex gap-1 ml-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={deleteSelectedClip}
                className="px-2 py-1 rounded text-[10px] font-bold cursor-pointer flex items-center gap-1"
                style={{
                  backgroundColor: "var(--red)",
                  color: "var(--white)",
                }}
              >
                <FaTrash size={10} /> Delete
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={replaceSelectedClip}
                className="px-2 py-1 rounded text-[10px] font-bold cursor-pointer flex items-center gap-1"
                style={{
                  backgroundColor: "var(--blue)",
                  color: "var(--white)",
                }}
              >
                <FaExchangeAlt size={10} /> Replace
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleMuteSelectedClip}
                className="px-2 py-1 rounded text-[10px] font-bold cursor-pointer flex items-center gap-1"
                style={{
                  backgroundColor: clips.find((c) => c.id === selectedClipId)
                    ?.muted
                    ? "var(--red)"
                    : "var(--green)",
                  color: "var(--white)",
                }}
              >
                <FaMusic size={10} />{" "}
                {clips.find((c) => c.id === selectedClipId)?.muted
                  ? "Unmute"
                  : "Mute"}
              </motion.button>
            </div>
          </div>
        )}

        {/* Controls for selected background audio */}
        {selectedBgAudioId && backgroundAudioClip && (
          <div
            className="flex flex-wrap gap-2 p-2 rounded-xl text-xs font-medium mb-2"
            style={{ backgroundColor: "var(--lightgray)" }}
          >
            <label className="flex items-center gap-1">
              Volume
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={backgroundAudioClip.volume}
                onChange={(e) => setBackgroundAudioClip(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                className="w-20"
              />
              <span>{Math.round(backgroundAudioClip.volume * 100)}%</span>
            </label>
            <button
              onClick={() => setBackgroundAudioClip(prev => ({ ...prev, muted: !prev.muted }))}
              className="px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
              style={{ backgroundColor: backgroundAudioClip.muted ? "var(--red)" : "var(--green)", color: "var(--white)" }}
            >
              {backgroundAudioClip.muted ? "Unmute" : "Mute"}
            </button>
            <button
              onClick={() => { setBackgroundAudioClip(null); setSelectedBgAudioId(null); }}
              className="px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
              style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
            >
              <FaTrash size={10} /> Delete
            </button>
            <button
              onClick={replaceBgAudio}
              className="px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
              style={{ backgroundColor: "var(--blue)", color: "var(--white)" }}
            >
              <FaExchangeAlt size={10} /> Replace
            </button>
          </div>
        )}
      </div>

      {/* Right Panel - visible on md and up */}
      <div
        className="sm:hidden l:block lg:w-48 p-3 border-l overflow-y-auto space-y-2"
        style={{ borderColor: "var(--border)" }}
      >
        <input
          type="file"
          accept="audio/*"
          onChange={handleBackgroundAudioUpload}
          className="hidden"
          id="bg-audio-import"
        />
        <motion.label
          htmlFor="bg-audio-import"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-2 w-full"
          style={{
            backgroundColor: "var(--lightgray)",
            color: "var(--black)",
          }}
        >
          <FaMusic size={12} /> Add Audio
        </motion.label>

        {backgroundAudioClip && (
          <div
            className="p-2 rounded-xl space-y-2"
            style={{ backgroundColor: "var(--lightgray)" }}
          >
            <div className="flex items-center justify-between">
              <span className="truncate text-[10px] font-medium flex-1 mr-1">
                {backgroundAudioClip.file.name}
              </span>
              <button
                onClick={() => setBackgroundAudioClip(prev => prev ? { ...prev, muted: !prev.muted } : null)}
                className="px-2 py-0.5 rounded text-[10px] font-semibold"
                style={{ backgroundColor: backgroundAudioClip.muted ? "var(--red)" : "var(--green)", color: "var(--white)" }}
              >
                {backgroundAudioClip.muted ? "Unmute" : "Mute"}
              </button>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <span className="w-8 text-[9px]">Start</span>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, backgroundAudioClip.trimEnd - 0.1)}
                  step={0.1}
                  value={backgroundAudioClip.trimStart}
                  onChange={(e) => setBackgroundAudioClip(prev => ({ ...prev, trimStart: parseFloat(e.target.value) }))}
                  className="flex-1 min-w-0"
                />
                <span className="text-[10px] w-10 text-right">
                  {backgroundAudioClip.trimStart.toFixed(1)}s
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-8 text-[9px]">End</span>
                <input
                  type="range"
                  min={backgroundAudioClip.trimStart + 0.1}
                  max={backgroundAudioClip.originalDuration || backgroundAudioClip.trimEnd}
                  step={0.1}
                  value={backgroundAudioClip.trimEnd}
                  onChange={(e) => setBackgroundAudioClip(prev => ({ ...prev, trimEnd: parseFloat(e.target.value) }))}
                  className="flex-1 min-w-0"
                />
                <span className="text-[10px] w-10 text-right">
                  {backgroundAudioClip.trimEnd.toFixed(1)}s
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Timeline */}
    <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
      <div
        className="relative h-12 rounded-xl overflow-x-auto overflow-y-hidden"
        style={{ backgroundColor: "var(--lightgray)" }}
        onClick={(e) => {
          if (!e.target.closest("[data-clip]")) {
            const rect = e.currentTarget.getBoundingClientRect();
            seekToTime((e.clientX - rect.left) / PIXELS_PER_SECOND);
          }
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            width: Math.max(projectDuration * PIXELS_PER_SECOND + 200, 500),
          }}
        >
          {Array.from({ length: Math.ceil(projectDuration) + 1 }).map(
            (_, i) => (
              <div
                key={i}
                className="absolute top-0 h-full border-l text-[10px]"
                style={{
                  left: i * PIXELS_PER_SECOND,
                  borderColor: "var(--border)",
                  color: "var(--gray)",
                }}
              >
                <span className="ml-0.5">{i}s</span>
              </div>
            ),
          )}
          {/* Background audio first (behind video clips) */}
          {backgroundAudioClip && (
            <TimelineBgAudio
              clip={backgroundAudioClip}
              onDrag={(newStart) => setBackgroundAudioClip(prev => ({ ...prev, startTime: Math.max(0, newStart) }))}
              onTrimChange={(side, value) => {
                setBackgroundAudioClip(prev => {
                  if (side === 'start') return { ...prev, trimStart: Math.min(value, prev.trimEnd - 0.1) };
                  else return { ...prev, trimEnd: Math.max(value, prev.trimStart + 0.1) };
                });
              }}
              onMuteToggle={(muted) => setBackgroundAudioClip(prev => ({ ...prev, muted }))}
              pixelsPerSecond={PIXELS_PER_SECOND}
              isSelected={selectedBgAudioId === backgroundAudioClip.id}
              onSelect={() => setSelectedBgAudioId(backgroundAudioClip.id)}
            />
          )}
          {/* Video clips on top */}
          {clips.map((clip) => (
            <TimelineClip
              key={clip.id}
              clip={clip}
              sourceVideo={getSourceVideo(clip.sourceVideoId)}
              onDrag={handleClipDrag}
              onTrimChange={handleTrimChange}
              onMuteToggle={(muted) => toggleMuteClip(clip.id, muted)}
              pixelsPerSecond={PIXELS_PER_SECOND}
              isSelected={clip.id === selectedClipId}
              onSelect={() => setSelectedClipId(clip.id)}
            />
          ))}
        </div>
      </div>
    </div>

    {/* Export Modal */}
    <AnimatePresence>
      {exporting && (
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
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center space-y-4"
            style={{ backgroundColor: "var(--white)" }}
          >
            {exportError ? (
              <>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                  style={{
                    backgroundColor: "var(--red)",
                    color: "var(--white)",
                  }}
                >
                  <FaTimes size={24} />
                </div>
                <h3 className="text-lg font-bold">Export Failed</h3>
                <p className="text-sm" style={{ color: "var(--gray)" }}>
                  {exportError}
                </p>
                <button
                  onClick={closeExportModal}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer w-full"
                  style={{
                    backgroundColor: "var(--lightgray)",
                    color: "var(--black)",
                  }}
                >
                  Close
                </button>
              </>
            ) : !exportDone ? (
              <>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                  style={{
                    backgroundColor: "var(--red)",
                    color: "var(--white)",
                  }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <FaVideo size={24} />
                  </motion.div>
                </div>
                <h3 className="text-lg font-bold">Exporting Video</h3>
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
                <p
                  className="text-sm font-mono"
                  style={{ color: "var(--gray)" }}
                >
                  {exportProgress || 0}%
                </p>
                {exportETA > 0 && (
                  <p className="text-xs" style={{ color: "var(--gray)" }}>
                    ETA: {exportETA}s
                  </p>
                )}
                <button
                  onClick={cancelExport}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer w-full"
                  style={{
                    backgroundColor: "var(--red)",
                    color: "var(--white)",
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                  style={{
                    backgroundColor: "var(--green)",
                    color: "var(--white)",
                  }}
                >
                  <FaCheck size={24} />
                </div>
                <h3 className="text-lg font-bold">Export Complete</h3>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={downloadVideo}
                    className="px-5 py-3 rounded-xl text-sm font-bold cursor-pointer shadow-lg flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: "var(--red)",
                      color: "var(--white)",
                      boxShadow: "0 4px 16px rgba(239,68,68,0.3)",
                    }}
                  >
                    <FaDownload size={14} /> Download MP4
                  </button>
                  <button
                    onClick={closeExportModal}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                    style={{
                      backgroundColor: "var(--lightgray)",
                      color: "var(--black)",
                    }}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
}

// ─── SourceClip Sub Component ──────────────────────────────
function SourceClip({ video, onAddToTimeline }) {
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(video.duration);

  return (
    <div
      className="p-2 rounded-lg text-xs space-y-1.5"
      style={{ backgroundColor: "var(--black)", color: "var(--white)" }}
    >
      <div className="flex items-center gap-2">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt=""
            className="w-10 h-7 object-cover rounded flex-shrink-0"
          />
        ) : (
          <div
            className="w-10 h-7 rounded flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "var(--black)" }}
          >
            <FaVideo size={10} style={{ color: "var(--white)" }} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{video.file.name}</div>
          <div className="opacity-70">{formatDuration(video.duration)}</div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-8 text-[10px]">Start</span>
        <input
          type="range"
          min={0}
          max={video.duration}
          step={0.1}
          value={trimStart}
          onChange={(e) => setTrimStart(Number(e.target.value))}
          className="flex-1 w-12"
        />
        <span className="text-[10px] w-10 text-right">
          {trimStart.toFixed(1)}s
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-8 text-[10px]">End</span>
        <input
          type="range"
          min={0}
          max={video.duration}
          step={0.1}
          value={trimEnd}
          onChange={(e) => setTrimEnd(Number(e.target.value))}
          className="flex-1 w-12"
        />
        <span className="text-[10px] w-10 text-right">
          {trimEnd.toFixed(1)}s
        </span>
      </div>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onAddToTimeline(video.id, trimStart, trimEnd)}
        className="w-full py-1.5 rounded-lg text-[11px] font-bold cursor-pointer"
        style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
      >
        Add to Timeline
      </motion.button>
    </div>
  );
}

// ─── TimelineClip Sub Component ────────────────────────────
function TimelineClip({
  clip,
  sourceVideo,
  onDrag,
  onTrimChange,
  onMuteToggle,
  pixelsPerSecond,
  isSelected,
  onSelect,
}) {
  const width = Math.max(40, (clip.trimEnd - clip.trimStart) * pixelsPerSecond);
  const left = clip.startTime * pixelsPerSecond;

  const handlePointerDown = (e) => {
    e.preventDefault();
    onSelect();
    const dragStartX = e.clientX;
    const initialStartTime = clip.startTime;
    const onPointerMove = (e) => {
      const dx = e.clientX - dragStartX;
      onDrag(clip.id, Math.max(0, initialStartTime + dx / pixelsPerSecond));
    };
    const onPointerUp = () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
    };
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  };

  if (!sourceVideo) return null;

  return (
    <div
      data-clip="true"
      className="absolute top-4 h-6 rounded-lg flex items-center text-[10px] px-1.5 overflow-hidden cursor-grab active:cursor-grabbing"
      style={{
        left: `${left}px`,
        width: `${width}px`,
        backgroundColor: isSelected ? "var(--green)" : "var(--gray)",
        color: "var(--white)",
        minWidth: "40px",
        zIndex: 2,
        touchAction: "none",
      }}
      onPointerDown={handlePointerDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <div
        className="absolute left-0 top-0 h-full w-2 cursor-col-resize hover:bg-white/20"
        style={{
          backgroundColor: isSelected
            ? "rgba(255,255,255,0.3)"
            : "rgba(255,255,255,0.15)",
          touchAction: "none",
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          const startX = e.clientX;
          const initTrimStart = clip.trimStart;
          const onPointerMove = (e) => {
            const dx = e.clientX - startX;
            onTrimChange(
              clip.id,
              "start",
              initTrimStart + dx / pixelsPerSecond,
            );
          };
          const onPointerUp = () => {
            document.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("pointerup", onPointerUp);
          };
          document.addEventListener("pointermove", onPointerMove);
          document.addEventListener("pointerup", onPointerUp);
        }}
      />
      <div
        className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-white/20"
        style={{
          backgroundColor: isSelected
            ? "rgba(255,255,255,0.3)"
            : "rgba(255,255,255,0.15)",
          touchAction: "none",
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          const startX = e.clientX;
          const initTrimEnd = clip.trimEnd;
          const onPointerMove = (e) => {
            const dx = e.clientX - startX;
            onTrimChange(clip.id, "end", initTrimEnd + dx / pixelsPerSecond);
          };
          const onPointerUp = () => {
            document.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("pointerup", onPointerUp);
          };
          document.addEventListener("pointermove", onPointerMove);
          document.addEventListener("pointerup", onPointerUp);
        }}
      />
      <span className="truncate mx-2 flex-1">{sourceVideo.file.name}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMuteToggle(!clip.muted);
        }}
        className="px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer flex-shrink-0"
        style={{
          backgroundColor: clip.muted ? "var(--red)" : "var(--green)",
          color: "var(--white)",
        }}
      >
        {clip.muted ? "M" : "S"}
      </button>
    </div>
  );
}

// ─── TimelineBgAudio Sub Component ──────────────────────────
function TimelineBgAudio({
  clip,
  onDrag,
  onTrimChange,
  onMuteToggle,
  pixelsPerSecond,
  isSelected,
  onSelect,
}) {
  const width = Math.max(40, (clip.trimEnd - clip.trimStart) * pixelsPerSecond);
  const left = clip.startTime * pixelsPerSecond;

  const handlePointerDown = (e) => {
    e.preventDefault();
    onSelect();
    const dragStartX = e.clientX;
    const initialStartTime = clip.startTime;
    const onPointerMove = (e) => {
      const dx = e.clientX - dragStartX;
      onDrag(Math.max(0, initialStartTime + dx / pixelsPerSecond));
    };
    const onPointerUp = () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
    };
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  };

  return (
    <div
      data-clip="true"
      className="absolute top-0 h-6 rounded-lg flex items-center text-[10px] px-1.5 overflow-hidden cursor-grab active:cursor-grabbing"
      style={{
        left: `${left}px`,
        width: `${width}px`,
        backgroundColor: isSelected ? "var(--purple)" : "var(--pink)",
        color: "var(--white)",
        minWidth: "40px",
        zIndex: 1,
        touchAction: "none",
      }}
      onPointerDown={handlePointerDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <div
        className="absolute left-0 top-0 h-full w-2 cursor-col-resize hover:bg-white/20"
        style={{ backgroundColor: isSelected ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)", touchAction: "none" }}
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          const startX = e.clientX;
          const initTrimStart = clip.trimStart;
          const onPointerMove = (e) => {
            const dx = e.clientX - startX;
            onTrimChange("start", initTrimStart + dx / pixelsPerSecond);
          };
          const onPointerUp = () => {
            document.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("pointerup", onPointerUp);
          };
          document.addEventListener("pointermove", onPointerMove);
          document.addEventListener("pointerup", onPointerUp);
        }}
      />
      <div
        className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-white/20"
        style={{ backgroundColor: isSelected ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)", touchAction: "none" }}
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          const startX = e.clientX;
          const initTrimEnd = clip.trimEnd;
          const onPointerMove = (e) => {
            const dx = e.clientX - startX;
            onTrimChange("end", initTrimEnd + dx / pixelsPerSecond);
          };
          const onPointerUp = () => {
            document.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("pointerup", onPointerUp);
          };
          document.addEventListener("pointermove", onPointerMove);
          document.addEventListener("pointerup", onPointerUp);
        }}
      />
      <span className="truncate mx-2 flex-1">🎵 {clip.file.name}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMuteToggle(!clip.muted);
        }}
        className="px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer flex-shrink-0"
        style={{
          backgroundColor: clip.muted ? "var(--red)" : "var(--green)",
          color: "var(--white)",
        }}
      >
        {clip.muted ? "M" : "S"}
      </button>
    </div>
  );
}