// components/EditorWorkspace.jsx
import { useState } from 'react';
import PhotoEditor from './PhotoEditor';
import VideoCombiner from './VideoCombiner';
import AudioEditor from './AudioEditor';
import VideoToAudioConverter from './VideoToAudioConverter';
import PhotoCollageEditor from './PhotoCollageEditor';
import VideoCollageEditor from './VideoCollageEditor';

export default function EditorWorkspace({ type, onExit }) {
  const [error, setError] = useState(null);

  // Fallback "Enter Fullscreen" button in case auto‑fullscreen was blocked
  const requestFullscreen = () => {
    const el = document.fullscreenElement || document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch((e) => setError('Fullscreen denied. Please click the button.'));
    }
  };

  // Render the correct editor based on type
  const renderEditor = () => {
    switch (type) {
      case 'photo':
        return <PhotoEditor />;
      case 'video':
        return <VideoCombiner />;
      case 'audio':
        return <AudioEditor />;
      case 'video-to-audio':
        return <VideoToAudioConverter />;
      case 'photo-collage':
        return <PhotoCollageEditor />;
      case 'video-collage':
        return <VideoCollageEditor />;
      default:
        return <div className="text-red-500 text-center mt-20">Unknown editor type: {type}</div>;
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Top bar with Exit and Fullscreen controls */}
      <div className="flex justify-between items-center p-4 bg-surface bg-opacity-90 backdrop-blur-md absolute top-0 left-0 right-0 z-10">
        <h2 className="text-xl font-bold text-primary">
          {type === 'photo' ? '📷 Photo Editor' :
           type === 'video' ? '🎬 Video Combinor' :
           type === 'audio' ? '🎵 Audio Editor' :
           type === 'video-to-audio' ? '🎬➡🎵 Converter' :
           type === 'photo-collage' ? '📷 Photo Collage' :
           type === 'video-collage' ? '🎬 Video Collage' : 'Editor'}
        </h2>
        <div className="flex gap-4">
          <button
            onClick={requestFullscreen}
            className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary transition-colors"
          >
            Enter Fullscreen
          </button>
          <button
            onClick={onExit}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold"
          >
            Exit Editor
          </button>
        </div>
      </div>

      {/* Editor content fills the remaining space */}
      <div className="flex-1 mt-16 overflow-auto">
        {error && (
          <div className="bg-red-800 text-white p-2 text-center">{error}</div>
        )}
        {renderEditor()}
      </div>
    </div>
  );
}