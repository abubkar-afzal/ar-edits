// components/Footer.jsx
import { useState } from "react";
import ThemePickerCompact from "./ThemePicker";
import PrivacyModal from "./PrivacyModal";

export default function Footer() {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  return (
    <>
      <footer
        className="py-8 px-6 border-t backdrop-blur-md"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Brand & tagline */}
          <div className="flex flex-col items-center md:items-start gap-1">
            <h3
              className="text-xl font-bold tracking-tight"
              style={{ color: "var(--primary)" }}
            >
              AR Studio
            </h3>
            <p
              className="text-xs tracking-wide"
              style={{ color: "var(--muted)" }}
            >
              Creative tools for everyone, free forever.
            </p>
          </div>

          {/* Center – links */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsPrivacyOpen(true)}
              className="text-sm font-medium hover:opacity-70 transition"
              style={{ color: "var(--text)" }}
            >
              Security & Privacy
            </button>
            <span style={{ color: "var(--muted)" }}>|</span>
            <span
              className="text-xs"
              style={{ color: "var(--muted)" }}
            >
              {`© ${new Date().getFullYear()} AR Studio. All rights reserved.`}
            </span>
          </div>

          {/* Right – theme picker */}
          <div className="flex items-center gap-4 cursor-pointer">
            <ThemePickerCompact />
          </div>
        </div>
      </footer>

      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
    </>
  );
}