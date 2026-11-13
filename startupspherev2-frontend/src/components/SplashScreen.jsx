import React, { useState, useEffect } from "react";

/**
 * Minimal, smooth splash screen displaying the official StartUpSphere logo
 * with strict copy, drag, save, and inspect prevention protections.
 */
const LOADING_STEPS = [
  { label: "Initializing ecosystem core...", progress: 25 },
  { label: "Loading geospatial 3D map & coordinates...", progress: 55 },
  { label: "Synchronizing startup directories & analytics...", progress: 85 },
  { label: "Readying StartUpSphere...", progress: 100 },
];

export default function SplashScreen({ onFinish, minDuration = 2200 }) {
  const [fading, setFading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Prevent DevTools shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S) during splash
    const handleKeyDown = (e) => {
      const key = e.key ? e.key.toUpperCase() : "";
      if (
        key === "F12" ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ["I", "J", "C"].includes(key)) ||
        ((e.ctrlKey || e.metaKey) && ["U", "S"].includes(key)) ||
        (e.metaKey && e.altKey && ["I", "J", "C"].includes(key))
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });

    // Gentle entrance
    const mountTimer = setTimeout(() => {
      setMounted(true);
    }, 40);

    // Step 1: 550ms
    const step1Timer = setTimeout(() => {
      setStepIndex(1);
    }, 550);

    // Step 2: 1200ms
    const step2Timer = setTimeout(() => {
      setStepIndex(2);
    }, 1200);

    // Step 3: 1800ms
    const step3Timer = setTimeout(() => {
      setStepIndex(3);
    }, 1800);

    // Trigger smooth exit transition after all assets ready
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, minDuration);

    // Unmount from DOM after transition completes
    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, minDuration + 700);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      clearTimeout(mountTimer);
      clearTimeout(step1Timer);
      clearTimeout(step2Timer);
      clearTimeout(step3Timer);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [minDuration, onFinish]);

  const currentStep = LOADING_STEPS[stepIndex] || LOADING_STEPS[0];

  const preventActions = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  return (
    <div
      onContextMenu={preventActions}
      onDragStart={preventActions}
      onCopy={preventActions}
      onCut={preventActions}
      className={`fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-white transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-default overflow-hidden ${
        fading
          ? "opacity-0 pointer-events-none scale-105"
          : "opacity-100 pointer-events-auto scale-100"
      }`}
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
        WebkitTouchCallout: "none",
      }}
      aria-label="StartUpSphere Splash Screen"
    >
      {/* Subtle ambient lighting behind logo */}
      <div
        className={`absolute w-96 h-96 sm:w-[480px] sm:h-[480px] rounded-full bg-gradient-to-tr from-blue-400/10 via-cyan-400/10 to-indigo-400/10 blur-3xl pointer-events-none transition-opacity duration-1000 ${
          fading ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Main Logo & Loading Context Container */}
      <div
        className={`relative z-10 flex flex-col items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
          !mounted
            ? "opacity-0 scale-90 translate-y-2 filter blur-sm"
            : fading
            ? "opacity-0 scale-105 filter blur-[1px] duration-700"
            : "opacity-100 scale-100 translate-y-0 filter blur-0"
        }`}
      >
        {/* Protected Official StartUpSphere Logo (with transparent click-shield & non-draggable attributes) */}
        <div
          className="relative p-4 sm:p-6 flex items-center justify-center"
          onContextMenu={preventActions}
          onDragStart={preventActions}
        >
          {/* Transparent security shield overlaid directly above the logo to absorb mouse/touch events */}
          <div
            className="absolute inset-0 z-30 pointer-events-auto cursor-default"
            onContextMenu={preventActions}
            onDragStart={preventActions}
          />

          <img
            src="/StartUpSphere_loginLogo.png"
            alt="StartUpSphere"
            draggable={false}
            onDragStart={preventActions}
            onContextMenu={preventActions}
            className="relative z-10 w-72 sm:w-96 md:w-[420px] lg:w-[450px] h-auto max-w-[90vw] object-contain drop-shadow-[0_12px_30px_rgba(0,0,0,0.06)] pointer-events-none select-none"
            style={{
              pointerEvents: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none",
            }}
          />
        </div>

        {/* Loading Context & Sleek Progress Indicator */}
        <div className="mt-4 sm:mt-6 flex flex-col items-center space-y-2.5">
          {/* Progress Bar Track */}
          <div className="w-52 sm:w-64 h-[3px] bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${currentStep.progress}%` }}
            />
          </div>

          {/* Context status text of assets being loaded */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 tracking-wide h-5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span
              key={stepIndex}
              className="transition-opacity duration-300 opacity-90"
            >
              {currentStep.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
