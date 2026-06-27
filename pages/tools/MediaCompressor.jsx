"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaDownload, FaCompress, FaTrash, FaVideo, FaImage, FaCloudUploadAlt, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function MediaCompressor() {
  const [files, setFiles] = useState([]);
  const [compressingAll, setCompressingAll] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const allDone = files.length > 0 && files.every(f => f.status === 'done' || f.status === 'error');
  const hasFiles = files.length > 0;

  const generateThumbnail = (file) => {
    return new Promise((resolve) => {
      if (file.type.startsWith("video")) {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.muted = true;
        video.playsInline = true;
        const url = URL.createObjectURL(file);
        video.src = url;
        video.onloadeddata = () => {
          video.currentTime = 1;
        };
        video.onseeked = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 160;
          canvas.height = 90;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
          URL.revokeObjectURL(url);
        };
        video.onerror = () => resolve(null);
        setTimeout(() => resolve(null), 3000);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      }
    });
  };

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    await addFiles(selectedFiles);
  };

  const addFiles = async (selectedFiles) => {
    const newFiles = [];
    for (const file of selectedFiles) {
      const id = generateId();
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith("video") ? "video" : "image";
      const thumbnail = await generateThumbnail(file);
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

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    const mediaFiles = droppedFiles.filter(f => f.type.startsWith("video") || f.type.startsWith("image"));
    if (mediaFiles.length > 0) {
      await addFiles(mediaFiles);
    }
  };

  const updateFileSetting = (id, key, value) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
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

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatSize = (bytes) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getReductionPercent = (original, compressed) => {
    if (!original || !compressed) return 0;
    return ((1 - compressed / original) * 100).toFixed(0);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ backgroundColor: "var(--white)", color: "var(--black)" }}>
      {/* ─── Header ────────────────────────────────────────── */}
      <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--red)", color: "var(--white)" }}>
            <FaCompress size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "var(--black)" }}>Media Compressor</h2>
            <p className="text-xs" style={{ color: "var(--gray)" }}>Reduce file sizes without losing quality</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <input type="file" accept="video/*,image/*" multiple onChange={handleFileSelect} ref={fileInputRef} id="media-upload" className="hidden" />
          <motion.label
            htmlFor="media-upload"
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer flex items-center gap-2"
            style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
          >
            <FaPlus size={14} /> Add Files
          </motion.label>
          
          {hasFiles && (
            <>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={compressAll}
                disabled={compressingAll}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer flex items-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: "var(--blue)", color: "var(--white)" }}
              >
                <FaCompress size={14} /> {compressingAll ? "Compressing..." : "Compress All"}
              </motion.button>
              
              {allDone && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={downloadAll}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer flex items-center gap-2"
                  style={{ backgroundColor: "var(--green)", color: "var(--white)" }}
                >
                  <FaDownload size={14} /> Download All
                </motion.button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ─── Content Area ──────────────────────────────────── */}
      <div className="flex-1 p-4 overflow-y-auto">
        {!hasFiles ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center gap-4 p-12 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer h-full min-h-[300px] ${
              isDragging ? 'scale-[1.02]' : ''
            }`}
            style={{
              borderColor: isDragging ? "var(--red)" : "var(--border)",
              backgroundColor: isDragging ? "rgba(20, 184, 166, 0.05)" : "var(--lightgray)",
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-24 h-24 rounded-3xl flex items-center justify-center"
              style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
            >
              <FaCloudUploadAlt size={40} />
            </motion.div>
            <div className="text-center">
              <h3 className="text-lg font-bold mb-1" style={{ color: "var(--black)" }}>
                {isDragging ? "Drop Files Here" : "Drag & Drop Files"}
              </h3>
              <p className="text-sm" style={{ color: "var(--gray)" }}>
                or click to browse • Video & Images supported
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {files.map((fileObj, idx) => (
              <motion.div
                key={fileObj.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 rounded-2xl border transition-all duration-300"
                style={{
                  backgroundColor: "var(--white)",
                  borderColor: fileObj.status === 'done' ? "var(--green)" : fileObj.status === 'error' ? "var(--red)" : "var(--border)",
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className="w-24 h-16 rounded-xl overflow-hidden flex-shrink-0 relative" style={{ backgroundColor: "var(--lightgray)" }}>
                    {fileObj.thumbnail ? (
                      <img src={fileObj.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--gray)" }}>
                        {fileObj.type === "video" ? <FaVideo size={24} /> : <FaImage size={24} />}
                      </div>
                    )}
                    {fileObj.status === "compressing" && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                        <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--black)" }}>
                          {fileObj.file.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--gray)" }}>
                          {fileObj.type === "video" ? "🎬 Video" : "🖼️ Image"} • {formatSize(fileObj.originalSize)}
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => removeFile(fileObj.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer"
                        style={{ backgroundColor: "var(--lightgray)", color: "var(--gray)" }}
                      >
                        <FaTrash size={12} />
                      </motion.button>
                    </div>

                    {/* Status */}
                    {fileObj.status === "compressing" && (
                      <div className="mt-2">
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--lightgray)" }}>
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: "var(--red)" }}
                            initial={{ width: 0 }}
                            animate={{ width: `${fileObj.progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <p className="text-xs mt-1" style={{ color: "var(--red)" }}>Compressing... {fileObj.progress}%</p>
                      </div>
                    )}

                    {fileObj.status === "done" && (
                      <div className="flex items-center gap-2 mt-2">
                        <FaCheckCircle size={14} style={{ color: "var(--green)" }} />
                        <span className="text-xs font-medium" style={{ color: "var(--green)" }}>
                          {formatSize(fileObj.compressedSize)} • Saved {getReductionPercent(fileObj.originalSize, fileObj.compressedSize)}%
                        </span>
                      </div>
                    )}

                    {fileObj.status === "error" && (
                      <div className="flex items-center gap-2 mt-2">
                        <FaExclamationTriangle size={14} style={{ color: "var(--red)" }} />
                        <span className="text-xs" style={{ color: "var(--red)" }}>Failed – try again</span>
                      </div>
                    )}

                    {/* Settings */}
                    <div className="flex flex-wrap gap-3 mt-3">
                      <label className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--black)" }}>
                        Quality
                        <input
                          type="range" min="0.1" max="1" step="0.05"
                          value={fileObj.quality}
                          onChange={(e) => updateFileSetting(fileObj.id, "quality", parseFloat(e.target.value))}
                          className="w-16"
                        />
                        <span style={{ color: "var(--gray)" }}>{Math.round(fileObj.quality * 100)}%</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--black)" }}>
                        Scale
                        <input
                          type="range" min="0.1" max="1" step="0.05"
                          value={fileObj.resolution}
                          onChange={(e) => updateFileSetting(fileObj.id, "resolution", parseFloat(e.target.value))}
                          className="w-16"
                        />
                        <span style={{ color: "var(--gray)" }}>{Math.round(fileObj.resolution * 100)}%</span>
                      </label>

                      <div className="flex gap-1.5 ml-auto">
                        {fileObj.status === "done" && (
                          <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => downloadFile(fileObj)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                            style={{ backgroundColor: "var(--green)", color: "var(--white)" }}
                          >
                            <FaDownload size={11} /> Save
                          </motion.button>
                        )}
                        {fileObj.status !== "compressing" && (
                          <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => compressSingle(fileObj)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                            style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
                          >
                            <FaCompress size={11} /> Compress
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}