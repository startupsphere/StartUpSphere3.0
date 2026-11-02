import React, { useState, useRef, useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { HelpCircle, Info, ChevronRight, X, Check, ExternalLink, Layers, Sparkles } from "lucide-react";

export const TOOLTIP_PRESETS = {
  TRL: {
    title: "Technology Readiness Level (TRL)",
    badge: "Scale 1 to 9",
    summary:
      "TRL is a practical 9-level scale used globally to measure how mature a technology or product is — from an initial napkin idea (Level 1) to a fully deployed commercial product with paying customers (Level 9).",
    guidance:
      "Select the level that matches your technology's CURRENT tested capability. If you are between levels, pick the highest level where testing is already completed.",
    sections: [
      {
        stage: "TRL 1–3: Research & Ideation",
        color: "bg-emerald-500",
        badge: "Concept Phase",
        desc: "Basic principles explored, practical concept designed, and proof of concept verified in lab or test scripts.",
      },
      {
        stage: "TRL 4–6: Prototype & Validation",
        color: "bg-amber-500",
        badge: "Development Phase",
        desc: "Lab prototype built, integrated system tested in realistic conditions, and full prototype demonstrated to users or partners.",
      },
      {
        stage: "TRL 7–9: Commercial & Deployed",
        color: "bg-blue-500",
        badge: "Market Phase",
        desc: "Tested in live daily operations, fully qualified and certified solution, and actively operating at scale in the commercial market.",
      },
    ],
    levels: [
      {
        level: 1,
        code: "TRL 1",
        name: "Basic Idea & Principles",
        stage: "Research Phase",
        phase: "1-3",
        color: "emerald",
        badgeBg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        pillBg: "bg-emerald-500",
        plainExplanation:
          "You have an initial idea based on scientific discoveries, technical concepts, or market observation. Nothing has been built or coded yet.",
        example:
          "Concept notes, scientific papers, whiteboard sketches, or early problem exploration.",
      },
      {
        level: 2,
        code: "TRL 2",
        name: "Practical Concept Formulated",
        stage: "Research Phase",
        phase: "1-3",
        color: "emerald",
        badgeBg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        pillBg: "bg-emerald-500",
        plainExplanation:
          "You have outlined how your idea can solve a real-world problem. The technical concept, system architecture, or basic feature set has been planned.",
        example:
          "Technical specifications, system architecture flowcharts, wireframe drafts, or preliminary patent claims.",
      },
      {
        level: 3,
        code: "TRL 3",
        name: "Proof of Concept (PoC)",
        stage: "Research Phase",
        phase: "1-3",
        color: "emerald",
        badgeBg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        pillBg: "bg-emerald-500",
        plainExplanation:
          "You built an early experiment, simple test script, or lab test that proves the core technology is technically feasible and can actually work.",
        example:
          "A crude algorithm test, sample lab test, or bench experiment showing the core feature works.",
      },
      {
        level: 4,
        code: "TRL 4",
        name: "Lab / Development Prototype",
        stage: "Prototype Phase",
        phase: "4-6",
        color: "amber",
        badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        pillBg: "bg-amber-500",
        plainExplanation:
          "Basic components of your solution are connected and tested together in a controlled lab or local development environment (Alpha version).",
        example:
          "Local software prototype running on developer computers, or assembled hardware parts tested in a workshop.",
      },
      {
        level: 5,
        code: "TRL 5",
        name: "Realistic Prototype Testing",
        stage: "Prototype Phase",
        phase: "4-6",
        color: "amber",
        badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        pillBg: "bg-amber-500",
        plainExplanation:
          "The prototype is tested under realistic conditions that closely mirror the real world, using simulated datasets, real devices, or staging servers.",
        example:
          "Beta software deployed to a staging server tested with realistic loads, or hardware tested under simulated temperatures/weather.",
      },
      {
        level: 6,
        code: "TRL 6",
        name: "Working Prototype Demonstration",
        stage: "Prototype Phase",
        phase: "4-6",
        color: "amber",
        badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        pillBg: "bg-amber-500",
        plainExplanation:
          "A fully functional prototype or Minimum Viable Product (MVP) has been successfully demonstrated to prospective customers, partners, or investors in a realistic operational setting.",
        example:
          "A working MVP tested in a private closed pilot with early design partners.",
      },
      {
        level: 7,
        code: "TRL 7",
        name: "Real-World Field Demonstration",
        stage: "Commercial Phase",
        phase: "7-9",
        color: "blue",
        badgeBg: "bg-blue-500/15 text-blue-300 border-blue-500/30",
        pillBg: "bg-blue-500",
        plainExplanation:
          "The complete system is deployed and operated by actual end users or client organizations in real daily operational conditions (Public Beta / Live Pilot).",
        example:
          "A live customer pilot project operating in a real client's business, or public beta with real active users.",
      },
      {
        level: 8,
        code: "TRL 8",
        name: "Complete & Qualified Solution",
        stage: "Commercial Phase",
        phase: "7-9",
        color: "blue",
        badgeBg: "bg-blue-500/15 text-blue-300 border-blue-500/30",
        pillBg: "bg-blue-500",
        plainExplanation:
          "The final product is complete, fully tested, debugged, certified, and proven to work reliably for all intended users. Ready for general commercial rollout.",
        example:
          "Production-ready release with complete documentation, security testing, and regulatory certifications.",
      },
      {
        level: 9,
        code: "TRL 9",
        name: "Market-Proven & Deployed",
        stage: "Commercial Phase",
        phase: "7-9",
        color: "blue",
        badgeBg: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
        pillBg: "bg-indigo-500",
        plainExplanation:
          "The product is commercially launched, operating at scale in the market with active paying customers, regular sales, and continuous support.",
        example:
          "Commercially active product with recurring paying customers and stable ongoing operations.",
      },
    ],
  },
  IDI: {
    title: "Innovation Density Index (IDI)",
    badge: "Ecosystem Metric",
    summary:
      "Measures the concentration and velocity of active startups, research spin-offs, and tech ventures per geographic cluster.",
    guidance: "Higher values indicate a dense, fertile cluster of innovation and startup creation.",
  },
  SI: {
    title: "Support Index (SI)",
    badge: "Infrastructure Metric",
    summary:
      "Assesses the accessibility, capacity, and distribution of incubators, accelerators, HEI labs, and venture facilitators.",
    guidance: "Higher values signal strong backing infrastructure for growing founders.",
  },
  EBS: {
    title: "Ecosystem Balance Score (EBS)",
    badge: "Health Gauge 0–10",
    summary:
      "Measures structural harmony between startup demand and available institutional resources. 7+ indicates optimal equilibrium.",
    guidance: "Healthy balance ensures startups have continuous access to capital and mentorship without bottlenecks.",
  },
  EGS: {
    title: "Ecosystem Gap Score (EGS)",
    badge: "Friction Gauge 0–10",
    summary:
      "Identifies unaddressed deficits across early-stage seed funding, regulatory barriers, and technical talent pipelines.",
    guidance: "Lower scores represent a frictionless environment with fewer unmet structural needs.",
  },
  BIR: {
    title: "BIR Registration (Bureau of Internal Revenue)",
    badge: "Tax Compliance",
    summary:
      "Official registration with the Philippine Bureau of Internal Revenue (BIR) for issuance of official receipts, TIN verification, and tax compliance.",
    guidance: "Essential for legitimate commercial operations, public procurement, and institutional investor due diligence.",
  },
  SEC: {
    title: "SEC Registration (Securities & Exchange Commission)",
    badge: "Corporate Legal Entity",
    summary:
      "Formal incorporation with the SEC as a Corporation (Stock/Non-stock) or One-Person Corporation (OPC) in the Philippines.",
  },
  DTI: {
    title: "DTI Registration (Department of Trade & Industry)",
    badge: "Sole Proprietorship",
    summary:
      "Official business name registration with the Department of Trade and Industry for individual founders and sole proprietors.",
  },
  GOV_REG: {
    title: "Government Registration Status",
    badge: "Legal Compliance",
    summary:
      "Verification that the entity is officially registered with Philippine regulatory agencies (BIR for taxes, SEC for corporations, DTI for sole proprietorships, or CDA for cooperatives).",
  },
};

export default function TooltipInfo({
  type,
  title,
  content,
  children,
  className = "",
  size = "sm",
  position = "top",
  onSelect,
  currentValue = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | '1-3' | '4-6' | '7-9'
  const containerRef = useRef(null);
  const modalRef = useRef(null);
  const dialogId = useId();

  const preset = type && TOOLTIP_PRESETS[type] ? TOOLTIP_PRESETS[type] : null;
  const resolvedTitle = title || preset?.title || "Information";
  const resolvedSummary = content || preset?.summary;
  const hasLevels = Boolean(preset?.levels);

  // Close when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Handle outside click for compact floating popover
  useEffect(() => {
    if (!isOpen || hasLevels) return; // Full modal handles backdrop clicks directly

    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen, hasLevels]);

  const iconSizes = {
    xs: "h-3.5 w-3.5",
    sm: "h-4 w-4",
    md: "h-5 w-5",
  };

  const buttonPadSizes = {
    xs: "p-0.5",
    sm: "p-1",
    md: "p-1.5",
  };

  const positionClasses = {
    top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
    left: "right-full mr-2 top-1/2 -translate-y-1/2",
    right: "left-full ml-2 top-1/2 -translate-y-1/2",
  };

  const filteredLevels = preset?.levels
    ? preset.levels.filter((lvl) => {
        if (activeTab === "all") return true;
        return lvl.phase === activeTab;
      })
    : [];

  const handleSelectLevel = (lvlCode) => {
    if (onSelect) {
      onSelect(lvlCode);
    }
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center align-middle ${className}`}
      {...(!hasLevels
        ? {
            onMouseEnter: () => setIsOpen(true),
            onMouseLeave: () => setIsOpen(false),
          }
        : {})}
    >
      {/* Clickable Help Button with Question-Mark Icon */}
      <button
        type="button"
        onClick={(e) => {
          // Prevent label default click behavior (which focuses the select or input)
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={`inline-flex items-center justify-center ${
          buttonPadSizes[size] || buttonPadSizes.sm
        } text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 rounded-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer shadow-xs`}
        aria-label={resolvedTitle || "More information"}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title={`Click for guide: ${resolvedTitle}`}
      >
        <HelpCircle
          className={`${
            iconSizes[size] || iconSizes.sm
          } transition-transform hover:scale-110`}
          strokeWidth={2.2}
        />
      </button>

      {/* RENDER MODE 1: Full-Featured Responsive Popover/Modal for TRL 1-9 Scale */}
      {isOpen && hasLevels && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[99999] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn"
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${dialogId}-title`}
              onClick={() => setIsOpen(false)} // Clicking backdrop closes without obstructing form
            >
              <div
                ref={modalRef}
                className="relative w-full max-w-2xl bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/80 flex flex-col max-h-[90vh] overflow-hidden my-auto animate-fadeIn"
                onClick={(e) => e.stopPropagation()} // Prevent backdrop click from inner card
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
                  <div className="min-w-0 flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex-shrink-0">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          id={`${dialogId}-title`}
                          className="font-bold text-white text-base sm:text-lg tracking-tight"
                        >
                          {resolvedTitle}
                        </h3>
                        {preset?.badge && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-500/25 text-indigo-300 border border-indigo-400/30 rounded-full">
                            {preset.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                        Simple guide to determine your startup's technology maturity (Levels 1 to 9).
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    aria-label="Close guide"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Sub-header / Summary */}
                <div className="px-5 py-3 bg-slate-800/40 border-b border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                  <p>{resolvedSummary}</p>
                  {preset?.guidance && (
                    <p className="mt-1.5 text-indigo-300 font-medium flex items-center gap-1.5">
                      <span>💡</span>
                      <span>{preset.guidance}</span>
                    </p>
                  )}
                </div>

                {/* Filter Tabs for Easy Browsing on Desktop & Mobile */}
                <div className="px-5 pt-3 pb-2 bg-slate-900 flex items-center gap-1.5 overflow-x-auto border-b border-slate-800 scrollbar-none">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1 flex-shrink-0">
                    Filter:
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("all")}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors flex-shrink-0 cursor-pointer ${
                      activeTab === "all"
                        ? "bg-indigo-600 text-white font-semibold"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                    }`}
                  >
                    All Levels (1–9)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("1-3")}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors flex-shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "1-3"
                        ? "bg-emerald-600 text-white font-semibold"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    TRL 1–3 Concept
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("4-6")}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors flex-shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "4-6"
                        ? "bg-amber-600 text-white font-semibold"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    TRL 4–6 Prototype
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("7-9")}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors flex-shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "7-9"
                        ? "bg-blue-600 text-white font-semibold"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-blue-400" />
                    TRL 7–9 Market
                  </button>
                </div>

                {/* Scrollable Levels List */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 divide-y divide-slate-800/60 max-h-[55vh]">
                  {filteredLevels.map((lvl) => {
                    const isCurrent =
                      currentValue &&
                      (currentValue === lvl.code ||
                        currentValue === String(lvl.level) ||
                        currentValue.startsWith(lvl.code));

                    return (
                      <div
                        key={lvl.level}
                        className={`pt-3.5 first:pt-0 rounded-xl p-3 sm:p-4 transition-all duration-150 ${
                          isCurrent
                            ? "bg-indigo-950/40 border-2 border-indigo-500/60"
                            : "bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2.5">
                          {/* Title & Stage */}
                          <div className="flex items-start gap-2.5">
                            <span
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg border flex-shrink-0 flex items-center gap-1.5 ${lvl.badgeBg}`}
                            >
                              <span className={`h-2 w-2 rounded-full ${lvl.pillBg}`} />
                              {lvl.code}
                            </span>
                            <div>
                              <h4 className="font-semibold text-white text-sm sm:text-base leading-snug">
                                {lvl.name}
                              </h4>
                              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                                {lvl.stage}
                              </span>
                            </div>
                          </div>

                          {/* Action button if onSelect provided */}
                          <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0 mt-1 sm:mt-0">
                            {isCurrent && (
                              <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-md flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                Selected
                              </span>
                            )}
                            {onSelect && (
                              <button
                                type="button"
                                onClick={() => handleSelectLevel(lvl.code)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                                  isCurrent
                                    ? "bg-indigo-600 text-white"
                                    : "bg-slate-700 hover:bg-indigo-600 text-slate-200 hover:text-white"
                                }`}
                              >
                                <span>{isCurrent ? "Keep Selected" : `Select ${lvl.code}`}</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Plain Language Explanation */}
                        <div className="mt-2.5 space-y-1.5 text-xs sm:text-sm">
                          <p className="text-slate-200 leading-relaxed font-normal">
                            {lvl.plainExplanation}
                          </p>
                          <div className="bg-slate-900/60 p-2 sm:p-2.5 rounded-lg border border-slate-700/40 text-[11px] sm:text-xs text-slate-400">
                            <span className="font-semibold text-slate-300">Real-world indicator: </span>
                            {lvl.example}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer with Clear Dismiss / Got It Button */}
                <div className="px-5 py-3.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[10px]">Esc</kbd> or click anywhere outside to close.
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-full sm:w-auto px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors cursor-pointer shadow-sm text-center"
                  >
                    Got It, Close Guide
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

      {/* RENDER MODE 2: Compact Inline Popover for Simple Indicators (IDI, SI, BIR, SEC, etc.) */}
      {isOpen && !hasLevels && (
        <div
          role="tooltip"
          className={`absolute z-[9999] w-72 sm:w-80 p-3.5 bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-xl shadow-2xl border border-slate-700/80 pointer-events-auto transition-all animate-fadeIn ${
            positionClasses[position] || positionClasses.top
          }`}
          style={{ maxWidth: "calc(100vw - 32px)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-2 mb-2 border-b border-slate-700/70">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-white text-xs tracking-wide">
                  {resolvedTitle}
                </span>
                {preset?.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded">
                    {preset.badge}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
              aria-label="Close tooltip"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Body Content */}
          <p className="text-slate-300 leading-relaxed text-[11.5px] font-normal">
            {resolvedSummary}
          </p>

          {/* Sections if present */}
          {preset?.sections && (
            <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1.5">
              {preset.sections.map((sec, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 bg-slate-800/60 p-1.5 rounded-lg border border-slate-700/40"
                >
                  <span className={`h-2 w-2 rounded-full mt-1 flex-shrink-0 ${sec.color}`} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-200 text-[11px] leading-tight">
                      {sec.stage}
                    </p>
                    <p className="text-slate-400 text-[10px] leading-normal mt-0.5">
                      {sec.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {preset?.guidance && (
            <p className="mt-2 text-[10.5px] text-indigo-300 font-medium italic border-t border-slate-800/80 pt-1.5">
              💡 {preset.guidance}
            </p>
          )}

          {children && <div className="mt-2 pt-2 border-t border-slate-800">{children}</div>}
        </div>
      )}
    </div>
  );
}
