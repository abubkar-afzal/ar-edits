// components/EditorWorkspace.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaExpand,
  FaCompress,
  FaSignOutAlt,
  FaCamera,
  FaVideo,
  FaMusic,
  FaExchangeAlt,
  FaImages,
  FaFilm,
  FaCompress as FaCompressIcon,
} from "react-icons/fa";
import PhotoEditor from "./PhotoEditor";
import VideoCombiner from "./VideoCombiner";
import AudioEditor from "./AudioEditor";
import VideoToAudioConverter from "./VideoToAudioConverter";
import PhotoCollageEditor from "./PhotoCollageEditor";
import VideoCollageEditor from "./VideoCollageEditor";
import MediaCompressor from "./MediaCompressor";

export default function EditorWorkspace({ type, onExit }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      const el = document.documentElement;
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
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

  const editorIcons = {
    photo: <FaCamera />,
    video: <FaVideo />,
    audio: <FaMusic />,
    "video-to-audio": <FaExchangeAlt />,
    "photo-collage": <FaImages />,
    "video-collage": <FaFilm />,
    "media-compressor": <FaCompressIcon />,
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
        

        <div className="flex flex-row gap-2 mm:gap-4 items-center justify-between w-full">
          <motion.button
            onClick={toggleFullscreen}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1.5 mm:px-4 mm:py-2 rounded-lg text-sm font-medium cursor-pointer flex items-center gap-1"
            style={{ backgroundColor: "var(--red, #3b82f6)", color: "var(--white, #ffffff)" }}
          >
            {isFullscreen ? (
              <>
                <FaCompress /> Exit Fullscreen
              </>
            ) : (
              <>
                <FaExpand /> Enter Fullscreen
              </>
            )}
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

      {renderEditor()}
    </div>
  );
}