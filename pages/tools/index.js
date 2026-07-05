// pages/tools/index.js
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { motion } from "framer-motion";
import { useContext, useRef, useState } from "react";
import { AppContext } from "../_app";
import EditorWorkspace from "./EditorWorkspace";
import { tools } from "../../lib/tools";
import {
  FiCamera, FiVideo, FiMusic, FiSettings,
  FiGrid, FiDownload, FiArrowRight, FiZap,
  FiChevronRight,
} from "react-icons/fi";

const toolMeta = {
  photo: { icon: <FiCamera size={32} />, color: "var(--red)" },
  video: { icon: <FiVideo size={32} />, color: "var(--purple)" },
  audio: { icon: <FiMusic size={32} />, color: "var(--green)" },
  "video-to-audio": { icon: <FiSettings size={32} />, color: "var(--orange)" },
  "photo-collage": { icon: <FiGrid size={32} />, color: "var(--pink)" },
  "video-collage": { icon: <FiVideo size={32} />, color: "var(--cyan)" },
  "media-compressor": { icon: <FiDownload size={32} />, color: "var(--teal)" },
};

export default function Tools() {
  const { activeEditor, setActiveEditor } = useContext(AppContext);
  const editorContainerRef = useRef(null);
  const [hoveredTool, setHoveredTool] = useState(null);

  const launchEditor = (editorType) => {
    setActiveEditor(editorType);
    // Show the editor container
    if (editorContainerRef.current) {
      editorContainerRef.current.classList.remove("hidden");
    }
    // Request fullscreen
    document.documentElement.requestFullscreen().catch(console.warn);
  };

  const exitEditor = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setActiveEditor(null);
    if (editorContainerRef.current) {
      editorContainerRef.current.classList.add("hidden");
    }
  };

  return (
    <div style={{ backgroundColor: "var(--white)", minHeight: "100vh" }}>
      <Navbar />

      {/* Main content – hidden when editor is active */}
      <div className={activeEditor ? "hidden" : ""}>
        {/* Hero Header */}
        <section className="pt-28 pb-12 px-4" style={{ backgroundColor: "var(--lightgray)" }}>
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span
                className="text-sm font-semibold tracking-widest uppercase mb-3 block"
                style={{ color: "var(--red)" }}
              >
                Creative Suite
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "var(--black)" }}>
                All Tools
              </h1>
              <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: "var(--gray)" }}>
                Explore every free tool AR Edits offers. No signup, no limits — just powerful editing in your browser.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Tool Grid */}
        <section className="py-16 px-4" style={{ backgroundColor: "var(--white)" }}>
          <div className="max-w-7xl mx-auto">
            <div className="grid sm:grid-cols-1 t:grid-cols-2 l:grid-cols-3 gap-6">
              {tools.map((tool, idx) => {
                const meta = toolMeta[tool.editorType] || { icon: <FiSettings size={32} />, color: "var(--red)" };
                const isHovered = hoveredTool === tool.editorType;

                return (
                  <motion.div
                    key={tool.editorType}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => launchEditor(tool.editorType)}
                    onMouseEnter={() => setHoveredTool(tool.editorType)}
                    onMouseLeave={() => setHoveredTool(null)}
                    className="rounded-2xl p-6 cursor-pointer shadow-sm border transition-all duration-300 group relative overflow-hidden"
                    style={{
                      backgroundColor: "var(--white)",
                      borderColor: isHovered ? meta.color : "var(--border)",
                    }}
                  >
                    <div className="relative z-10">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-all duration-300"
                        style={{
                          backgroundColor: isHovered ? `${meta.color}20` : "var(--lightgray)",
                          color: meta.color,
                        }}
                      >
                        {meta.icon}
                      </div>
                      <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--black)" }}>
                        {tool.label}
                      </h3>
                      <p className="text-sm mb-5" style={{ color: "var(--gray)" }}>
                        {tool.desc}
                      </p>
                      <div
                        className="flex items-center gap-1 text-sm font-medium transition-all"
                        style={{ color: meta.color }}
                      >
                        Launch tool
                        <motion.span
                          animate={{ x: isHovered ? 4 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <FiChevronRight size={16} />
                        </motion.span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4" style={{ backgroundColor: "var(--lightgray)" }}>
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <FiZap size={36} className="mx-auto mb-4" style={{ color: "var(--red)" }} />
              <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: "var(--black)" }}>
                Ready to create?
              </h2>
              <p className="text-sm md:text-base mb-8 max-w-xl mx-auto" style={{ color: "var(--gray)" }}>
                Pick any tool above and start editing instantly. No downloads, no accounts, no hassle.
              </p>
              <div className="flex items-center justify-center w-full text-center">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="px-6 py-3 rounded-full text-sm font-semibold flex items-center gap-2 "
                style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
              >
                <FiArrowRight size={16} /> Explore Tools
              </motion.button>
            </div>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>

      {/* Full‑screen editor container – same as home page */}
      <div
        ref={editorContainerRef}
        className={`fixed inset-0 z-50 ${activeEditor ? "" : "hidden"}`}
        style={{ backgroundColor: "var(--white)", width: "100vw", height: "100vh" }}
      >
        {activeEditor && (
          <EditorWorkspace type={activeEditor} onExit={exitEditor} />
        )}
      </div>
    </div>
  );
}