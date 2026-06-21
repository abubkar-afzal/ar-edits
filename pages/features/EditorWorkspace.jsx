// components/EditorWorkspace.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { FaExpand, FaSignOutAlt, FaCamera, FaVideo, FaMusic, FaExchangeAlt, FaImages, FaFilm, FaCompress } from "react-icons/fa";
import PhotoEditor from "./PhotoEditor";
import VideoCombiner from "./VideoCombiner";
import AudioEditor from "./AudioEditor";
import VideoToAudioConverter from "./VideoToAudioConverter";
import PhotoCollageEditor from "./PhotoCollageEditor";
import VideoCollageEditor from "./VideoCollageEditor";
import MediaCompressor from "./MediaCompressor";

export default function EditorWorkspace({ type, onExit }) {
  const [error, setError] = useState(null);

  const requestFullscreen = () => {
    const el = document.fullscreenElement || document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch((e) => setError("Fullscreen denied. Please click the button."));
    }
  };

  const renderEditor = () => {
    switch (type) {
      case "photo": return <PhotoEditor />;
      case "video": return <VideoCombiner />;
      case "audio": return <AudioEditor />;
      case "video-to-audio": return <VideoToAudioConverter />;
      case "photo-collage": return <PhotoCollageEditor />;
      case "video-collage": return <VideoCollageEditor />;
      case "media-compressor": return <MediaCompressor />;
      default: return <div className="text-red-500 text-center mt-20">Unknown editor type: {type}</div>;
    }
  };

  const editorNames = {
    photo: "Photo Editor",
    video: "Video Combinor",
    audio: "Audio Editor",
    "video-to-audio": "Video to Audio Converter",
    "photo-collage": "Photo Collage",
    "video-collage": "Video Collage",
    "media-compressor": "Media Compressor",
  };

  const editorIcons = {
    photo: <FaCamera />,
    video: <FaVideo />,
    audio: <FaMusic />,
    "video-to-audio": <FaExchangeAlt />,
    "photo-collage": <FaImages />,
    "video-collage": <FaFilm />,
    "media-compressor": <FaCompress />,
  };

  return (
    <div
      className="relative w-full h-full flex flex-col"
      style={{ backgroundColor: "var(--white, #ffffff)" }}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-between items-center p-3 mm:p-4"
        style={{
          backgroundColor: "var(--lightgray, #f3f4f6)",
          borderBottom: "1px solid var(--darkgray, #374151)",
        }}
      >
        <h2
          className="text-lg mm:text-xl font-bold flex items-center gap-2"
          style={{ color: "var(--black, #111827)" }}
        >
          {editorIcons[type]} {editorNames[type] || "Editor"}
        </h2>
        <div className="flex gap-2 mm:gap-4">
          <motion.button
            onClick={requestFullscreen}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1.5 mm:px-4 mm:py-2 rounded-lg text-sm font-medium cursor-pointer flex items-center gap-1"
            style={{ backgroundColor: "var(--blue, #3b82f6)", color: "var(--white, #ffffff)" }}
          >
            <FaExpand /> Enter Fullscreen
          </motion.button>
          <motion.button
            onClick={onExit}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-1.5 mm:px-6 mm:py-2 rounded-lg font-bold cursor-pointer flex items-center gap-1"
            style={{ backgroundColor: "var(--red, #ef4444)", color: "var(--white, #ffffff)" }}
          >
            <FaSignOutAlt /> Exit Editor
          </motion.button>
        </div>
      </motion.div>

      <div className="flex-1 mt-14 mm:mt-16 overflow-auto p-2 mm:p-4">
        {error && (
          <div
            className="p-2 text-center rounded-lg mb-2"
            style={{ backgroundColor: "var(--red, #ef4444)", color: "var(--white, #ffffff)" }}
          >
            {error}
          </div>
        )}
        {renderEditor()}
      </div>
    </div>
  );
}