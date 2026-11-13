import React, { useState, useEffect } from "react";

/**
 * Minimal, smooth splash screen displaying strictly the official StartUpSphere logo.
 * Features an organic easing entrance and an ultra-smooth fade & zoom exit transition.
 */
export default function SplashScreen({ onFinish, minDuration = 1500 }) {
  const [fading, setFading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Gentle entry
    const mountTimer = setTimeout(() => {
      setMounted(true);
    }, 40);

    // Trigger smooth exit transition
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, minDuration);

    // Unmount from DOM after transition completes
    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, minDuration + 700);

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
      }, 500);
    }
  };

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[999999] flex items-center justify-center bg-white select-none transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer overflow-hidden ${
        fading
          ? "opacity-0 pointer-events-none scale-105"
          : "opacity-100 pointer-events-auto scale-100"
      }`}
      aria-label="StartUpSphere Splash Screen"
    >
      {/* Subtle ambient lighting behind logo */}
      <div
        className={`absolute w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-blue-400/10 via-cyan-400/10 to-indigo-400/10 blur-3xl pointer-events-none transition-opacity duration-1000 ${
          fading ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Official StartUpSphere Logo (strictly the image, no extra text) */}
      <div
        className={`relative z-10 p-6 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
          !mounted
            ? "opacity-0 scale-90 translate-y-2 filter blur-sm"
            : fading
            ? "opacity-0 scale-105 filter blur-[1px] duration-700"
            : "opacity-100 scale-100 translate-y-0 filter blur-0"
        }`}
      >
        <img
          src="/StartUpSphere_loginLogo.png"
          alt="StartUpSphere"
          className="w-56 sm:w-72 md:w-80 h-auto max-w-[85vw] object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.06)]"
        />
      </div>
    </div>
  );
}
