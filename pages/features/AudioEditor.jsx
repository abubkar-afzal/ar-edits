// components/AudioEditor.jsx
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaMusic } from 'react-icons/fa';

export default function AudioEditor() {
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [selection, setSelection] = useState([0, 1]);
  const [gain, setGain] = useState(1);
  const [filterFreq, setFilterFreq] = useState(1000);
  const [playing, setPlaying] = useState(false);
  const [audioSrc, setAudioSrc] = useState(null); // for optional preview

  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = audioContextRef.current;
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    setAudioBuffer(decoded);
    setSelection([0, Math.min(10, decoded.duration)]);
    setAudioSrc(URL.createObjectURL(file)); // for <audio> preview if needed
    drawWaveform(decoded);
  };

  const drawWaveform = (buffer) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const data = buffer.getChannelData(0);
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    const step = Math.ceil(data.length / width);
    for (let i = 0; i < width; i++) {
      let min = 1.0, max = -1.0;
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
    ctx.strokeStyle = '#2563eb';
    ctx.stroke();

    // Draw selection highlight
    const selStart = (selection[0] / buffer.duration) * width;
    const selEnd = (selection[1] / buffer.duration) * width;
    ctx.fillStyle = 'rgba(37, 99, 235, 0.2)';
    ctx.fillRect(selStart, 0, selEnd - selStart, height);
  };

  // Play selection
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
    source.start(0, selection[0], selection[1] - selection[0]);
    sourceNodeRef.current = source;
    setPlaying(true);
    source.onended = () => setPlaying(false);
  };

  const stopPlayback = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) {}
      sourceNodeRef.current = null;
    }
    setPlaying(false);
  };

  const resetSelection = () => {
    if (audioBuffer) {
      setSelection([0, audioBuffer.duration]);
    }
  };

  const exportAudio = () => {
    if (!audioBuffer) return;
    const ctx = audioContextRef.current;
    const offlineCtx = new OfflineAudioContext(1, (selection[1] - selection[0]) * ctx.sampleRate, ctx.sampleRate);
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
    source.start(0, selection[0], selection[1] - selection[0]);
    offlineCtx.startRendering().then((renderedBuffer) => {
      const wav = audioBufferToWav(renderedBuffer);
      const blob = new Blob([wav], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'edited_audio.wav';
      a.click();
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

  const drawSelectionOnCanvas = () => {
    // Re‑draw waveform when selection changes
    if (audioBuffer) drawWaveform(audioBuffer);
  };
  useEffect(() => {
    drawSelectionOnCanvas();
  }, [selection]);

  return (
    <div className="p-6 flex flex-col items-center gap-4" style={{ backgroundColor: "var(--white)", color: "var(--black)" }}>
      <input type="file" accept="audio/*" onChange={handleFile} id="audio-upload" className="hidden" />
<motion.label
  htmlFor="audio-upload"
  className="file-upload-label"
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  <FaMusic /> Load Audio
</motion.label>

      {audioBuffer && (
        <>
          <canvas ref={canvasRef} width={800} height={200} className="border-2 rounded-xl w-full max-w-4xl" style={{ borderColor: "var(--blue)" }} />

          <div className="flex flex-wrap gap-4 items-center justify-center">
            <label style={{ color: "var(--black)" }}>Start (s):
              <input type="number" step={0.1} value={selection[0]} onChange={(e) => setSelection([+e.target.value, selection[1]])}
                className="p-1 rounded w-20" style={{ backgroundColor: "var(--lightgray)", color: "var(--black)" }} />
            </label>
            <label style={{ color: "var(--black)" }}>End (s):
              <input type="number" step={0.1} value={selection[1]} onChange={(e) => setSelection([selection[0], +e.target.value])}
                className="p-1 rounded w-20" style={{ backgroundColor: "var(--lightgray)", color: "var(--black)" }} />
            </label>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={resetSelection} className="px-3 py-1 rounded-lg cursor-pointer"
              style={{ backgroundColor: "var(--lightgray)", color: "var(--black)" }}>Reset Selection</motion.button>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={playSelection} disabled={playing} className="px-4 py-2 rounded-lg cursor-pointer"
              style={{ backgroundColor: "var(--blue)", color: "var(--white)" }}>▶ Play</motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={stopPlayback} disabled={!playing} className="px-4 py-2 rounded-lg cursor-pointer"
              style={{ backgroundColor: "var(--red)", color: "var(--white)" }}>⏹ Stop</motion.button>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <label style={{ color: "var(--black)" }}>Gain:
              <input type="range" min={0} max={2} step={0.1} value={gain} onChange={(e) => setGain(+e.target.value)} className="w-32" />
            </label>
            <label style={{ color: "var(--black)" }}>Lowpass (Hz):
              <input type="range" min={20} max={8000} step={1} value={filterFreq} onChange={(e) => setFilterFreq(+e.target.value)} className="w-32" />
            </label>
          </div>

          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={exportAudio} className="px-6 py-3 rounded-xl cursor-pointer"
            style={{ backgroundColor: "var(--green)", color: "var(--white)" }}>💾 Export Selection</motion.button>
        </>
      )}
    </div>
  );
}