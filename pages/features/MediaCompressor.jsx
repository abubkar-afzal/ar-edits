"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { FaPlus, FaDownload, FaCompress, FaTrash, FaVideo, FaImage } from "react-icons/fa";
import { generateThumbnail, formatDuration } from "../../utils/generateThumbnail";

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function MediaCompressor() {
  const [files, setFiles] = useState([]);
  const [compressingAll, setCompressingAll] = useState(false);
  const fileInputRef = useRef(null);

  const allDone = files.length > 0 && files.every(f => f.status === 'done' || f.status === 'error');

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    const newFiles = [];

    for (const file of selectedFiles) {
      const id = generateId();
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith("video") ? "video" : "image";
      let thumbnail = null;

      if (type === "video") {
        try {
          thumbnail = await generateThumbnail(file);
        } catch (err) {
          console.warn("Thumbnail generation failed", err);
        }
      }

      newFiles.push({
        id,
        file,
        type,
        url,
        thumbnail,
        originalSize: file.size,
        compressedBlob: null,
        compressedSize: null,
        status: "pending",
        quality: 0.7,
        resolution: 1,
        progress: 0,
      });
    }

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const updateFileSetting = (id, key, value) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [key]: value } : f))
    );
  };

  const compressImage = (fileObj, onProgress) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        onProgress(50);
        const canvas = document.createElement("canvas");
        const scale = fileObj.resolution;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Canvas toBlob failed"));
            onProgress(100);
            resolve(blob);
          },
          "image/jpeg",
          fileObj.quality
        );
      };
      img.onerror = reject;
      img.src = fileObj.url;
    });
  };

  const compressVideo = (fileObj, onProgress) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.src = fileObj.url;
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      let finished = false;
      const clean = () => { finished = true; };
      video.addEventListener("error", () => { clean(); reject(new Error("Video load error")); });
      video.addEventListener("loadedmetadata", async () => {
        if (finished) return;
        const duration = video.duration;
        if (duration <= 0) { clean(); reject(new Error("Invalid video duration")); return; }
        const offscreen = document.createElement("canvas");
        const scale = fileObj.resolution;
        offscreen.width = video.videoWidth * scale;
        offscreen.height = video.videoHeight * scale;
        const canvasStream = offscreen.captureStream(30);
        let audioStream = null;
        try {
          const sourceStream = video.captureStream();
          const audioTracks = sourceStream.getAudioTracks();
          if (audioTracks.length > 0) audioStream = new MediaStream(audioTracks);
        } catch (e) {}
        const combinedStream = new MediaStream();
        canvasStream.getVideoTracks().forEach(t => combinedStream.addTrack(t));
        if (audioStream) audioStream.getAudioTracks().forEach(t => combinedStream.addTrack(t));
        const bitrate = Math.round(5000000 * fileObj.quality + 500000);
        const recorder = new MediaRecorder(combinedStream, {
          mimeType: "video/webm; codecs=vp9",
          videoBitsPerSecond: bitrate,
        });
        const chunks = [];
        recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
        recorder.onstop = () => {
          if (!finished) { clean(); resolve(new Blob(chunks, { type: "video/webm" })); }
        };
        video.currentTime = 0;
        try { await video.play(); } catch (err) { clean(); reject(err); return; }
        recorder.start();
        const startTime = performance.now() / 1000;
        const drawLoop = () => {
          if (finished) return;
          const elapsed = (performance.now() / 1000) - startTime;
          const progress = Math.min(100, (elapsed / duration) * 100);
          onProgress(progress);
          if (elapsed >= duration || video.ended) {
            recorder.stop();
            video.pause();
            return;
          }
          if (video.readyState >= 2) {
            const ctx = offscreen.getContext("2d");
            ctx.drawImage(video, 0, 0, offscreen.width, offscreen.height);
          }
          requestAnimationFrame(drawLoop);
        };
        requestAnimationFrame(drawLoop);
        setTimeout(() => {
          if (!finished && recorder.state === "recording") { recorder.stop(); video.pause(); }
        }, (duration + 3) * 1000);
      });
      video.load();
    });
  };

  const compressSingle = async (fileObj) => {
    if (fileObj.status === "compressing") return;
    updateFileSetting(fileObj.id, "status", "compressing");
    updateFileSetting(fileObj.id, "progress", 0);
    const onProgress = (p) => {
      setFiles((prev) => prev.map((f) => f.id === fileObj.id ? { ...f, progress: Math.round(p) } : f));
    };
    try {
      let blob;
      if (fileObj.type === "image") blob = await compressImage(fileObj, onProgress);
      else blob = await compressVideo(fileObj, onProgress);
      setFiles((prev) => prev.map((f) => f.id === fileObj.id ? { ...f, compressedBlob: blob, compressedSize: blob.size, status: "done", progress: 100 } : f));
    } catch (err) {
      console.error(err);
      setFiles((prev) => prev.map((f) => f.id === fileObj.id ? { ...f, status: "error", progress: 0 } : f));
    }
  };

  const compressAll = async () => {
    setCompressingAll(true);
    for (const fileObj of files) {
      if (fileObj.status === "pending" || fileObj.status === "error") await compressSingle(fileObj);
    }
    setCompressingAll(false);
  };

  const downloadFile = (fileObj) => {
    if (!fileObj.compressedBlob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(fileObj.compressedBlob);
    a.download = `compressed_${fileObj.file.name.replace(/\.[^/.]+$/, "")}.${fileObj.type === "image" ? "jpg" : "webm"}`;
    a.click();
  };

  const downloadAll = () => {
    files.forEach((f) => { if (f.status === "done") setTimeout(() => downloadFile(f), 100); });
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-4 overflow-auto" style={{ backgroundColor: "var(--white)", color: "var(--black)" }}>
      <h2 className="text-xl font-bold" style={{ color: "var(--blue)" }}>📦 Media Compressor</h2>
      <p className="text-sm" style={{ color: "var(--gray)" }}>
        Compress videos and images by adjusting quality/resolution. Works with bulk or single files.
      </p>

      <div className="flex gap-4 flex-wrap">
        <input type="file" accept="video/*,image/*" multiple onChange={handleFileSelect} ref={fileInputRef} id="media-upload" className="hidden" />
        <motion.label
          htmlFor="media-upload"
          className="file-upload-label"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaPlus /> Add Files
        </motion.label>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={compressAll}
          disabled={compressingAll || files.length === 0}
          className="px-4 py-2 rounded text-sm disabled:opacity-50 cursor-pointer"
          style={{ backgroundColor: "var(--yellow)", color: "var(--black)" }}
        >
          {compressingAll ? "Compressing…" : "Compress All"}
        </motion.button>
        {allDone && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadAll}
            className="px-4 py-2 rounded text-sm cursor-pointer"
            style={{ backgroundColor: "var(--green)", color: "var(--white)" }}
          >
            Download All
          </motion.button>
        )}
      </div>

      <div className="space-y-3">
        {files.map((fileObj) => (
          <div
            key={fileObj.id}
            className="p-3 rounded flex flex-col gap-2"
            style={{ backgroundColor: "var(--lightgray)" }}
          >
            <div className="flex items-center gap-3">
              {/* Thumbnail */}
              {fileObj.type === "video" && fileObj.thumbnail ? (
                <img
                  src={fileObj.thumbnail}
                  alt={fileObj.file.name}
                  className="w-16 h-10 object-cover rounded flex-shrink-0"
                />
              ) : fileObj.type === "video" ? (
                <div className="w-16 h-10 bg-black/30 rounded flex items-center justify-center text-xs flex-shrink-0">
                  🎬
                </div>
              ) : (
                <div className="w-16 h-10 bg-black/30 rounded flex items-center justify-center text-xs flex-shrink-0">
                  🖼️
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-medium" style={{ color: "var(--black)" }}>
                  {fileObj.file.name}
                </div>
                <div className="text-xs" style={{ color: "var(--gray)" }}>
                  {fileObj.type === "video" ? "🎬" : "🖼️"} {formatSize(fileObj.originalSize)}
                </div>
              </div>
            </div>

            <div className="flex gap-4 text-xs">
              <label className="flex items-center gap-1" style={{ color: "var(--black)" }}>
                Quality:
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={fileObj.quality}
                  onChange={(e) => updateFileSetting(fileObj.id, "quality", parseFloat(e.target.value))}
                  className="w-20"
                />
                <span>{Math.round(fileObj.quality * 100)}%</span>
              </label>
              <label className="flex items-center gap-1" style={{ color: "var(--black)" }}>
                Scale:
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={fileObj.resolution}
                  onChange={(e) => updateFileSetting(fileObj.id, "resolution", parseFloat(e.target.value))}
                  className="w-20"
                />
                <span>{Math.round(fileObj.resolution * 100)}%</span>
              </label>
            </div>

            {fileObj.status === "compressing" && (
              <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: "var(--gray)" }}>
                <div className="h-2 rounded-full transition-all duration-300" style={{ width: `${fileObj.progress}%`, backgroundColor: "var(--blue)" }} />
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs">
                {fileObj.status === "compressing" && `⏳ Compressing... ${fileObj.progress}%`}
                {fileObj.status === "done" && <span style={{ color: "var(--green)" }}>✅ Compressed: {formatSize(fileObj.compressedSize)} ({((fileObj.compressedSize / fileObj.originalSize) * 100).toFixed(0)}%)</span>}
                {fileObj.status === "error" && <span style={{ color: "var(--red)" }}>❌ Error – retry</span>}
                {fileObj.status === "pending" && "Pending"}
              </span>
              <div className="flex gap-2">
                {fileObj.status === "done" && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => downloadFile(fileObj)}
                    className="px-2 py-1 rounded text-xs cursor-pointer"
                    style={{ backgroundColor: "var(--green)", color: "var(--white)" }}
                  >
                    <FaDownload size={12} />
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => compressSingle(fileObj)}
                  disabled={fileObj.status === "compressing"}
                  className="px-2 py-1 rounded text-xs disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: "var(--gray)", color: "var(--white)" }}
                >
                  <FaCompress size={12} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFiles((prev) => prev.filter((f) => f.id !== fileObj.id))}
                  className="px-2 py-1 rounded text-xs cursor-pointer"
                  style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
                >
                  <FaTrash size={12} />
                </motion.button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}