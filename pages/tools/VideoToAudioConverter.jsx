// components/VideoToAudioConverter.jsx
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaVideo, FaMusic, FaPlay, FaStop, FaDownload, FaSpinner, FaCheck, FaTimes, FaExchangeAlt } from 'react-icons/fa';

export default function VideoToAudioConverter() {
  const [videoSrc, setVideoSrc] = useState(null);
  const [fileName, setFileName] = useState('');
  const [outputUrl, setOutputUrl] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [videoReady, setVideoReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  const videoRef = useRef(null);
  const recorderRef = useRef(null);
  const progressInterval = useRef(null);

  useEffect(() => {
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [videoSrc]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setFileName(file.name);
    setOutputUrl(null);
    setError(null);
    setProcessing(false);
    setVideoReady(false);
    setProgress(0);
  };

  const handleLoadedMetadata = () => {
    setVideoReady(true);
    setError(null);
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const startExtraction = async () => {
    const video = videoRef.current;
    if (!video || !videoReady) {
      setError('Video not ready. Please wait or re‑upload.');
      return;
    }

    if (!video.captureStream) {
      setError('Your browser does not support captureStream.');
      return;
    }

    setProcessing(true);
    setError(null);
    setOutputUrl(null);
    setProgress(0);

    try {
      const stream = video.captureStream();
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) {
        throw new Error('No audio track found in this video.');
      }

      const audioStream = new MediaStream([audioTrack]);
      const recorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm' });
      recorderRef.current = recorder;
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setOutputUrl(URL.createObjectURL(blob));
        setProcessing(false);
        setProgress(100);
        video.pause();
        recorderRef.current = null;
        if (progressInterval.current) clearInterval(progressInterval.current);
      };

      recorder.onerror = (err) => {
        setError('Recorder error: ' + err.message);
        setProcessing(false);
        video.pause();
        recorderRef.current = null;
        if (progressInterval.current) clearInterval(progressInterval.current);
      };

      recorder.start();
      video.currentTime = 0;
      video.play();

      // Track progress
      progressInterval.current = setInterval(() => {
        if (video.duration > 0) {
          const pct = Math.min(100, Math.round((video.currentTime / video.duration) * 100));
          setProgress(pct);
        }
      }, 200);

      const onEnded = () => {
        if (recorder.state === 'recording') recorder.stop();
        video.removeEventListener('ended', onEnded);
      };
      video.addEventListener('ended', onEnded);

      const onPause = () => {
        if (processing && recorder.state === 'recording') {
          recorder.stop();
        }
      };
      video.addEventListener('pause', onPause);

      const cleanup = () => {
        video.removeEventListener('ended', onEnded);
        video.removeEventListener('pause', onPause);
      };
      recorder.addEventListener('stop', cleanup, { once: true });
    } catch (err) {
      setError('Failed to start extraction: ' + err.message);
      setProcessing(false);
      if (progressInterval.current) clearInterval(progressInterval.current);
    }
  };

  const stopExtraction = () => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (progressInterval.current) clearInterval(progressInterval.current);
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: "var(--white)", color: "var(--black)" }}>
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--red)", color: "var(--white)" }}>
            <FaExchangeAlt size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "var(--black)" }}>Video to Audio</h2>
            <p className="text-xs" style={{ color: "var(--gray)" }}>Extract audio from any video file</p>
          </div>
        </div>
      </div>

      {/* ─── Content Area ──────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {!videoSrc ? (
          <div className="flex items-center justify-center h-full p-4">
            <motion.label htmlFor="video-to-audio"
              className="flex flex-col items-center gap-4 p-12 rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-300 w-full max-w-lg"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--lightgray)" }}
              whileHover={{ scale: 1.02, borderColor: "var(--red)" }} whileTap={{ scale: 0.98 }}>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "var(--red)", color: "var(--white)" }}>
                <FaVideo size={32} />
              </motion.div>
              <div className="text-center">
                <h3 className="text-lg font-bold mb-1" style={{ color: "var(--black)" }}>Select Video</h3>
                <p className="text-sm" style={{ color: "var(--gray)" }}>Click to choose a video file</p>
              </div>
            </motion.label>
            <input type="file" accept="video/*" onChange={handleFile} id="video-to-audio" className="hidden" />
          </div>
        ) : (
          <div className="p-4 space-y-4 max-w-2xl mx-auto">
            {/* Video Info Card */}
            <div className="p-4 rounded-2xl border" style={{ backgroundColor: "var(--lightgray)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--red)", color: "var(--white)" }}>
                  <FaVideo size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--black)" }}>{fileName}</p>
                  <p className="text-xs" style={{ color: "var(--gray)" }}>
                    {videoReady ? `Duration: ${formatTime(videoDuration)}` : 'Loading metadata...'}
                  </p>
                </div>
                <motion.label htmlFor="video-to-audio" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                  style={{ backgroundColor: "var(--white)", color: "var(--black)" }}>
                  Change
                </motion.label>
              </div>
            </div>

            {/* Progress Bar */}
            <AnimatePresence>
              {processing && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--lightgray)" }}>
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: "var(--red)" }}
                      initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                  </div>
                  <p className="text-xs text-center mt-1" style={{ color: "var(--gray)" }}>Extracting audio... {progress}%</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              {!processing && !outputUrl && (
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={startExtraction} disabled={!videoReady}
                  className="px-6 py-3 rounded-xl text-sm font-bold cursor-pointer flex items-center gap-2 shadow-lg disabled:opacity-50"
                  style={{ backgroundColor: "var(--red)", color: "var(--white)", boxShadow: "0 4px 16px rgba(239, 68, 68, 0.3)" }}>
                  <FaPlay size={14} /> Extract Audio
                </motion.button>
              )}
              {processing && (
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={stopExtraction}
                  className="px-6 py-3 rounded-xl text-sm font-bold cursor-pointer flex items-center gap-2"
                  style={{ backgroundColor: "var(--lightgray)", color: "var(--black)" }}>
                  <FaStop size={14} /> Stop Extraction
                </motion.button>
              )}
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-2xl flex items-center gap-3" style={{ backgroundColor: "var(--red)", color: "var(--white)" }}>
                  <FaTimes size={20} />
                  <p className="text-sm font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Output */}
            <AnimatePresence>
              {outputUrl && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                  className="p-5 rounded-2xl border space-y-3" style={{ backgroundColor: "var(--lightgray)", borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--green)", color: "var(--white)" }}>
                      <FaCheck size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: "var(--black)" }}>Extraction Complete</p>
                      <p className="text-xs" style={{ color: "var(--gray)" }}>Your audio is ready</p>
                    </div>
                  </div>
                  <audio controls src={outputUrl} className="w-full" style={{ borderRadius: "12px" }} />
                  <a href={outputUrl} download="extracted_audio.webm"
                    className="block w-full py-3 rounded-xl text-sm font-bold text-center cursor-pointer shadow-lg"
                    style={{ backgroundColor: "var(--red)", color: "var(--white)", boxShadow: "0 4px 16px rgba(239, 68, 68, 0.3)" }}>
                    <FaDownload size={14} className="inline mr-2" /> Download Audio (.webm)
                  </a>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hidden video element */}
            <video ref={videoRef} src={videoSrc} className="hidden" onLoadedMetadata={handleLoadedMetadata} controls={false} />
          </div>
        )}
      </div>
    </div>
  );
}