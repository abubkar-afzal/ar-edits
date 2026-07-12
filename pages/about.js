// pages/about.js
import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCamera, FiVideo, FiMusic, FiUsers, FiTarget,
  FiHeart, FiZap, FiShield, FiGlobe, FiAward,
  FiArrowRight, FiStar, FiChevronDown, FiPlay
} from "react-icons/fi";
import { FaGamepad, FaChess, FaCircle, FaDice, FaDiceD6, FaPlaystation, FaGolfBall } from "react-icons/fa";
import { VscSnake } from "react-icons/vsc";
import Link from "next/link";
import Script from "next/script";
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

  const games = [
    { icon: <VscSnake size={32} />, title: "Snake Game", desc: "Relive the classic snake arcade game.", color: "var(--green)" },
    { icon: <FaChess size={32} />, title: "Chess", desc: "Play chess against a friend or the computer.", color: "var(--purple)" },
    { icon: <FaCircle size={32} />, title: "Infinite Tic-Tac-Toe", desc: "An endless twist on the classic tic-tac-toe.", color: "var(--red)" },
    { icon: <FaGolfBall size={32} />, title: "Ludo", desc: "The traditional board game, now online.", color: "var(--orange)" },
    { icon: <FaDiceD6 size={32} />, title: "More Coming Soon", desc: "Gold, 12 Tennis, and many more on the way!", color: "var(--yellow)" },
  ];

  const faqs = [
    {
      question: "Why is the video not displaying correctly on my mobile?",
      answer:
        "Mobile devices have limited RAM and VRAM, which can affect video rendering performance. For the best experience, we recommend using our tools on a laptop or desktop computer.",
    },
    {
      question: "Why doesn't resizing work well on mobile?",
      answer:
        "Fingers are larger than a mouse cursor, making it harder to drag small resize handles. To resize accurately, use the numeric input fields: swipe left/right on the field to change the value, or double‑tap to type an exact number.",
    },
    {
      question:"Why photo editor slow after removing background of an Image?",
      answer:"Removing the background of an image can be a resource-intensive process, especially for high-resolution images. This can cause the photo editor to slow down temporarily while processing the image."
    },
    {
      question: "Why does exporting a video take so long?",
      answer:
        "We export videos in high quality to preserve every detail. The export time depends on the video length, resolution, and the complexity of your edits. For large projects, a bit of patience ensures the best result.",
    },
    {
      question: "When are new tools and games coming?",
      answer:
        "We're constantly working on new features! Your feedback helps us decide what to build next. Use the 'Feedback' button in the navigation bar to let us know what you'd like to see.",
    },
    {
      question: "Which device is best for editing?",
      answer:
        "A laptop or desktop PC provides the best performance and screen real‑estate for detailed editing. While all our tools work on mobile, a larger screen and more processing power will give you a smoother experience.",
    },
    {
      question: "Are my files safe? Do you store them?",
      answer:
        "Absolutely. Your files are processed entirely in your browser and never uploaded to any server. We do not store, share, or have access to your content.",
    },
    {
      question: "Is there a limit on file size?",
      answer:
        "There is no hard limit, but very large files may be slower to process depending on your device's memory. For best results, we recommend files under 500 MB.",
    },
    {
      question: "Do I need to create an account?",
      answer: "No! All tools are 100% free and require no sign‑up or login. Just open the tool and start creating.",
    },
    {
      question: "What file formats are supported?",
      answer:
        "We support all common image formats (JPEG, PNG, WebP, etc.), video formats (MP4, WebM, MOV), and audio formats (MP3, WAV). If you encounter an unsupported format, let us know.",
    },
    {
      question: "Can I use these tools offline?",
      answer:
        "The tools run in your browser, so you need an internet connection to load the page initially. However, once loaded, many features work without a connection because processing happens locally.",
    },
  ];

  const [openFaqs, setOpenFaqs] = useState([]);

  const toggleFaq = (index) => {
    setOpenFaqs((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

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
              About AR Edits
            </h1>
            <p className="text-base md:text-lg max-w-3xl mx-auto leading-relaxed" style={{ color: "var(--gray)" }}>
              AR Edits is a free, browser‑based suite of creative tools built for everyone.
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

      {/* ─── Games ─────────────────────────────────────────── */}
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
              style={{ color: "var(--orange)" }}
            >
              Take a Break
            </span>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "var(--black)" }}>
              Fun & Games
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {games.map((game, idx) => (
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
                  style={{ backgroundColor: `${game.color}15`, color: game.color }}
                >
                  {game.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--black)" }}>{game.title}</h3>
                <p className="text-sm" style={{ color: "var(--gray)" }}>{game.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ Section ───────────────────────────────────── */}
      <section className="py-16 px-4" style={{ backgroundColor: "var(--lightgray)" }}>
        <div className="max-w-3xl mx-auto">
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
              Got Questions?
            </span>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "var(--black)" }}>
              Frequently Asked Questions
            </h2>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                viewport={{ once: true }}
                className="rounded-xl border overflow-hidden"
                style={{ borderColor: "var(--border)" }}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-semibold"
                  style={{ backgroundColor: "var(--white)", color: "var(--black)" }}
                >
                  <span className="pr-4">{faq.question}</span>
                  <FiChevronDown
                    size={18}
                    className={`transition-transform duration-200 ${
                      openFaqs.includes(idx) ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaqs.includes(idx) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="p-4 text-sm leading-relaxed" style={{ color: "var(--gray)" }}>
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
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
            <Link href="https://www.effectivecpmnetwork.com/n2rz4udj?key=f18be60e80ce937464124a6e2070b67c" target="_blank" rel="noopener noreferrer">
            <motion.a
              href="/tools"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex px-6 py-3 rounded-full text-sm font-semibold items-center gap-2"
              style={{ backgroundColor: "var(--white)", color: "var(--red)" }}
            >
              Explore Tools <FiArrowRight size={16} />
            </motion.a></Link>
          </motion.div>
        </div>
      </section>
<Script src="https://pl30304266.effectivecpmnetwork.com/66/2d/be/662dbe0a736ad1cd15c7b3dec51f3ca5.js" strategy="lazyOnload" ></Script>
      <Footer />
    </div>
  );
}