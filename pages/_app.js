// pages/_app.js
import { useState, useEffect, createContext } from 'react';
import '../styles/globals.css';
import Head from 'next/head';

export const AppContext = createContext();

const THEMES = {
  light: {
    white: '#ffffff',
    black: '#111827',
    gray: '#6b7280',
    lightgray: '#f3f4f6',
    darkgray: '#374151',
    red: '#ef4444',
    green: '#22c55e',
    blue: '#3b82f6',
    yellow: '#f59e0b',
    purple: '#8b5cf6',
    pink: '#ec4899',
    orange: '#f97316',
    cyan: '#06b6d4',
    shadow: 'rgba(0,0,0,0.1)',
  },
  dark: {
    white: '#0f172a',
    black: '#f8fafc',
    gray: '#94a3b8',
    lightgray: '#1e293b',
    darkgray: '#334155',
    red: '#f87171',
    green: '#34d399',
    blue: '#60a5fa',
    yellow: '#fbbf24',
    purple: '#a78bfa',
    pink: '#f472b6',
    orange: '#fb923c',
    cyan: '#22d3ee',
    shadow: 'rgba(0,0,0,0.4)',
  },
  cyberpunk: {
    white: '#0d0221',
    black: '#f0f0f0',
    gray: '#9b6bc0',
    lightgray: '#1a0533',
    darkgray: '#2a0a4a',
    red: '#ff0066',
    green: '#00ff99',
    blue: '#00ccff',
    yellow: '#ffff00',
    purple: '#cc44ff',
    pink: '#ff44aa',
    orange: '#ff8800',
    cyan: '#00ffcc',
    shadow: 'rgba(255,0,127,0.3)',
  },
  nature: {
    white: '#f0fdf4',
    black: '#064e3b',
    gray: '#22c55e',
    lightgray: '#dcfce7',
    darkgray: '#15803d',
    red: '#dc2626',
    green: '#059669',
    blue: '#3b82f6',
    yellow: '#f59e0b',
    purple: '#8b5cf6',
    pink: '#ec4899',
    orange: '#f97316',
    cyan: '#06b6d4',
    shadow: 'rgba(5,150,105,0.2)',
  },
};

export default function App({ Component, pageProps }) {
  const [theme, setTheme] = useState('light');
  const [activeEditor, setActiveEditor] = useState(null);
  const [customColors, setCustomColors] = useState(null);

  const applyTheme = (themeName, custom) => {
    const base = THEMES[themeName] || THEMES.light;
    const final = { ...base, ...(custom || {}) };
    const root = document.documentElement;
    Object.entries(final).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
    root.setAttribute('data-theme', themeName);
    document.body.style.backgroundColor = final.white;
    document.body.style.color = final.black;
  };

  // ─── 1. Load saved theme ───
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedCustom = localStorage.getItem('customColors');
    let parsedCustom = null;
    if (savedCustom) {
      try { parsedCustom = JSON.parse(savedCustom); } catch (e) {}
    }
    setTheme(savedTheme);
    setCustomColors(parsedCustom);
    applyTheme(savedTheme, parsedCustom);
  }, []);

  // ─── 2. Re-apply when theme changes ───
  useEffect(() => {
    if (!theme) return;
    applyTheme(theme, customColors);
    localStorage.setItem('theme', theme);
    localStorage.setItem('customColors', JSON.stringify(customColors || {}));
  }, [theme, customColors]);

  // ─── 3. Block right‑click and drag (robust capture phase) ───
  useEffect(() => {
    const preventContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const preventDrag = (e) => {
      e.preventDefault();
      return false;
    };

    // Use capture: true to catch events before they bubble
    document.addEventListener('contextmenu', preventContextMenu, { capture: true });
    document.addEventListener('dragstart', preventDrag, { capture: true });

    // Also prevent on window (for iframes or edge cases)
    window.addEventListener('contextmenu', preventContextMenu, { capture: true });
    window.addEventListener('dragstart', preventDrag, { capture: true });

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu, { capture: true });
      document.removeEventListener('dragstart', preventDrag, { capture: true });
      window.removeEventListener('contextmenu', preventContextMenu, { capture: true });
      window.removeEventListener('dragstart', preventDrag, { capture: true });
    };
  }, []);

  const handleSetCustomColors = (newCustom) => {
    setCustomColors(newCustom);
  };

  return (
    <>
     <Head>
            {/* ─── Primary Meta Tags ──────────────────────────── */}
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="color-scheme" content="light dark" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="bingbot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />

        <title>AR Edits – Free Browser-Based Creative Suite</title>

          </Head>
    
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        activeEditor,
        setActiveEditor,
        customColors,
        setCustomColors: handleSetCustomColors,
      }}
    >
      <Component {...pageProps} />
    </AppContext.Provider></>
  );
}