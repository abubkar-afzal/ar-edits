// components/AudioEditor.jsx
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaMusic,
  FaPlay,
  FaStop,
  FaDownload,
  FaRedo,
  FaVolumeUp,
  FaFilter,
  FaArrowLeft,
} from 'react-icons/fa';

export default function AudioEditor() {
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [fileName, setFileName] = useState('');
  const [selection, setSelection] = useState([0, 1]);
  const [gain, setGain] = useState(1);
  const [filterFreq, setFilterFreq] = useState(1000);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioSrc, setAudioSrc] = useState(null);

  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = audioContextRef.current;
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    setAudioBuffer(decoded);
    setSelection([0, Math.min(10, decoded.duration)]);
    setAudioSrc(URL.createObjectURL(file));
    drawWaveform(decoded);
    setCurrentTime(0);
  };

  const drawWaveform = (buffer) => {
    const canvas = canvasRef.current;
    if (!canvas || !buffer) return;
    const ctx = canvas.getContext('2d');
    const data = buffer.getChannelData(0);
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'var(--lightgray)';
    ctx.fillRect(0, 0, width, height);

    ctx.beginPath();
    const step = Math.ceil(data.length / width);
    for (let i = 0; i < width; i++) {
      let min = 1.0,
        max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      const y1 = ((min + 1) / 2) * height;
      const y2 = ((max + 1) / 2) * height;
      ctx.moveTo(i, y1);
      ctx.lineTo(i, y2);
    }
    ctx.strokeStyle = 'var(--red)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const selStart = (selection[0] / buffer.duration) * width;
    const selEnd = (selection[1] / buffer.duration) * width;

    const gradient = ctx.createLinearGradient(selStart, 0, selEnd, 0);
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.15)');
    gradient.addColorStop(0.5, 'rgba(37, 99, 235, 0.25)');
    gradient.addColorStop(1, 'rgba(37, 99, 235, 0.15)');
    ctx.fillStyle = gradient;
    ctx.fillRect(selStart, 0, selEnd - selStart, height);

    ctx.strokeStyle = 'var(--red)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(selStart, 0);
    ctx.lineTo(selStart, height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(selEnd, 0);
    ctx.lineTo(selEnd, height);
    ctx.stroke();

    if (playing || currentTime > 0) {
      const playheadX = (currentTime / buffer.duration) * width;
      ctx.strokeStyle = 'var(--red)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
      ctx.fillStyle = 'var(--red)';
      ctx.beginPath();
      ctx.arc(playheadX, height / 2, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  useEffect(() => {
    if (audioBuffer) drawWaveform(audioBuffer);
  }, [selection, currentTime, playing]);

  const playSelection = () => {
    if (!audioBuffer || playing) return;
    const ctx = audioContextRef.current;
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    const gainNode = ctx.createGain();
    gainNode.gain.value = gain;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    source.connect(gainNode);
    gainNode.connect(filter);
    filter.connect(ctx.destination);

    const startTime = selection[0];
    const duration = selection[1] - selection[0];
    source.start(0, startTime, duration);
    sourceNodeRef.current = source;
    setPlaying(true);
    setCurrentTime(startTime);

    const startTimestamp = ctx.currentTime;
    const animate = () => {
      const elapsed = ctx.currentTime - startTimestamp;
      const newTime = startTime + elapsed;
      if (newTime <= selection[1]) {
        setCurrentTime(newTime);
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentTime(selection[1]);
        setPlaying(false);
      }
    };
    animationRef.current = requestAnimationFrame(animate);

    source.onended = () => {
      setPlaying(false);
      setCurrentTime(selection[1]);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  };

  const stopPlayback = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) {}
      sourceNodeRef.current = null;
    }
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setPlaying(false);
    setCurrentTime(selection[0]);
  };

  const resetSelection = () => {
    if (audioBuffer) {
      setSelection([0, audioBuffer.duration]);
      setCurrentTime(0);
    }
  };

  const handleCanvasClick = (e) => {
    if (!audioBuffer) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * canvas.width;
    const time = (x / canvas.width) * audioBuffer.duration;

    if (e.shiftKey) {
      setSelection([selection[0], Math.max(selection[0] + 0.1, time)]);
    } else {
      setSelection([Math.min(time, selection[1] - 0.1), selection[1]]);
    }
    stopPlayback();
  };

  const exportAudio = () => {
    if (!audioBuffer) return;
    const ctx = audioContextRef.current;
    const sampleRate = ctx.sampleRate;
    const duration = selection[1] - selection[0];
    const offlineCtx = new OfflineAudioContext(1, duration * sampleRate, sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    const gainNode = offlineCtx.createGain();
    gainNode.gain.value = gain;
    const filter = offlineCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    source.connect(gainNode);
    gainNode.connect(filter);
    filter.connect(offlineCtx.destination);
    source.start(0, selection[0], duration);
    offlineCtx.startRendering().then((renderedBuffer) => {
      const wav = audioBufferToWav(renderedBuffer);
      const blob = new Blob([wav], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited_${fileName || 'audio'}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }).catch((err) => {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    });
  };

  const audioBufferToWav = (buffer) => {
    const numChannels = 1;
    const sampleRate = buffer.sampleRate;
    const format = 1;
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const data = buffer.getChannelData(0);
    const dataLength = data.length * bytesPerSample;
    const headerLength = 44;
    const totalLength = headerLength + dataLength;
    const arrayBuffer = new ArrayBuffer(totalLength);
    const view = new DataView(arrayBuffer);
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
    };
    writeString(0, 'RIFF');
    view.setUint32(4, totalLength - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);
    let offset = 44;
    for (let i = 0; i < data.length; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
    return arrayBuffer;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "var(--white)", color: "var(--black)" }}
    >
      {/* ─── Header ──────────────────────────────────────── */}
      <div
        className="p-4 border-b flex items-center gap-3 flex-wrap"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
        >
          <FaMusic size={20} />
        </div>
        <h2 className="text-xl font-bold" style={{ color: "var(--black)" }}>
          Audio Editor
        </h2>
        <span className="text-xs ml-auto" style={{ color: "var(--gray)" }}>
          Trim, adjust gain, apply filter
        </span>
      </div>

      {/* ─── Content ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* File Upload */}
        <input
          type="file"
          accept="audio/*"
          onChange={handleFile}
          id="audio-upload"
          className="hidden"
        />

        {!audioBuffer ? (
          <motion.label
            htmlFor="audio-upload"
            className="flex flex-col items-center gap-4 p-8 rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-300 w-full max-w-md mx-auto"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--lightgray)" }}
            whileHover={{ scale: 1.02, borderColor: "var(--red)" }}
            whileTap={{ scale: 0.98 }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
            >
              <FaMusic size={28} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold mb-1" style={{ color: "var(--black)" }}>
                Upload Audio
              </h3>
              <p className="text-sm" style={{ color: "var(--gray)" }}>
                MP3, WAV, OGG, FLAC supported
              </p>
            </div>
          </motion.label>
        ) : (
          <>
            {/* File Info */}
            <div
              className="w-full max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl"
              style={{ backgroundColor: "var(--lightgray)" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
                >
                  <FaMusic size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--black)" }}>
                    {fileName}
                  </p>
                  <p className="text-xs" style={{ color: "var(--gray)" }}>
                    {formatTime(audioBuffer.duration)} • {audioBuffer.sampleRate}Hz • {audioBuffer.numberOfChannels}ch
                  </p>
                </div>
              </div>
              <motion.label
                htmlFor="audio-upload"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex-shrink-0"
                style={{ backgroundColor: "var(--white)", color: "var(--black)" }}
              >
                Change File
              </motion.label>
            </div>

            {/* Waveform Canvas */}
            <div className="w-full max-w-4xl mx-auto">
              <canvas
                ref={canvasRef}
                width={800}
                height={180}
                onClick={handleCanvasClick}
                className="w-full rounded-xl border-2 cursor-pointer"
                style={{ borderColor: "var(--red)", height: '180px' }}
              />
              <p className="text-xs text-center mt-1" style={{ color: "var(--gray)" }}>
                Click to set start • Shift+Click to set end
              </p>
            </div>

            {/* Time Display */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-mono">
              <span className="px-3 py-1 rounded-lg" style={{ backgroundColor: "var(--lightgray)" }}>
                Start: {formatTime(selection[0])}
              </span>
              <span style={{ color: "var(--gray)" }}>→</span>
              <span className="px-3 py-1 rounded-lg" style={{ backgroundColor: "var(--lightgray)" }}>
                End: {formatTime(selection[1])}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
              >
                {formatTime(selection[1] - selection[0])}
              </span>
            </div>

            {/* Selection Sliders */}
            <div className="flex flex-wrap gap-4 items-center justify-center">
              <label className="flex items-center gap-2 text-sm font-medium">
                Start
                <input
                  type="range"
                  min={0}
                  max={audioBuffer.duration}
                  step={0.01}
                  value={selection[0]}
                  onChange={(e) =>
                    setSelection([Math.min(+e.target.value, selection[1] - 0.1), selection[1]])
                  }
                  className="w-24"
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                End
                <input
                  type="range"
                  min={0}
                  max={audioBuffer.duration}
                  step={0.01}
                  value={selection[1]}
                  onChange={(e) =>
                    setSelection([selection[0], Math.max(+e.target.value, selection[0] + 0.1)])
                  }
                  className="w-24"
                />
              </label>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetSelection}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                style={{ backgroundColor: "var(--lightgray)", color: "var(--black)" }}
              >
                <FaRedo size={12} /> Reset
              </motion.button>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={playing ? stopPlayback : playSelection}
                className={`px-6 py-3 rounded-full font-bold text-sm cursor-pointer flex items-center gap-2 transition-all ${
                  playing ? 'animate-pulse' : ''
                }`}
                style={{
                  backgroundColor: "var(--red)",
                  color: "var(--white)",
                  boxShadow: playing
                    ? '0 0 20px rgba(239, 68, 68, 0.4)'
                    : '0 4px 12px rgba(239, 68, 68, 0.3)',
                }}
              >
                {playing ? (
                  <>
                    <FaStop size={14} /> Stop
                  </>
                ) : (
                  <>
                    <FaPlay size={14} /> Play Selection
                  </>
                )}
              </motion.button>
            </div>

            {/* Effects */}
            <div
              className="w-full max-w-lg mx-auto p-4 rounded-2xl space-y-3"
              style={{ backgroundColor: "var(--lightgray)" }}
            >
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--black)" }}>
                <FaFilter size={14} style={{ color: "var(--red)" }} /> Effects
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "var(--white)", color: "var(--red)" }}
                  >
                    <FaVolumeUp size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium" style={{ color: "var(--black)" }}>
                        Gain
                      </span>
                      <span style={{ color: "var(--gray)" }}>{gain.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={3}
                      step={0.1}
                      value={gain}
                      onChange={(e) => setGain(+e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "var(--white)", color: "var(--red)" }}
                  >
                    <FaFilter size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium" style={{ color: "var(--black)" }}>
                        Lowpass Filter
                      </span>
                      <span style={{ color: "var(--gray)" }}>{filterFreq} Hz</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={8000}
                      step={10}
                      value={filterFreq}
                      onChange={(e) => setFilterFreq(+e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Export Button */}
            <div className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportAudio}
                className="px-8 py-3.5 rounded-full font-bold text-sm cursor-pointer flex items-center gap-2 shadow-lg"
                style={{
                  background: "linear-gradient(135deg, var(--green), var(--red))",
                  color: "var(--white)",
                  boxShadow: "0 8px 24px rgba(34, 197, 94, 0.3)",
                }}
              >
                <FaDownload size={16} /> Export Selection
              </motion.button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}