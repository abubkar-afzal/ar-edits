// pages/index.js
import { useContext, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { AppContext } from "./_app";
import ThemePicker from "../components/ThemePicker";
import EditorWorkspace from "../components/EditorWorkspace";

// Dynamically import 3D component (SSR disabled)
const ThreeBackground = dynamic(() => import("../components/ThreeBackground"), {
  ssr: false,
});

export default function Home() {
  const { activeEditor, setActiveEditor } = useContext(AppContext);
  const editorContainerRef = useRef(null);

  // Launch an editor (triggered by user click) and request fullscreen
  const launchEditor = useCallback(
    (type) => {
      setActiveEditor(type);
      if (editorContainerRef.current) {
        editorContainerRef.current.classList.remove("hidden");
      }
      // Request fullscreen on the entire document (hides browser UI)
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn(
          "Auto fullscreen failed – use the button inside the editor.",
          err,
        );
      });
    },
    [setActiveEditor],
  );

  // Exit editor (called only from the "Exit Editor" button)
  const exitEditor = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setActiveEditor(null);
    if (editorContainerRef.current) {
      editorContainerRef.current.classList.add("hidden");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 3D Background – always visible behind everything */}
      <ThreeBackground />

      {/* Main Dashboard UI (hidden when an editor is active) */}
      <div
        className={`relative z-10 flex flex-col items-center justify-center min-h-screen ${activeEditor ? "hidden" : ""}`}
      >
        <h1 className="text-5xl font-bold mb-8 text-primary drop-shadow-lg">
          Creative Studio
        </h1>
        <p className="text-lg text-muted mb-12 max-w-2xl text-center">
          A free, browser‑based media editor with photo, video and audio tools.
          Pick your theme and dive into full‑screen editing.
        </p>

        {/* Launch buttons */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <button
            onClick={() => launchEditor("photo")}
            className="px-6 py-3 bg-primary text-white rounded-2xl shadow-lg hover:scale-105 transition-transform font-semibold"
          >
            📷 Photo Editor
          </button>
          <button
            onClick={() => launchEditor("video")}
            className="px-6 py-3 bg-primary text-white rounded-2xl shadow-lg hover:scale-105 transition-transform font-semibold"
          >
            🎬 Video Combinor
          </button>
          <button
            onClick={() => launchEditor("audio")}
            className="px-6 py-3 bg-primary text-white rounded-2xl shadow-lg hover:scale-105 transition-transform font-semibold"
          >
            🎵 Audio Editor
          </button>
          <button
            onClick={() => launchEditor("video-to-audio")}
            className="px-6 py-3 bg-accent text-white rounded-2xl shadow-lg hover:scale-105 transition-transform font-semibold"
          >
            🎬➡🎵 Video to Audio
          </button>
          <button
            onClick={() => launchEditor("photo-collage")}
            className="px-6 py-3 bg-primary text-white rounded-2xl shadow-lg hover:scale-105 transition-transform font-semibold"
          >
            📷 Photo Collage
          </button>
          <button
            onClick={() => launchEditor("video-collage")}
            className="px-6 py-3 bg-primary text-white rounded-2xl shadow-lg hover:scale-105 transition-transform font-semibold"
          >
            🎬 Video Collage
          </button>
        </div>

        <ThemePicker />
      </div>

      {/* Fullscreen Editor Container – hidden when no editor active */}
      {/* Fullscreen Editor Container */}
      <div
        ref={editorContainerRef}
        className={`fixed inset-0 z-50 bg-bg ${activeEditor ? "" : "hidden"}`}
        style={{ width: "100vw", height: "100vh" }}
      >
        {activeEditor && (
          <EditorWorkspace type={activeEditor} onExit={exitEditor} />
        )}
      </div>
    </div>
  );
}
