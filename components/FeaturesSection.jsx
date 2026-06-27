// components/ToolsSection.jsx
import { useContext } from "react";
import { motion } from "framer-motion";
import { AppContext } from "../pages/_app";
import {
  FaCamera,
  FaVideo,
  FaMusic,
  FaExchangeAlt,
  FaImages,
  FaFilm,
  FaCompress,
} from "react-icons/fa";

const tools = [
  { label: "Photo Editor", icon: <FaCamera />, type: "photo", desc: "Enhance, crop, and filter your images." },
  { label: "Video Combinor", icon: <FaVideo />, type: "video", desc: "Merge multiple clips seamlessly." },
  { label: "Audio Editor", icon: <FaMusic />, type: "audio", desc: "Cut, filter, and adjust audio." },
  { label: "Video to Audio", icon: <FaExchangeAlt />, type: "video-to-audio", desc: "Extract audio from any video." },
  { label: "Photo Collage", icon: <FaImages />, type: "photo-collage", desc: "Create stunning photo layouts." },
  { label: "Video Collage", icon: <FaFilm />, type: "video-collage", desc: "Combine videos in one frame." },
  { label: "Media Compressor", icon: <FaCompress />, type: "media-compressor", desc: "Reduce file size without quality loss." },
];

export default function ToolsSection() {
  const { setActiveEditor } = useContext(AppContext);

  const launchEditor = (type) => {
    setActiveEditor(type);
    document.documentElement.requestFullscreen().catch((err) => {
      console.warn("Auto fullscreen failed – use the button inside the editor.", err);
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <section
      id="tools"
      className="py-16 px-4"
      style={{ backgroundColor: "var(--lightgray)" }}
    >
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl mm:text-4xl font-bold text-center mb-4"
          style={{ color: "var(--black)" }}
        >
          All Tools at Your Fingertips
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12 max-w-2xl mx-auto"
          style={{ color: "var(--gray)" }}
        >
          Click any tool to launch the full‑screen editor. Each tool is packed with features to bring your creative vision to life.
        </motion.p>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {tools.map((tool) => (
            <motion.div
              key={tool.type}
              variants={itemVariants}
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => launchEditor(tool.type)}
              className="rounded-2xl p-6 cursor-pointer shadow-lg transition-all duration-300 border hover:shadow-xl"
              style={{
                backgroundColor: "var(--white)",
                borderColor: "var(--border)",
                color: "var(--black)",
              }}
            >
              <div
                className="text-4xl mb-3"
                style={{ color: tool.type === "video-to-audio" ? "var(--yellow)" : "var(--red" }}
              >
                {tool.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{tool.label}</h3>
              <p className="text-sm" style={{ color: "var(--gray)" }}>{tool.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}