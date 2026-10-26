import React, { useState, useRef, useEffect } from "react";
import { HelpCircle, Info, ChevronRight, X } from "lucide-react";

const TOOLTIP_PRESETS = {
  TRL: {
    title: "Technology Readiness Level (TRL)",
    badge: "Maturity Scale 1–9",
    summary:
      "A globally recognized framework used to estimate technology maturity from early research to operational deployment.",
    sections: [
      {
        stage: "TRL 1–3: Research & Concept",
        color: "bg-emerald-500",
        desc: "Basic principles observed, technology concept formulated, and experimental proof-of-concept established.",
      },
      {
        stage: "TRL 4–6: Prototype & Validation",
        color: "bg-amber-500",
        desc: "Component validation in laboratory, subsystem testing, and prototype demonstrated in relevant simulated environment.",
      },
      {
        stage: "TRL 7–9: Commercial & Deployed",
        color: "bg-rose-500",
        desc: "System prototype demonstrated in real operational environment, qualified system proven in live market conditions.",
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
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const preset = type && TOOLTIP_PRESETS[type] ? TOOLTIP_PRESETS[type] : null;
  const resolvedTitle = title || preset?.title;
  const resolvedSummary = content || preset?.summary;

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen]);

  const iconSizes = {
    xs: "h-3.5 w-3.5",
    sm: "h-4 w-4",
    md: "h-4.5 w-4.5",
  };

  const positionClasses = {
    top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
    left: "right-full mr-2 top-1/2 -translate-y-1/2",
    right: "left-full ml-2 top-1/2 -translate-y-1/2",
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center align-middle ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="inline-flex items-center justify-center p-0.5 text-gray-400 hover:text-indigo-600 focus:text-indigo-600 rounded-full transition-colors focus:outline-none cursor-pointer"
        aria-label={resolvedTitle || "More information"}
        title={resolvedTitle || "More information"}
      >
        <HelpCircle className={`${iconSizes[size] || iconSizes.sm} transition-transform hover:scale-110`} />
      </button>

      {isOpen && (
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
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
              aria-label="Close tooltip"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Body Content */}
          <p className="text-slate-300 leading-relaxed text-[11.5px] font-normal">
            {resolvedSummary}
          </p>

          {/* TRL Stage Details if available */}
          {preset?.sections && (
            <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1.5">
              {preset.sections.map((sec, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-slate-800/60 p-1.5 rounded-lg border border-slate-700/40">
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
