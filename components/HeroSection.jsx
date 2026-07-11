// components/HeroSection.jsx
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useCallback } from "react";
import { FaGamepad, FaInfoCircle, FaThLarge } from "react-icons/fa";
import {
  FiCamera, FiVideo, FiMusic, FiZap, FiStar,
} from "react-icons/fi";

function GradientOrb() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-[120px]"
        style={{
          background: "linear-gradient(135deg, var(--red), var(--purple), var(--cyan))",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
        animate={{
          scale: [1, 1.15, 1],
          rotate: [0, 15, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full blur-[100px]"
        style={{
          background: "linear-gradient(135deg, var(--orange), var(--pink), var(--red))",
          top: "60%",
          left: "30%",
        }}
        animate={{
          scale: [1.1, 0.9, 1.1],
          x: [-50, 50, -50],
          y: [-30, 30, -30],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
      />
      <motion.div
        className="absolute w-[250px] h-[250px] rounded-full blur-[80px]"
        style={{
          background: "linear-gradient(135deg, var(--green), var(--teal))",
          top: "30%",
          left: "65%",
        }}
        animate={{
          scale: [0.9, 1.1, 0.9],
          x: [30, -30, 30],
          y: [20, -20, 20],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
    </div>
  );
}



function TextReveal({ children, delay }) {
  return (
    <div className="overflow-hidden">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{
          duration: 0.8,
          delay: delay,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function StatsRing() {
  const stats = [
    { value: "10K+", label: "Users" },
    { value: "7", label: "Tools" },
    { value: "4.9", label: "Rating" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 2, duration: 0.8 }}
      className="hidden md:flex items-center gap-0"
    >
      {stats.map((stat, idx) => (
        <div key={idx} className="flex items-center">
          <div className="text-center px-4">
            <div className="text-2xl font-bold" style={{ color: "var(--black)" }}>
              {stat.value}
            </div>
            <div className="text-xs" style={{ color: "var(--gray)" }}>
              {stat.label}
            </div>
          </div>
          {idx < stats.length - 1 && (
            <div
              className="w-px h-10"
              style={{ backgroundColor: "var(--border)" }}
            />
          )}
        </div>
      ))}
    </motion.div>
  );
}

export default function HeroSection() {
  const sectionRef = useRef(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.95]);

  

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20 pb-10 overflow-hidden"
      style={{ backgroundColor: "var(--white)" }}
    >
      <GradientOrb />

      <motion.div
        className="relative z-10 max-w-5xl mx-auto"
        style={{ y, scale, opacity }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold tracking-wide mb-8 backdrop-blur-sm border"
          style={{
            backgroundColor: "var(--white)",
            borderColor: "var(--border)",
            color: "var(--black)",
          }}
        >
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <FiStar size={16} style={{ color: "var(--orange)" }} />
          </motion.span>
          No Signup Required • Free Forever
        </motion.div>

        <div className="mb-6 space-y-2">
          <TextReveal delay={0.5}>
            <h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none"
              style={{ color: "var(--black)" }}
            >
              Create Without
            </h1>
          </TextReveal>
          <TextReveal delay={0.7}>
            <h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none"
              style={{
                background: "linear-gradient(135deg, var(--red), var(--purple), var(--cyan))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Limits
            </h1>
          </TextReveal>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="text-base sm:text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
          style={{ color: "var(--gray)" }}
        >
          A free, browser based creative suite with powerful tools for photos,
          videos, audio, and games. Everything runs locally your files never leave your device.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-12"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" })
            }
            className="px-8 py-4 rounded-full font-semibold text-base sm:text-lg shadow-xl flex items-center gap-2 cursor-pointer"
            style={{
              backgroundColor: "var(--red)",
              color: "var(--white)",
              boxShadow: "0 8px 32px rgba(37, 99, 235, 0.3)",
            }}
          >
            Explore Tools <FaThLarge size={20} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              document.getElementById("games")?.scrollIntoView({ behavior: "smooth" })
            }
            className="px-8 py-4 rounded-full font-semibold text-base sm:text-lg shadow-xl flex items-center gap-2 cursor-pointer"
            style={{
              backgroundColor: "var(--green)",
              color: "var(--white)",
              boxShadow: "0 8px 32px rgba(249, 115, 22, 0.3)",
            }}
          >
            Play Games <FaGamepad size={20} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
            }
            className="px-8 py-4 rounded-full font-semibold text-base sm:text-lg flex items-center gap-2 backdrop-blur-sm cursor-pointer"
            style={{
              backgroundColor: "var(--blue)",
              color: "var(--white)",
            }}
          >
            <FaInfoCircle size={20} /> How it Works
          </motion.button>
        </motion.div>

        <StatsRing />
      </motion.div>

      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{
          background: "linear-gradient(to top, var(--lightgray), transparent)",
        }}
      />
    </section>
  );
}