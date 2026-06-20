// pages/index.js
import { useContext, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiVideo, FiCamera, FiMusic, FiSettings, FiArrowRight,
  FiUsers, FiAward, FiActivity, FiDownload, FiStar,
  FiGrid, FiChevronRight, FiSend, FiMessageCircle,
} from "react-icons/fi";
import { BiGame } from "react-icons/bi";
import { AppContext } from "./_app";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import Footer from "../components/Footer";
import EditorWorkspace from "../components/EditorWorkspace";
import { tools } from "../lib/tools";
import blogs from "../data/blogs.json";

const ThreeBackground = dynamic(() => import("../components/ThreeBackground"), { ssr: false });

// ─── Feedback modal ───────────────────────────────────────
function FeedbackModal({ isOpen, onClose }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = `Name: ${encodeURIComponent(name)}%0AEmail: ${encodeURIComponent(email)}%0AMessage: ${encodeURIComponent(message)}`;
    window.open(`https://wa.me/923270972423?text=${text}`, "_blank");
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl shadow-xl p-6 w-full max-w-md mx-4"
        style={{ backgroundColor: "var(--surface)", color: "var(--text)" }}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>Send Feedback</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg border"
            style={{
              backgroundColor: "var(--bg)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          />
          <input
            type="email"
            placeholder="Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg border"
            style={{
              backgroundColor: "var(--bg)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          />
          <textarea
            placeholder="Your Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            className="w-full px-4 py-2 rounded-lg border"
            style={{
              backgroundColor: "var(--bg)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          />
          <div className="flex gap-3 justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg flex items-center"
              style={{ color: "var(--text)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg flex items-center gap-2"
              style={{ backgroundColor: "var(--primary)", color: "#ffffff" }}
            >
              <FiSend /> Send via WhatsApp
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function Home() {
  const { activeEditor, setActiveEditor } = useContext(AppContext);
  const editorContainerRef = useRef(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const exitEditor = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setActiveEditor(null);
    if (editorContainerRef.current) editorContainerRef.current.classList.add("hidden");
  };

  const launchEditor = (type) => {
    setActiveEditor(type);
    if (editorContainerRef.current) editorContainerRef.current.classList.remove("hidden");
    document.documentElement.requestFullscreen().catch(() => {});
  };

  const latestBlogs = [...blogs]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  const featuredTools = tools.slice(0, 3);

  const toolIcons = {
    photo: <FiCamera size={28} />,
    video: <FiVideo size={28} />,
    audio: <FiMusic size={28} />,
    "video-to-audio": <FiSettings size={28} />,
    "photo-collage": <FiGrid size={28} />,
    "video-collage": <FiVideo size={28} />,
    "media-compressor": <FiDownload size={28} />,
  };

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <ThreeBackground />
      <Navbar />

      <div className={activeEditor ? "hidden" : ""}>
        <HeroSection />

        
        {/* ─── How It Works ────────────────────────────────── */}
        <section className="py-16 px-4" style={{ backgroundColor: "var(--bg)" }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: "var(--text)" }}>
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: "01", title: "Choose a Tool", desc: "Select from photo, video, audio, and more." },
                { step: "02", title: "Edit Online", desc: "Use our powerful browser‑based editors." },
                { step: "03", title: "Download", desc: "Export your work." },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  whileInView={{ opacity: 1, y: 0 }}
                  initial={{ opacity: 0, y: 30 }}
                  transition={{ delay: idx * 0.15 }}
                  viewport={{ once: true }}
                  className="text-center p-6"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: "var(--primary)", color: "#ffffff" }}
                  >
                    <span className="text-2xl font-bold">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--text)" }}>{item.title}</h3>
                  <p style={{ color: "var(--muted)" }}>{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Featured Tools ───────────────────────────────── */}
        <section className="py-16 px-4" style={{ backgroundColor: "var(--surface)" }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold" style={{ color: "var(--text)" }}>Featured Tools</h2>
              <Link href="/features">
                <span className="text-sm font-medium flex items-center gap-1" style={{ color: "var(--primary)" }}>
                  View all <FiArrowRight />
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTools.map((tool) => (
                <motion.div
                  key={tool.type}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => launchEditor(tool.type)}
                  className="rounded-2xl p-6 cursor-pointer shadow-lg border hover:shadow-xl transition-all duration-300"
                  style={{
                    backgroundColor: "var(--bg)",
                    borderColor: "var(--border)",
                  }}
                >
                  <div style={{ color: "var(--primary)" }} className="mb-3">
                    {toolIcons[tool.type] || <FiSettings size={28} />}
                  </div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--text)" }}>{tool.label}</h3>
                  <p className="text-sm" style={{ color: "var(--muted)" }}>{tool.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Testimonials ─────────────────────────────────── */}
        <section className="py-16 px-4" style={{ backgroundColor: "var(--bg)" }}>
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4" style={{ color: "var(--text)" }}>What Users Say</h2>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              {[
                { quote: "Incredible tools! I edited my entire video without any signup.", author: "Sarah K." },
                { quote: "The photo collage maker saved me hours. Highly recommended.", author: "James L." },
                { quote: "Audio editor is so simple yet powerful. Love it!", author: "Priya M." },
              ].map((t, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -5 }}
                  className="p-6 rounded-xl shadow"
                  style={{ backgroundColor: "var(--surface)", color: "var(--text)" }}
                >
                  <FiStar className="mx-auto mb-2" size={24} style={{ color: "#f59e0b" }} />
                  <p className="italic" style={{ color: "var(--text)" }}>“{t.quote}”</p>
                  <p className="text-sm font-semibold mt-3" style={{ color: "var(--text)" }}>— {t.author}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Games ────────────────────────────────────────── */}
        <section className="py-16 px-4" style={{ backgroundColor: "var(--surface)" }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold" style={{ color: "var(--text)" }}>Quick Break</h2>
              <Link href="/games">
                <span className="text-sm font-medium flex items-center gap-1" style={{ color: "var(--primary)" }}>
                  View all <FiArrowRight />
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Link href="/games/snake">
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="rounded-2xl p-6 cursor-pointer shadow-lg border hover:shadow-xl"
                  style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)" }}
                >
                  <BiGame style={{ color: "var(--primary)" }} size={40} />
                  <h3 className="text-xl font-semibold mt-3" style={{ color: "var(--text)" }}>3D Snake</h3>
                  <p className="text-sm" style={{ color: "var(--muted)" }}>Classic snake in 3D</p>
                </motion.div>
              </Link>
              <Link href="/games/chess">
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="rounded-2xl p-6 cursor-pointer shadow-lg border hover:shadow-xl"
                  style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)" }}
                >
                  <FiGrid style={{ color: "var(--primary)" }} size={40} />
                  <h3 className="text-xl font-semibold mt-3" style={{ color: "var(--text)" }}>3D Chess</h3>
                  <p className="text-sm" style={{ color: "var(--muted)" }}>Play chess in 3D</p>
                </motion.div>
              </Link>
            </div>
          </div>
        </section>

        {/* ─── Latest Blogs ─────────────────────────────────── */}
        <section className="py-16 px-4" style={{ backgroundColor: "var(--bg)" }}>
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold" style={{ color: "var(--text)" }}>Latest Articles</h2>
              <Link href="/blog">
                <span className="text-sm font-medium flex items-center gap-1" style={{ color: "var(--primary)" }}>
                  View all <FiArrowRight />
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestBlogs.map((post, idx) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className="rounded-2xl overflow-hidden border shadow-lg hover:shadow-xl transition-all"
                  style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
                >
                  <Link href={`/blog/${post.slug}`}>
                    <div className="cursor-pointer">
                      <img src={post.image} alt={post.title} className="w-full h-40 object-cover" />
                      <div className="p-4">
                        <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>{post.title}</h3>
                        <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>{post.excerpt}</p>
                        <span className="text-xs" style={{ color: "var(--muted)" }}>
                          {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Call to Action ───────────────────────────────── */}
        <section className="py-16 px-4" style={{ backgroundColor: "var(--white)" }}>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4" style={{ color: "var(--black)" }}>Ready to Create Something Great?</h2>
            <p className="mb-8 max-w-2xl mx-auto" style={{ color: "var(--black)" }}>
              All tools are free, no signup required. Start editing right now.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <button
                onClick={() => document.getElementById("hero-tools")?.scrollIntoView({ behavior: "smooth" })}
                className="px-6 py-3 rounded-full font-semibold flex items-center gap-2 cursor-pointer"
                style={{ backgroundColor: "var(--white)", color: "var(--black)" }}
              >
                <FiChevronRight /> Explore Tools
              </button>
              <button
                onClick={() => setFeedbackOpen(true)}
                className="px-6 py-3 rounded-full border-2 flex items-center gap-2 transition cursor-pointer"
                style={{ borderColor: "var(--black)", color: "var(--black)" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <FiMessageCircle /> Send Feedback
              </button>
            </div>
          </div>
        </section>

        <Footer />
      </div>

      {/* ─── Editor full‑screen ─────────────────────────────── */}
      <div
        ref={editorContainerRef}
        className={`fixed inset-0 z-50 ${activeEditor ? "" : "hidden"}`}
        style={{ backgroundColor: "var(--bg)", width: "100vw", height: "100vh" }}
      >
        {activeEditor && <EditorWorkspace type={activeEditor} onExit={exitEditor} />}
      </div>

      {/* Feedback modal */}
      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}