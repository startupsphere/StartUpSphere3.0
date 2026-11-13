import React, { useState, useEffect } from "react";

/**
 * Minimal, smooth, and lightweight splash screen animation for StartUpSphere.
 * Plays on initial application boot and gracefully fades out.
 */
export default function SplashScreen({ onFinish, minDuration = 1600 }) {
  const [fading, setFading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger smooth enter animation
    const mountTimer = setTimeout(() => {
      setMounted(true);
    }, 50);

    // Trigger smooth fade out
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, minDuration);

    // Complete transition and notify parent to unmount
    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, minDuration + 550);

    return () => {
      clearTimeout(mountTimer);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [minDuration, onFinish]);

  const handleSkip = () => {
    if (!fading) {
      setFading(true);
      setTimeout(() => {
        if (onFinish) onFinish();
      }, 350);
    }
  };

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-slate-950 text-white select-none transition-all duration-500 ease-out cursor-pointer ${
        fading
          ? "opacity-0 pointer-events-none scale-105"
          : "opacity-100 pointer-events-auto scale-100"
      }`}
      aria-label="StartUpSphere Loading Splash Screen"
    >
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />

      {/* Main Brand Content Container */}
      <div
        className={`relative z-10 flex flex-col items-center justify-center transition-all duration-700 transform ease-out ${
          mounted
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-95"
        }`}
      >
        {/* Logo Icon with glowing ring */}
        <div className="relative mb-5 flex items-center justify-center">
          {/* Subtle spinning glow halo */}
          <div className="absolute inset-0 -m-3 rounded-full bg-gradient-to-tr from-blue-500/25 via-cyan-400/20 to-indigo-500/25 blur-md animate-pulse" />

          <div className="relative w-20 h-20 sm:w-24 sm:h-24 p-3.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center justify-center">
            <img
              src="/StartUpSphere_logo.png"
              alt="StartUpSphere Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_0_14px_rgba(56,189,248,0.55)] transition-transform duration-700 hover:scale-105"
            />
          </div>
        </div>

        {/* Brand Name Typography */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center">
            StartUp
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 ml-0.5">
              Sphere
            </span>
          </h1>
          <p className="text-[10px] sm:text-xs font-semibold tracking-[0.28em] text-blue-200/70 uppercase">
            Innovation Ecosystem
          </p>
        </div>

        {/* Minimal High-Tech Progress Line */}
        <div className="w-36 sm:w-44 h-[2px] bg-white/10 rounded-full overflow-hidden mt-7 relative">
          <div
            className={`h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 rounded-full transition-all ease-out ${
              mounted ? "w-full duration-1200" : "w-0 duration-0"
            }`}
          />
        </div>
      </div>

      {/* Subtle skip prompt */}
      <span className="absolute bottom-6 text-[11px] text-gray-500 tracking-wider font-medium opacity-50 hover:opacity-100 transition-opacity">
        Click anywhere to skip
      </span>
    </div>
  );
}
