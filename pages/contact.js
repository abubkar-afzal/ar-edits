// pages/contact.js
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  FiSend, FiMail, FiMapPin, FiMessageCircle,
  FiGithub, FiLinkedin, FiTwitter, FiExternalLink,
  FiCode, FiSmartphone, FiGlobe, FiDatabase,
  FiLayout, FiServer, FiTool, FiCpu,
  FiArrowUpRight, FiCheckCircle,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

export default function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = `Name: ${encodeURIComponent(formData.name)}%0AEmail: ${encodeURIComponent(formData.email)}%0AMessage: ${encodeURIComponent(formData.message)}`;
    window.open(`https://wa.me/923270972423?text=${text}`, "_blank");
    setSubmitted(true);
    setFormData({ name: "", email: "", message: "" });
  };

  const skills = [
    { icon: <FiLayout size={20} />, category: "Frontend", items: "Next.js, React, Tailwind CSS, Framer Motion" },
    { icon: <FiServer size={20} />, category: "Backend", items: "Node.js, Express, Python, REST APIs" },
    { icon: <FiDatabase size={20} />, category: "Database", items: "MongoDB, PostgreSQL, Firebase, SQLite" },
    { icon: <FiCode size={20} />, category: "Languages", items: "JavaScript, TypeScript, Python, HTML/CSS" },
    { icon: <FiTool size={20} />, category: "Tools", items: "Git, Docker, VS Code, Figma, Vercel" },
    { icon: <FiCpu size={20} />, category: "Specialties", items: "Full-Stack Development, WebGL, Media Processing" },
  ];

  const socialLinks = [
    { icon: <FiGithub size={22} />, label: "GitHub", href: "https://github.com/abubkar-afzal", color: "var(--black)" },
    { icon: <FiLinkedin size={22} />, label: "LinkedIn", href: "https://www.linkedin.com/in/hafiz-abubakar-afzal-b77a46354/", color: "var(--red)" },
    { icon: <FaWhatsapp size={22} />, label: "WhatsApp", href: "https://wa.me/923270972423", color: "var(--green)" },
    { icon: <FiMail size={22} />, label: "Email", href: "mailto:hafizabubakarafzal@gmail.com", color: "var(--red)" },
    { icon: <FiExternalLink size={22} />, label: "Portfolio", href: "https://hafizabubakarafzal.vercel.app", color: "var(--purple)" },
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
              Let's Connect
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "var(--black)" }}>
              Get in Touch
            </h1>
            <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: "var(--gray)" }}>
              Have feedback, suggestions, or need help? I'd love to hear from you.
              Reach out and I'll get back to you as soon as possible.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Contact Form + Info ───────────────────────────── */}
      <section className="py-16 px-4" style={{ backgroundColor: "var(--white)" }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl shadow-sm border p-8"
            style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2 mb-6">
              <FiMessageCircle size={24} style={{ color: "var(--red)" }} />
              <h2 className="text-2xl font-bold" style={{ color: "var(--black)" }}>Send a Message</h2>
            </div>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <FiCheckCircle size={48} className="mx-auto mb-4" style={{ color: "var(--green)" }} />
                <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--black)" }}>Message Sent!</h3>
                <p style={{ color: "var(--gray)" }}>I'll get back to you on WhatsApp shortly.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 px-5 py-2 rounded-full text-sm font-semibold"
                  style={{ backgroundColor: "var(--lightgray)", color: "var(--black)" }}
                >
                  Send Another
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-sm font-medium mb-1.5 block" style={{ color: "var(--black)" }}>
                    Your Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Abubakar"
                    className="w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: "var(--lightgray)",
                      borderColor: "var(--border)",
                      color: "var(--black)",
                      "--tw-ring-color": "var(--red)",
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block" style={{ color: "var(--black)" }}>
                    Your Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="hafizabubakarafzal@gmail.com"
                    className="w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: "var(--lightgray)",
                      borderColor: "var(--border)",
                      color: "var(--black)",
                      "--tw-ring-color": "var(--red)",
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block" style={{ color: "var(--black)" }}>
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="Tell me what's on your mind..."
                    className="w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 resize-none"
                    style={{
                      backgroundColor: "var(--lightgray)",
                      borderColor: "var(--border)",
                      color: "var(--black)",
                      "--tw-ring-color": "var(--red)",
                    }}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
                >
                  <FiSend size={16} /> Send via WhatsApp
                </motion.button>
              </form>
            )}
          </motion.div>

          {/* Contact Info + Social Links */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Quick Contact */}
            <div
              className="rounded-2xl shadow-sm border p-8"
              style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}
            >
              <h2 className="text-xl font-bold mb-6" style={{ color: "var(--black)" }}>Connect With Me</h2>
              <div className="space-y-4">
                {socialLinks.map((link, idx) => (
                  <motion.a
                    key={idx}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ x: 5 }}
                    className="flex items-center gap-4 p-3 rounded-xl transition-all group"
                    style={{ backgroundColor: "var(--lightgray)" }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "var(--white)", color: link.color }}
                    >
                      {link.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: "var(--black)" }}>{link.label}</p>
                    </div>
                    <FiArrowUpRight size={16} style={{ color: "var(--gray)" }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Location */}
            <div
              className="rounded-2xl shadow-sm border p-8"
              style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}
            >
              <h2 className="text-xl font-bold mb-4" style={{ color: "var(--black)" }}>Location</h2>
              <div className="flex items-start gap-3">
                <FiMapPin size={20} style={{ color: "var(--red)", marginTop: 2 }} />
                <p className="text-sm" style={{ color: "var(--gray)" }}>
                  Based in Pakistan, working remotely with clients worldwide.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Developer Section ─────────────────────────────── */}
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
              About the Developer
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "var(--black)" }}>
              Hafiz Abubakar Afzal
            </h2>
            <p className="text-base max-w-2xl mx-auto" style={{ color: "var(--gray)" }}>
              Full‑Stack Developer specializing in Next.js, React, and modern web technologies.
              Passionate about building tools that make creativity accessible to everyone.
            </p>
            <motion.a
              href="https://hafizabubakarafzal.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-full text-sm font-semibold"
              style={{ backgroundColor: "var(--red)", color: "var(--white)" }}
            >
              <FiGlobe size={16} /> Visit Portfolio
            </motion.a>
          </motion.div>

          {/* Skills Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map((skill, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
                className="p-5 rounded-2xl shadow-sm border"
                style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "var(--lightgray)", color: "var(--red)" }}
                  >
                    {skill.icon}
                  </div>
                  <h3 className="font-semibold text-sm" style={{ color: "var(--black)" }}>{skill.category}</h3>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--gray)" }}>{skill.items}</p>
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
            <FiSmartphone size={40} className="mx-auto mb-4" style={{ color: "var(--white)", opacity: 0.8 }} />
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "var(--white)" }}>
              Let's Work Together
            </h2>
            <p className="text-sm md:text-base mb-8 max-w-xl mx-auto" style={{ color: "var(--white)", opacity: 0.85 }}>
              Have a project in mind? Looking for a developer? I'm always open to new opportunities and collaborations.
            </p>
            <motion.a
              href="https://wa.me/923270972423"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex px-6 py-3 rounded-full text-sm font-semibold items-center gap-2"
              style={{ backgroundColor: "var(--white)", color: "var(--red)" }}
            >
              <FaWhatsapp size={18} /> Chat on WhatsApp
            </motion.a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}