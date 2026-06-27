// pages/about.js
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { motion } from "framer-motion";
import {
  FiCamera, FiVideo, FiMusic, FiUsers, FiTarget,
  FiHeart, FiZap, FiShield, FiGlobe, FiAward,
  FiArrowRight, FiStar,
} from "react-icons/fi";

export default function About() {
  const stats = [
    { icon: <FiUsers size={28} />, value: "10,000+", label: "Active Users" },
    { icon: <FiGlobe size={28} />, value: "120+", label: "Countries" },
    { icon: <FiAward size={28} />, value: "4.9/5", label: "User Rating" },
    { icon: <FiZap size={28} />, value: "7+", label: "Powerful Tools" },
  ];

  const values = [
    {
      icon: <FiHeart size={28} />,
      title: "Free Forever",
      desc: "We believe creative tools should be accessible to everyone, without paywalls or subscriptions.",
      color: "var(--red)",
    },
    {
      icon: <FiShield size={28} />,
      title: "Privacy First",
      desc: "Your files never leave your device. Everything is processed locally in your browser.",
      color: "var(--green)",
    },
    {
      icon: <FiTarget size={28} />,
      title: "User Focused",
      desc: "Every feature is designed with simplicity and usability in mind. No learning curve required.",
      color: "var(--red)",
    },
  ];

  const tools = [
    { icon: <FiCamera size={32} />, title: "Photo Tools", desc: "Crop, filter, adjust, and enhance your images with professional-grade tools.", color: "var(--red)" },
    { icon: <FiVideo size={32} />, title: "Video Tools", desc: "Combine clips, create collages, and compress videos without losing quality.", color: "var(--purple)" },
    { icon: <FiMusic size={32} />, title: "Audio Tools", desc: "Edit, convert, and extract audio with precision and ease.", color: "var(--green)" },
  ];

  return (
    <div style={{ backgroundColor: "var(--white)", minHeight: "100vh" }}>
      <Navbar />

      {/* ─── Hero Header ──────────────────────────────────── */}
      <section className="pt-28 pb-16 px-4" style={{ backgroundColor: "var(--lightgray)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span
              className="text-sm font-semibold tracking-widest uppercase mb-3 block"
              style={{ color: "var(--red)" }}
            >
              Our Story
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: "var(--black)" }}>
              About AR Studio
            </h1>
            <p className="text-base md:text-lg max-w-3xl mx-auto leading-relaxed" style={{ color: "var(--gray)" }}>
              AR Studio is a free, browser‑based suite of creative tools built for everyone.
              We believe powerful editing software should be accessible, intuitive, and completely free.
              No downloads, no subscriptions — just pure creativity.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Stats Bar ─────────────────────────────────────── */}
      <section className="py-10 px-4" style={{ backgroundColor: "var(--white)" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="p-5 rounded-2xl text-center"
              style={{ backgroundColor: "var(--lightgray)" }}
            >
              <div className="flex justify-center mb-2" style={{ color: "var(--red)" }}>
                {stat.icon}
              </div>
              <h3 className="text-2xl font-bold" style={{ color: "var(--black)" }}>{stat.value}</h3>
              <p className="text-xs mt-1" style={{ color: "var(--gray)" }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Mission ───────────────────────────────────────── */}
      <section className="py-16 px-4" style={{ backgroundColor: "var(--lightgray)" }}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span
              className="text-sm font-semibold tracking-widest uppercase mb-2 block"
              style={{ color: "var(--red)" }}
            >
              Our Mission
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: "var(--black)" }}>
              Creativity Without Barriers
            </h2>
            <p className="text-base md:text-lg max-w-3xl mx-auto leading-relaxed" style={{ color: "var(--gray)" }}>
              We're on a mission to democratize creative tools. Whether you're a content creator,
              a student, or just someone who wants to edit a quick photo, our tools are designed
              to be fast, free, and frustration‑free. Everything runs directly in your browser
              using cutting‑edge web technologies — your files never leave your device.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Values ────────────────────────────────────────── */}
      <section className="py-16 px-4" style={{ backgroundColor: "var(--white)" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span
              className="text-sm font-semibold tracking-widest uppercase mb-2 block"
              style={{ color: "var(--red)" }}
            >
              What We Stand For
            </span>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "var(--black)" }}>
              Our Values
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -6 }}
                className="p-6 rounded-2xl shadow-sm border text-center"
                style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${value.color}15`, color: value.color }}
                >
                  {value.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--black)" }}>{value.title}</h3>
                <p className="text-sm" style={{ color: "var(--gray)" }}>{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Tools Overview ────────────────────────────────── */}
      <section className="py-16 px-4" style={{ backgroundColor: "var(--lightgray)" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span
              className="text-sm font-semibold tracking-widest uppercase mb-2 block"
              style={{ color: "var(--red)" }}
            >
              What We Offer
            </span>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "var(--black)" }}>
              Powerful Tools
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tools.map((tool, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -6 }}
                className="p-6 rounded-2xl shadow-sm border text-center"
                style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${tool.color}15`, color: tool.color }}
                >
                  {tool.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--black)" }}>{tool.title}</h3>
                <p className="text-sm" style={{ color: "var(--gray)" }}>{tool.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────── */}
      <section className="py-16 px-4" style={{ backgroundColor: "var(--red)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <FiStar size={40} className="mx-auto mb-4" style={{ color: "var(--white)", opacity: 0.8 }} />
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "var(--white)" }}>
              Start Creating Today
            </h2>
            <p className="text-sm md:text-base mb-8 max-w-xl mx-auto" style={{ color: "var(--white)", opacity: 0.85 }}>
              All our tools are free, no signup required. Pick a tool and start editing right in your browser.
            </p>
            <motion.a
              href="/tools"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex px-6 py-3 rounded-full text-sm font-semibold items-center gap-2"
              style={{ backgroundColor: "var(--white)", color: "var(--red)" }}
            >
              Explore Tools <FiArrowRight size={16} />
            </motion.a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}