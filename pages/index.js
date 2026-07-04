// pages/index.js
import { useContext, useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  FiVideo, FiCamera, FiMusic, FiSettings, FiArrowRight, FiArrowUp,
  FiUsers, FiAward, FiActivity, FiDownload, FiStar,
  FiGrid, FiChevronRight, FiSend, FiMessageCircle,
  FiZap, FiShield, FiLayers, FiCommand, FiMousePointer, FiCpu,
  FiPlay, FiHeart, FiGlobe, FiClock, FiTrendingUp,
} from "react-icons/fi";
import { BiGame, BiBrain } from "react-icons/bi";
import { AppContext } from "./_app";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import Footer from "../components/Footer";
import EditorWorkspace from "./tools/EditorWorkspace";
import { tools } from "../lib/tools";
import blogs from "../data/blogs.json";

const ThreeBackground = dynamic(() => import("../components/ThreeBackground"), { ssr: false });

// ═══════════════════════════════════════════════════════════
// Scroll to Top Button
// ═══════════════════════════════════════════════════════════
function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-xl cursor-pointer"
          style={{ backgroundColor: "var(--red)", boxShadow: "0 8px 24px rgba(37, 99, 235, 0.3)" }}
          whileHover={{ scale: 1.1, rotate: 360 }}
          whileTap={{ scale: 0.9 }}
          transition={{ rotate: { duration: 0.5 } }}
        >
          <FiArrowUp size={20} style={{ color: "var(--white)" }} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════
// Animated Counter (Ease-out cubic)
// ═══════════════════════════════════════════════════════════
function AnimatedCounter({ end, suffix = "", decimals = false }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) {
        setStarted(true);
        let frame = 0;
        const totalFrames = 150;
        const timer = setInterval(() => {
          frame++;
          const eased = 1 - Math.pow(1 - frame / totalFrames, 3);
          if (frame >= totalFrames) { setCount(end); clearInterval(timer); }
          else setCount(decimals ? eased * end : Math.floor(eased * end));
        }, 16);
        return () => clearInterval(timer);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, started, decimals]);
  return <span ref={ref}>{decimals ? count.toFixed(1) : count.toLocaleString()}{suffix}</span>;
}

// ═══════════════════════════════════════════════════════════
// Feedback Modal
// ═══════════════════════════════════════════════════════════
function FeedbackModal({ isOpen, onClose }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    window.open(`https://wa.me/923270972423?text=Name: ${encodeURIComponent(name)}%0AEmail: ${encodeURIComponent(email)}%0AMessage: ${encodeURIComponent(message)}`, "_blank");
    onClose(); setName(""); setEmail(""); setMessage("");
  };
  if (!isOpen) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }} className="rounded-2xl shadow-2xl p-8 w-full max-w-md" style={{ backgroundColor: "var(--white)" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--red)", color: "var(--white)" }}><FiMessageCircle size={20} /></div>
          <h2 className="text-xl font-bold" style={{ color: "var(--black)" }}>Send Feedback</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[{ type: "text", placeholder: "Your Name", value: name, setter: setName }, { type: "email", placeholder: "Your Email", value: email, setter: setEmail }].map((f, i) => (
            <input key={i} type={f.type} placeholder={f.placeholder} value={f.value} onChange={(e) => f.setter(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2"
              style={{ backgroundColor: "var(--lightgray)", borderColor: "var(--border)", color: "var(--black)", "--tw-ring-color": "var(--red)" }} />
          ))}
          <textarea placeholder="Your Message" value={message} onChange={(e) => setMessage(e.target.value)} required rows={4}
            className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 resize-none"
            style={{ backgroundColor: "var(--lightgray)", borderColor: "var(--border)", color: "var(--black)" }} />
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-70" style={{ color: "var(--gray)" }}>Cancel</button>
            <motion.button type="submit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold" style={{ backgroundColor: "var(--red)", color: "var(--white)" }}>
              <FiSend size={16} /> Send via WhatsApp
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════
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

  const latestBlogs = [...blogs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
  const featuredTools = tools.slice(0, 6);

  const toolIcons = {
    photo: <FiCamera size={26} />, video: <FiVideo size={26} />, audio: <FiMusic size={26} />,
    "video-to-audio": <FiSettings size={26} />, "photo-collage": <FiGrid size={26} />,
    "video-collage": <FiVideo size={26} />, "media-compressor": <FiDownload size={26} />,
  };
  const toolColors = {
    photo: "var(--red)", video: "var(--purple)", audio: "var(--green)",
    "video-to-audio": "var(--orange)", "photo-collage": "var(--pink)",
    "video-collage": "var(--cyan)", "media-compressor": "var(--teal)",
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: "var(--white)", color: "var(--black)" }}>
      <Navbar />
      <ScrollToTop />
      <div className={activeEditor ? "hidden" : ""}>
        <HeroSection />

        {/* ═══════════════════════════════════════════════════════ */}
        {/* STATS – Floating Glass Cards */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="py-16 px-4 relative -mt-12" style={{ background: "linear-gradient(180deg, transparent 0%, var(--lightgray) 50%)" }}>
          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: <FiUsers size={28} />, end: 10842, suffix: "+", label: "Active Users", color: "var(--red)" },
                { icon: <FiAward size={28} />, end: 7, suffix: "+", label: "Tools", color: "var(--purple)" },
                { icon: <FiActivity size={28} />, end: 124500, suffix: "+", label: "Files Processed", color: "var(--green)" },
                { icon: <FiStar size={28} />, end: 4.9, suffix: "", label: "Rating", color: "var(--orange)", decimals: true },
              ].map((s, i) => (
                <motion.div key={i} whileHover={{ y: -8, scale: 1.03 }} className="p-6 rounded-2xl text-center backdrop-blur-md border shadow-lg"
                  style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}>
                  <motion.div className="flex justify-center mb-3" style={{ color: s.color }}
                    animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}>
                    {s.icon}
                  </motion.div>
                  <h3 className="sm:text-xl l:text-3xl font-black" style={{ color: "var(--black)" }}><AnimatedCounter end={s.end} suffix={s.suffix} decimals={s.decimals} /></h3>
                  <p className="text-xs font-semibold tracking-wide mt-1" style={{ color: "var(--gray)" }}>{s.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* HOW IT WORKS – Floating Timeline */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section id="how-it-works" className="py-24 px-4 relative overflow-hidden" style={{ backgroundColor: "var(--white)" }}>
          <div className="absolute inset-0 pointer-events-none">
            <motion.div className="absolute w-[600px] h-[600px] rounded-full blur-[150px]" style={{ background: "linear-gradient(135deg, var(--red), var(--purple))", top: "20%", left: "-15%", opacity: 0.04 }}
              animate={{ scale: [1, 1.2, 1], x: [0, 40, 0] }} transition={{ duration: 15, repeat: Infinity }} />
          </div>
          <div className="max-w-5xl mx-auto relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
              <span className="text-sm font-bold tracking-widest uppercase mb-3 block" style={{ color: "var(--red)" }}>Simple Process</span>
              <h2 className="text-4xl md:text-6xl font-black" style={{ color: "var(--black)" }}>How It Works</h2>
            </motion.div>
            <div className="space-y-16">
              {[
                { step: "01", icon: <FiMousePointer size={28} />, title: "Choose a Tool", desc: "Browse our collection of free, professional‑grade creative tools.", color: "var(--red)" },
                { step: "02", icon: <FiCpu size={28} />, title: "Edit in Browser", desc: "No downloads, no signups — edit photos, videos & audio right here.", color: "var(--purple)" },
                { step: "03", icon: <FiDownload size={28} />, title: "Export & Share", desc: "Download your work or share it instantly. Completely free.", color: "var(--green)" },
              ].map((item, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, x: idx % 2 === 0 ? -60 : 60 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.2, duration: 0.7 }} viewport={{ once: true }}
                  className={`flex flex-col md:flex-row items-center gap-8 ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className="flex-1">
                    <motion.div whileHover={{ scale: 1.03, y: -5 }} className="p-8 rounded-3xl border shadow-lg relative overflow-hidden group"
                      style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}>
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.05] transition-opacity duration-500"
                        style={{ background: `linear-gradient(135deg, ${item.color}, transparent)` }} />
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-5xl font-black" style={{ color: item.color }}>{item.step}</span>
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${item.color}15`, color: item.color }}>{item.icon}</div>
                      </div>
                      <h3 className="text-2xl font-bold mb-2" style={{ color: "var(--black)" }}>{item.title}</h3>
                      <p className="text-base leading-relaxed" style={{ color: "var(--gray)" }}>{item.desc}</p>
                    </motion.div>
                  </div>
                  <div className="hidden md:flex w-16 h-16 rounded-full items-center justify-center shadow-xl flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${item.color}, transparent)` }}>
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: "var(--white)" }} />
                  </div>
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* FEATURED TOOLS – Bento Grid */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section id="tools" className="py-24 px-4 relative" style={{ backgroundColor: "var(--lightgray)" }}>
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{ backgroundImage: "radial-gradient(circle, var(--red) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
              <span className="text-sm font-bold tracking-widest uppercase mb-3 block" style={{ color: "var(--red)" }}>Creative Suite</span>
              <h2 className="text-4xl md:text-6xl font-black" style={{ color: "var(--black)" }}>Featured Tools</h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredTools.map((tool, idx) => (
                <motion.div key={tool.editorType} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }} viewport={{ once: true }}
                  whileHover={{ y: -10, scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => launchEditor(tool.editorType)}
                  className="rounded-3xl p-7 cursor-pointer shadow-lg border transition-all duration-300 group relative overflow-hidden"
                  style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500"
                    style={{ background: `linear-gradient(135deg, ${toolColors[tool.editorType]}, transparent)` }} />
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
                      style={{ backgroundColor: `${toolColors[tool.editorType]}15`, color: toolColors[tool.editorType] }}>
                      {toolIcons[tool.editorType] || <FiSettings size={28} />}
                    </div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: "var(--black)" }}>{tool.label}</h3>
                    <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--gray)" }}>{tool.desc}</p>
                    <div className="flex items-center gap-1 text-sm font-bold" style={{ color: toolColors[tool.editorType] }}>
                      Launch <FiChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href="/tools">
                <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold cursor-pointer shadow-xl"
                  style={{ backgroundColor: "var(--red)", color: "var(--white)", boxShadow: "0 8px 32px rgba(37,99,235,0.3)" }}>
                  View All Tools <FiArrowRight size={20} />
                </motion.span>
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* WHY CHOOSE US – 3D Card Flip */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="py-24 px-4 relative overflow-hidden" style={{ backgroundColor: "var(--white)" }}>
          <div className="max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
              <span className="text-sm font-bold tracking-widest uppercase mb-3 block" style={{ color: "var(--red)" }}>Why AR Studio</span>
              <h2 className="text-4xl md:text-6xl font-black" style={{ color: "var(--black)" }}>Built Different</h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: <FiZap size={36} />, title: "Lightning Fast", desc: "All processing happens right in your browser. No uploads, no waiting.", color: "var(--red)" },
                { icon: <FiShield size={36} />, title: "100% Private", desc: "Your files never leave your device. Complete privacy guaranteed.", color: "var(--green)" },
                { icon: <FiLayers size={36} />, title: "No Limits", desc: "No watermarks, no file size limits, no forced signups. Ever.", color: "var(--purple)" },
              ].map((item, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 40, rotateY: 15 }} whileInView={{ opacity: 1, y: 0, rotateY: 0 }} transition={{ delay: idx * 0.15, duration: 0.7 }} viewport={{ once: true }}
                  whileHover={{ y: -12, rotateY: -5 }} className="p-10 rounded-3xl border shadow-xl text-center relative group cursor-default"
                  style={{ backgroundColor: "var(--white)", borderColor: "var(--border)", transformStyle: "preserve-3d", perspective: "1000px" }}>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${item.color}, transparent)` }}>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "var(--white)" }} />
                  </div>
                  <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12"
                    style={{ background: `linear-gradient(135deg, ${item.color}20, ${item.color}05)`, color: item.color }}>
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3" style={{ color: "var(--black)" }}>{item.title}</h3>
                  <p className="text-base leading-relaxed" style={{ color: "var(--gray)" }}>{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TESTIMONIALS – Carousel Style Cards */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="py-24 px-4 relative overflow-hidden" style={{ backgroundColor: "var(--lightgray)" }}>
          <div className="absolute inset-0 pointer-events-none">
            <motion.div className="absolute w-[500px] h-[500px] rounded-full blur-[120px]" style={{ background: "linear-gradient(135deg, var(--red), var(--purple))", bottom: "-10%", right: "-10%", opacity: 0.06 }}
              animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 12, repeat: Infinity }} />
          </div>
          <div className="max-w-5xl mx-auto relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
              <span className="text-sm font-bold tracking-widest uppercase mb-3 block" style={{ color: "var(--red)" }}>Testimonials</span>
              <h2 className="text-4xl md:text-6xl font-black" style={{ color: "var(--black)" }}>What Users Say</h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { quote: "Incredible tools! I edited my entire video without any signup.", author: "Sarah K.", role: "Content Creator" },
                { quote: "The photo collage maker saved me hours. Highly recommended.", author: "James L.", role: "Designer" },
                { quote: "Audio editor is so simple yet powerful. Love it!", author: "Priya M.", role: "Musician" },
              ].map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }} viewport={{ once: true }}
                  whileHover={{ y: -10, scale: 1.03 }} className="p-8 rounded-3xl border shadow-xl text-center relative"
                  style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}>
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                    style={{ background: "linear-gradient(135deg, var(--red), var(--purple))" }}>
                    <FiStar size={16} style={{ color: "var(--white)" }} />
                  </div>
                  <div className="flex justify-center gap-1 mb-5 mt-3">
                    {[...Array(5)].map((_, i) => <FiStar key={i} size={16} fill="#f59e0b" color="#f59e0b" />)}
                  </div>
                  <p className="text-base italic mb-6 leading-relaxed" style={{ color: "var(--black)" }}>"{t.quote}"</p>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-black"
                    style={{ background: "linear-gradient(135deg, var(--red), var(--purple))", color: "var(--white)" }}>{t.author.charAt(0)}</div>
                  <p className="font-bold text-sm" style={{ color: "var(--black)" }}>{t.author}</p>
                  <p className="text-xs" style={{ color: "var(--gray)" }}>{t.role}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
{/* GAMES SECTION – Premium Immersive Arcade */}
{/* ═══════════════════════════════════════════════════════════ */}
<section id="games" className="pt-28 pb-10 px-4 relative overflow-hidden" style={{ backgroundColor: "var(--white)" }}>
  
  {/* ─── Background Ambient Orbs ──────────────────────────── */}
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Main green/teal orb */}
    <motion.div
      className="absolute w-[700px] h-[700px] rounded-full blur-[150px]"
      style={{
        background: "linear-gradient(135deg, var(--green), var(--teal))",
        top: "-15%",
        right: "-15%",
        opacity: 0.07,
      }}
      animate={{
        scale: [1, 1.25, 1],
        x: [0, 40, 0],
        y: [0, -20, 0],
      }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
    />
    {/* Secondary purple/blue orb */}
    <motion.div
      className="absolute w-[500px] h-[500px] rounded-full blur-[130px]"
      style={{
        background: "linear-gradient(135deg, var(--purple), var(--red))",
        bottom: "-10%",
        left: "-10%",
        opacity: 0.05,
      }}
      animate={{
        scale: [1.1, 0.85, 1.1],
        x: [0, -30, 0],
        y: [0, 25, 0],
      }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
    />
    {/* Small accent orb */}
    <motion.div
      className="absolute w-[300px] h-[300px] rounded-full blur-[100px]"
      style={{
        background: "linear-gradient(135deg, var(--orange), var(--pink))",
        top: "50%",
        left: "50%",
        opacity: 0.04,
      }}
      animate={{
        scale: [0.9, 1.15, 0.9],
        x: [0, 20, 0],
      }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 4 }}
    />
    {/* Dotted pattern overlay */}
    <div
      className="absolute inset-0 opacity-[0.025]"
      style={{
        backgroundImage: "radial-gradient(circle at 20% 40%, var(--green) 1px, transparent 1px), radial-gradient(circle at 80% 70%, var(--red) 1px, transparent 1px)",
        backgroundSize: "50px 50px, 40px 40px",
      }}
    />
  </div>

  <div className="max-w-7xl mx-auto relative z-10">
    
    {/* ─── Section Heading ─────────────────────────────────── */}
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="text-center mb-16"
    >
      {/* Animated badge */}
      <motion.div
        className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-xs font-bold tracking-widest mb-5 border backdrop-blur-sm"
        style={{
          backgroundColor: "var(--white)",
          borderColor: "var(--border)",
          color: "var(--green)",
        }}
        whileHover={{ scale: 1.04 }}
      >
        <div className="flex items-center gap-1.5">
          <motion.span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "var(--green)" }}
            animate={{ opacity: [1, 0.2, 1], scale: [1, 1.5, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
          <motion.span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "var(--teal)" }}
            animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.5, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.6 }}
          />
          <motion.span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "var(--cyan)" }}
            animate={{ opacity: [1, 0.2, 1], scale: [1, 1.5, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: 1.2 }}
          />
        </div>
        TAKE A BREAK
      </motion.div>
      <div className="text-center w-full flex items-center justify-center">
      <h2 className="text-5xl md:text-7xl font-black mb-5 tracking-tight flex sm:flex-col l:flex-row" style={{ color: "var(--black)" }}>
        Games{" "}
        <span className="mx-2">Arcade
        </span>
      </h2></div>
      <p className="text-lg md:text-xl max-w-xl mx-auto leading-relaxed" style={{ color: "var(--gray)" }}>
        Take a break and enjoy our hand‑picked collection of browser games.
      </p>
    </motion.div>

    {/* ─── Games Layout – Featured + Sidebar ───────────────── */}
    <div  className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      
      {/* ─── Featured Game Card (3 columns) ────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        viewport={{ once: true }}
        className="lg:col-span-3"
      >
        <Link href="/games/snake" className="block h-full">
          <motion.div
            whileHover={{ y: -10, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-3xl overflow-hidden shadow-2xl border h-full relative group cursor-pointer"
            style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}
          >
            {/* Gradient background */}
            <div
              className="absolute inset-0 opacity-15 group-hover:opacity-25 transition-all duration-700"
              style={{ background: "linear-gradient(135deg, var(--green), var(--teal), var(--cyan))" }}
            />
            
            {/* Decorative grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.04] group-hover:opacity-[0.06] transition-opacity duration-500"
              style={{
                backgroundImage: `
                  linear-gradient(var(--green) 1px, transparent 1px),
                  linear-gradient(90deg, var(--green) 1px, transparent 1px)
                `,
                backgroundSize: "60px 60px",
              }}
            />

            <div className="relative z-10 p-8 md:p-10 flex flex-col h-full">
              {/* Top row: Icon + Badge */}
              <div className="flex items-start justify-between mb-6">
                <motion.div
                  className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl"
                  style={{ background: "linear-gradient(135deg, var(--green), var(--teal))" }}
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <BiGame size={48} style={{ color: "var(--black)" }} />
                </motion.div>
                
                <div className="flex flex-col items-end gap-2">
                  <motion.span
                    className="px-4 py-2 rounded-full text-xs font-black tracking-wider"
                    style={{ backgroundColor: "var(--green)", color: "var(--white)" }}
                    whileHover={{ scale: 1.05 }}
                    animate={{ boxShadow: ["0 0 0 0 rgba(34,197,94,0.4)", "0 0 0 12px rgba(34,197,94,0)", "0 0 0 0 rgba(34,197,94,0.4)"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    FEATURED
                  </motion.span>
                  <span className="text-xs font-semibold" style={{ color: "var(--gray)" }}>
                    Most Played
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-4xl md:text-5xl font-black mb-4" style={{ color: "var(--black)" }}>
                  Snake
                </h3>
                <p className="text-base md:text-lg mb-8 leading-relaxed max-w-lg" style={{ color: "var(--gray)" }}>
                  Classic snake reimagined in immersive with glowing effects, 
                  silky‑smooth controls, and endless replayability.
                </p>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-6 mb-6">
                <div className="flex items-center gap-1.5">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} size={18} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
                <span className="text-sm font-bold" style={{ color: "var(--black)" }}>4.9</span>
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: "var(--gray)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--gray)" }}>
                  <FiUsers size={14} className="inline mr-1" />1 Player
                </span>
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: "var(--gray)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--gray)" }}>
                  <FiClock size={14} className="inline mr-1" />Easy
                </span>
              </div>

              {/* Play button */}
              <motion.div
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-base font-black shadow-xl cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, var(--green), var(--red))",
                  color: "var(--white)",
                  boxShadow: "0 8px 32px rgba(34,197,94,0.3)",
                }}
                whileHover={{ scale: 1.05, gap: "16px", boxShadow: "0 12px 40px rgba(34,197,94,0.4)" }}
                whileTap={{ scale: 0.96 }}
              >
                Play Now <FiArrowRight size={22} />
              </motion.div>
            </div>
          </motion.div>
        </Link>
      </motion.div>

      {/* ─── Sidebar Cards (2 columns) ──────────────────────── */}
      <div className="lg:col-span-2 flex flex-col gap-8">
        
        {/* Chess Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          viewport={{ once: true }}
          className="flex-1"
        >
          <Link href="/games/chess" className="block h-full">
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-3xl overflow-hidden shadow-xl border h-full group cursor-pointer relative"
              style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}
            >
              <div
                className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-all duration-500"
                style={{ background: "linear-gradient(135deg, var(--purple), var(--red))" }}
              />
              
              <div className="relative z-10 p-7 flex items-center gap-6 h-full">
                <motion.div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl"
                  style={{ background: "linear-gradient(135deg, var(--purple), var(--red))" }}
                  whileHover={{ scale: 1.1, rotate: -8 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <FiGrid size={36} style={{ color: "var(--white)" }} />
                </motion.div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-2xl font-black" style={{ color: "var(--black)" }}>Chess</h3>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--purple)", color: "var(--white)" }}>
                      NEW
                    </span>
                  </div>
                  <p className="text-sm mb-3 line-clamp-2" style={{ color: "var(--gray)" }}>
                    Strategic chess with stunning visuals and AI opponent.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[...Array(4)].map((_, i) => <FiStar key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}
                      <FiStar size={14} color="#f59e0b" />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: "var(--gray)" }}>4.5</span>
                  </div>
                </div>

                <motion.div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300"
                  style={{ background: "linear-gradient(135deg, var(--purple), var(--red))" }}
                  whileHover={{ scale: 1.1 }}
                >
                  <FiArrowRight size={18} style={{ color: "var(--white)" }} />
                </motion.div>
              </div>
            </motion.div>
          </Link>
        </motion.div>

        {/* Coming Soon Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          viewport={{ once: true }}
          className="flex-1"
        >
          <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            className="rounded-3xl overflow-hidden shadow-xl border h-full group cursor-pointer relative"
            style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}
          >
            <div
              className="absolute inset-0 opacity-8 group-hover:opacity-18 transition-all duration-500"
              style={{ background: "linear-gradient(135deg, var(--orange), var(--pink), var(--red))" }}
            />

            {/* Pulsing Coming Soon badge */}
            <div className="sm:mt-4 sm:ml-4 t:mt-0 t:ml-0 t:absolute t:top-5 t:right-5 z-20">
              <motion.span
                className="px-4 py-1.5 rounded-full text-xs font-black tracking-wider"
                style={{ backgroundColor: "var(--orange)", color: "var(--white)" }}
                animate={{ scale: [1, 1.06, 1], boxShadow: ["0 0 0 0 rgba(249,115,22,0.4)", "0 0 0 10px rgba(249,115,22,0)", "0 0 0 0 rgba(249,115,22,0.4)"] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                COMING SOON
              </motion.span>
            </div>

            <div className="relative z-10 p-7">
              <h3 className="text-xl font-black mb-4" style={{ color: "var(--black)" }}>
                More Games
              </h3>
              
              {/* Game tags */}
              <div className="flex flex-wrap gap-2.5 mb-5">
                {[
                  { name: "Tennis", color: "var(--pink)" },
                  { name: "Mini Golf", color: "var(--cyan)" },
                  { name: "12 Taani", color: "var(--purple)" },
                ].map((game, idx) => (
                  <motion.span
                    key={idx}
                    className="px-3.5 py-2 rounded-full text-xs font-bold cursor-pointer"
                    style={{
                      backgroundColor: `${game.color}12`,
                      color: game.color,
                      border: `1.5px solid ${game.color}25`,
                    }}
                    whileHover={{
                      scale: 1.08,
                      backgroundColor: game.color,
                      color: "var(--white)",
                      borderColor: game.color,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {game.name}
                  </motion.span>
                ))}
              </div>
              
              <p className="text-sm mb-5 leading-relaxed" style={{ color: "var(--gray)" }}>
                New games are added regularly. Check back soon for exciting additions!
              </p>
              
              <div className="flex items-center gap-2 text-sm font-black" style={{ color: "var(--orange)" }}>
                View All Games <FiArrowRight size={16} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>

    {/* ─── See All Games Button ────────────────────────────── */}
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      viewport={{ once: true }}
      className="text-center mt-14"
    >
      <Link href="/games">
        <motion.button
          whileHover={{ scale: 1.06, gap: "16px" }}
          whileTap={{ scale: 0.94 }}
          className="px-10 py-5 rounded-full font-black text-lg inline-flex items-center gap-3 cursor-pointer shadow-2xl transition-all"
          style={{
            background: "linear-gradient(135deg, var(--red), var(--purple))",
            color: "var(--white)",
            boxShadow: "0 12px 40px rgba(37,99,235,0.35)",
          }}
        >
          Explore All Games
          <motion.span
            animate={{ x: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <FiArrowRight size={24} />
          </motion.span>
        </motion.button>
      </Link>
      
      {/* Trust text */}
      <p className="text-xs mt-4 font-medium" style={{ color: "var(--gray)" }}>
        <FiZap size={12} className="inline mr-1" style={{ color: "var(--red)" }} />
        Free to play • No downloads • Instant fun
      </p>
    </motion.div>
  </div>
</section>
        {/* ═══════════════════════════════════════════════════════ */}
        {/* BLOGS – Magazine Layout */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="py-24 px-4 relative overflow-hidden" style={{ backgroundColor: "var(--white)" }}>
          <div className="max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
              <span className="text-sm font-bold tracking-widest uppercase mb-3 block" style={{ color: "var(--red)" }}>Learn & Explore</span>
              <h2 className="text-4xl md:text-6xl font-black" style={{ color: "var(--black)" }}>Latest Articles</h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {latestBlogs.map((post, idx) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} viewport={{ once: true }}
                    whileHover={{ y: -10 }} className="rounded-3xl overflow-hidden border shadow-lg transition-all group cursor-pointer"
                    style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}>
                    <div className="relative h-52 overflow-hidden">
                      <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute top-4 left-4">
                        <span className="px-4 py-1.5 rounded-full text-xs font-bold" style={{ backgroundColor: "var(--red)", color: "var(--white)" }}>
                          {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:opacity-80 transition" style={{ color: "var(--black)" }}>{post.title}</h3>
                      <p className="text-sm mb-4 line-clamp-2 leading-relaxed" style={{ color: "var(--gray)" }}>{post.excerpt}</p>
                      <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--red)" }}>
                        Read Article <FiArrowRight size={16} />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* CTA – Dotted Pattern */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="py-28 px-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, var(--red), var(--purple))" }}>
          <motion.div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: "radial-gradient(circle, var(--white) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <BiBrain size={56} className="mx-auto mb-6" style={{ color: "var(--white)", opacity: 0.9 }} />
              <h2 className="text-4xl md:text-6xl font-black mb-6" style={{ color: "var(--white)" }}>Ready to Create?</h2>
              <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto" style={{ color: "var(--white)", opacity: 0.85 }}>
                All tools are free, no signup required. Start editing right now — no limits, no watermarks.
              </p>
              <div className="flex flex-wrap justify-center gap-5">
                <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                  onClick={() => document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" })}
                  className="px-9 py-4 rounded-full font-bold text-lg flex items-center gap-3 cursor-pointer shadow-2xl"
                  style={{ backgroundColor: "var(--white)", color: "var(--red)" }}>
                  <FiCommand size={22} /> Explore All Tools
                </motion.button>
                <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                  onClick={() => setFeedbackOpen(true)}
                  className="px-9 py-4 rounded-full font-bold text-lg flex items-center gap-3 cursor-pointer border-2 transition-all hover:bg-white/10"
                  style={{ borderColor: "var(--white)", color: "var(--white)" }}>
                  <FiMessageCircle size={22} /> Send Feedback
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>

      {/* Editor Container */}
      <div ref={editorContainerRef} className={`fixed inset-0 z-50 ${activeEditor ? "" : "hidden"}`}
        style={{ backgroundColor: "var(--white)", width: "100vw", height: "100vh" }}>
        {activeEditor && <EditorWorkspace type={activeEditor} onExit={exitEditor} />}
      </div>

      <AnimatePresence>
        {feedbackOpen && <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}