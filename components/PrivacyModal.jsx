// components/PrivacyModal.jsx
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";

export default function PrivacyModal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="max-w-lg w-full rounded-2xl p-6 shadow-2xl"
            style={{ backgroundColor: "var(--white)", color: "var(--black)" }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold" style={{ color: "var(--black)" }}>
                Security & Privacy
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-100 transition"
                style={{ color: "var(--gray)" }}
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="space-y-3 text-sm" style={{ color: "var(--gray)" }}>
              <p><strong style={{ color: "var(--black)" }}>No Login Required</strong> – You can use AR Studio without creating an account. No personal information is collected.</p>
              <p><strong style={{ color: "var(--black)" }}>Data Processing</strong> – All media processing happens locally in your browser. Your files are never uploaded to any server.</p>
              <p><strong style={{ color: "var(--black)" }}>Cookies</strong> – We only use local storage for theme preferences and custom color settings. No tracking cookies are used.</p>
              <p><strong style={{ color: "var(--black)" }}>Your Privacy Matters</strong> – We do not share, sell, or store your data. Everything stays on your device.</p>
            </div>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 rounded-full font-medium transition hover:opacity-80"
              style={{ backgroundColor: "var(--red", color: "var(--white)" }}
            >
              Got it
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}