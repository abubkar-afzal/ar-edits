// components/ThemePickerCompact.jsx
import { useContext, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { AppContext } from "../pages/_app";
import {
  FaSun,
  FaMoon,
  FaRobot,
  FaLeaf,
  FaChevronDown,
  FaPalette,
  FaCheck,
  FaUndo,
  FaTimes,
} from "react-icons/fa";

const themes = [
  { name: "light", label: "Light", icon: <FaSun /> },
  { name: "dark", label: "Dark", icon: <FaMoon /> },
  { name: "cyberpunk", label: "Cyberpunk", icon: <FaRobot /> },
  { name: "nature", label: "Nature", icon: <FaLeaf /> },
];

const colorKeys = [
  "white", "black", "gray", "lightgray", "darkgray",
  "red", "green", "blue", "yellow", "purple", "pink", "orange", "cyan",
];

export default function ThemePickerCompact() {
  const { theme, setTheme, customColors, setCustomColors } = useContext(AppContext);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("themes"); 
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && !triggerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  const handleColorChange = (key, value) => {
    const updated = { ...(customColors || {}), [key]: value };
    setCustomColors(updated);
  };

  const resetColors = () => {
    setCustomColors(null);
  };

  const currentTheme = themes.find(t => t.name === theme) || themes[0];

  const dropdownContent = isOpen && createPortal(
    <>
      {/* Mobile Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 sm:hidden"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        onClick={() => setIsOpen(false)}
      />

      {/* Dropdown Panel */}
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="fixed z-50 shadow-2xl border overflow-hidden flex flex-col"
        style={{
          backgroundColor: "var(--white)",
          borderColor: "var(--border)",
          borderRadius: "20px",
          
          // ─── MOBILE (Smaller Bottom Sheet) ───
          bottom: "1rem",
          left: "1rem",
          right: "1rem",
          maxWidth: "420px",
          maxHeight: "60vh", // Prevents it from being too tall
          marginLeft: "auto",
          marginRight: "auto",

          // ─── DESKTOP (Compact dropdown near button) ───
          "@media (minWidth: 640px)": {
            top: "auto !important",
            left: "auto !important",
            right: "-10px !important", // Aligns neatly with button
            bottom: "calc(100% + 12px) !important",
            width: "340px !important", // Smaller, cleaner desktop size
            maxHeight: "440px !important",
            margin: "0 !important",
          }
        }}
      >
        {/* ─── Header ───────────────────────────────────── */}
        <div className="flex items-center justify-between p-4 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--red)" }}>
              <FaPalette size={13} style={{ color: "var(--white)" }} />
            </div>
            <h3 className="text-sm font-bold" style={{ color: "var(--black)" }}>Appearance</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-100"
            style={{ color: "var(--gray)" }}
          >
            <FaTimes size={13} />
          </button>
        </div>

        {/* ─── Tabs (Removed Emojis) ──────────────────────*/}
        <div className="flex gap-1 p-2 mx-3 mt-2 rounded-xl shrink-0" style={{ backgroundColor: "var(--lightgray)" }}>
          {["themes", "custom"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === tab ? "shadow-sm" : ""
              }`}
              style={{
                backgroundColor: activeTab === tab ? "var(--white)" : "transparent",
                color: activeTab === tab ? "var(--black)" : "var(--gray)",
              }}
            >
              {tab === "themes" ? "Themes" : "Custom"}
            </button>
          ))}
        </div>

        {/* ─── Content ──────────────────────────────────── */}
        <div className="p-3 overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            {activeTab === "themes" ? (
              <motion.div
                key="themes"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-2 gap-2"
              >
                {themes.map((t) => (
                  <motion.button
                    key={t.name}
                    onClick={() => handleThemeChange(t.name)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200 cursor-pointer relative"
                    style={{
                      borderColor: theme === t.name ? "var(--red)" : "var(--border)",
                      backgroundColor: theme === t.name ? "var(--red)" : "var(--white)",
                    }}
                  >
                    <span className="text-xl" style={{ color: theme === t.name ? "var(--white)" : "var(--gray)" }}>
                      {t.icon}
                    </span>
                    <span className="text-xs font-bold" style={{ color: theme === t.name ? "var(--white)" : "var(--black)" }}>
                      {t.label}
                    </span>
                    {theme === t.name && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "rgba(255,255,255,0.3)" }}
                      >
                        <FaCheck size={8} style={{ color: "var(--white)" }} />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="custom"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-[10px] font-medium mb-3" style={{ color: "var(--gray)" }}>
                  Customize individual colors for your theme.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {colorKeys.map((key) => (
                    <div
                      key={key}
                      className="flex items-center justify-between px-3 py-2 rounded-xl transition-colors cursor-pointer"
                      style={{ backgroundColor: "var(--lightgray)" }}
                    >
                      <span className="text-[10px] font-semibold capitalize" style={{ color: "var(--black)" }}>
                        {key}
                      </span>
                      <input
                        type="color"
                        value={(customColors && customColors[key]) || "#000000"}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        className="w-6 h-6 p-0 border-2 rounded-md cursor-pointer"
                        style={{ borderColor: "var(--border)" }}
                      />
                    </div>
                  ))}
                </div>
                <motion.button
                  onClick={resetColors}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-3 w-full px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2 transition-all"
                  style={{
                    backgroundColor: "var(--lightgray)",
                    color: "var(--red)",
                  }}
                >
                  <FaUndo size={11} />
                  Reset All Colors
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>,
    document.body
  );

  return (
    <div ref={triggerRef} className="relative">
      {/* ─── Trigger Button ────────────────────────────────── */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full border-2 text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer"
        style={{
          backgroundColor: "var(--white)",
          borderColor: isOpen ? "var(--red)" : "var(--border)",
          color: "var(--black)",
          boxShadow: isOpen ? "0 4px 20px rgba(37,99,235,0.15)" : "none",
        }}
      >
        <span style={{ color: "var(--red)" }}>{currentTheme.icon}</span>
        <span className="hidden sm:inline">Theme</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ color: "var(--gray)", fontSize: "10px" }}
        >
          <FaChevronDown />
        </motion.span>
      </motion.button>

      {/* ─── Render Portal Content ─────────────────────────── */}
      {dropdownContent}
    </div>
  );
}