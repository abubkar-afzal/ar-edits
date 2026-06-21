// lib/tools.js
import { 
  FaCamera, FaVideo, FaMusic, FaExchangeAlt, 
  FaImages, FaFilm, FaCompress 
} from "react-icons/fa";

export const tools = [
  { 
    label: "Photo Editor", 
    icon: <FaCamera />, 
    type: "photo", 
    desc: "Enhance, crop, and filter your images.", 
    path: "/features/photo-editor",
    editorType: "photo"
  },
  { 
    label: "Video Combinor", 
    icon: <FaVideo />, 
    type: "video", 
    desc: "Merge multiple clips seamlessly.", 
    path: "/features/video-combinor",
    editorType: "video"
  },
  { 
    label: "Audio Editor", 
    icon: <FaMusic />, 
    type: "audio", 
    desc: "Cut, filter, and adjust audio.", 
    path: "/features/audio-editor",
    editorType: "audio"
  },
  { 
    label: "Video to Audio", 
    icon: <FaExchangeAlt />, 
    type: "video-to-audio", 
    desc: "Extract audio from any video.", 
    path: "/features/video-to-audio",
    editorType: "video-to-audio"
  },
  { 
    label: "Photo Collage", 
    icon: <FaImages />, 
    type: "photo-collage", 
    desc: "Create stunning photo layouts.", 
    path: "/features/photo-collage",
    editorType: "photo-collage"
  },
  { 
    label: "Video Collage", 
    icon: <FaFilm />, 
    type: "video-collage", 
    desc: "Combine videos in one frame.", 
    path: "/features/video-collage",
    editorType: "video-collage"
  },
  { 
    label: "Media Compressor", 
    icon: <FaCompress />, 
    type: "media-compressor", 
    desc: "Reduce file size without quality loss.", 
    path: "/features/media-compressor",
    editorType: "media-compressor"
  },
];