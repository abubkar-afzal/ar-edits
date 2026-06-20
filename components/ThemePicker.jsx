// components/ThemePickerCompact.jsx
import { useContext, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppContext } from "../pages/_app";
import {
  FaSun,
  FaMoon,
  FaRobot,
  FaLeaf,
  FaChevronDown,
  FaPalette,
  FaChevronUp,
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
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-medium transition-colors duration-300"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
          color: "var(--text)",
        }}
      >
        <FaPalette className="text-base" style={{ color: "var(--primary)" }} />
        <span className="hidden sm:inline">Theme</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FaChevronDown />
        </motion.span>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 bottom-full mb-2 w-72 rounded-xl border shadow-2xl p-4 z-50"
            style={{
              backgroundColor: "var(--white)",
              borderColor: "var(--border)",
              backdropFilter: "none",  // solid background
              WebkitBackdropFilter: "none",
            }}
          >
            {/* Theme selection */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {themes.map((t) => (
                <motion.button
                  key={t.name}
                  onClick={() => handleThemeChange(t.name)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    theme === t.name ? "font-semibold" : ""
                  }`}
                  style={{
                    color: "var(--text)",
                    backgroundColor: theme === t.name ? "var(--hover)" : "var(--bg)",
                    border: theme === t.name ? "1px solid var(--primary)" : "1px solid transparent",
                  }}
                >
                  {t.icon}
                  {t.label}
                </motion.button>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t mb-3" style={{ borderColor: "var(--border)" }} />

            {/* Custom Colors Toggle */}
            <motion.button
              onClick={() => setIsCustomOpen(!isCustomOpen)}
              className="w-full flex items-center justify-between text-sm font-semibold cursor-pointer px-2 py-1.5 rounded-lg hover:bg-black/5 transition-colors"
              style={{ color: "var(--primary)" }}
            >
              <span>Custom Colors</span>
              <motion.span
                animate={{ rotate: isCustomOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <FaChevronDown />
              </motion.span>
            </motion.button>

            {/* Custom Colors Panel */}
            <AnimatePresence>
              {isCustomOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: "auto", opacity: 1, marginTop: 8 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="grid grid-cols-2 gap-2">
                    {colorKeys.map((key) => (
                      <div key={key} className="flex items-center gap-2">
                        <label
                          className="text-xs capitalize flex-1 truncate"
                          style={{ color: "var(--text)" }}
                        >
                          {key}
                        </label>
                        <input
                          type="color"
                          value={(customColors && customColors[key]) || "#000000"}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          className="w-6 h-6 p-0 border-0 cursor-pointer rounded-full"
                        />
                      </div>
                    ))}
                  </div>
                  <motion.button
                    onClick={resetColors}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="mt-3 w-full px-4 py-1.5 text-sm rounded-lg font-medium transition-colors"
                    style={{
                      backgroundColor: "var(--primary)",
                      color: "#fff",
                    }}
                  >
                    Reset to Theme Defaults
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}