import React, { useState } from "react";
import {
  FileText,
  Download,
  X,
  CheckCircle2,
  Filter,
  BarChart2,
  MapPin,
  ShieldCheck,
  Layers,
  Building,
  Loader2,
  Sparkles,
} from "lucide-react";
import { exportComprehensiveAnalyticsPdf } from "../utils/chartExportUtils";
import { toast } from "react-toastify";

export default function ExportReportModal({
  isOpen,
  onClose,
  activeFilters = {},
  kpis = {},
  geoData = [],
  industryScores = [],
  govCompliance = [],
  trlStages = [],
  topStartups = [],
  chartContainerIds = {},
}) {
  const [generating, setGenerating] = useState(false);
  const [includeDirectory, setIncludeDirectory] = useState(true);

  if (!isOpen) return null;

  const handleGeneratePdf = async () => {
    try {
      setGenerating(true);

      const startupsToInclude = includeDirectory ? topStartups : [];

      await exportComprehensiveAnalyticsPdf({
        activeFilters,
        kpis,
        geoData,
        industryScores,
        govCompliance,
        trlStages,
        topStartups: startupsToInclude,
        chartContainerIds,
      });

      toast.success("Ecosystem Analytics PDF Report downloaded successfully!");
      onClose();
    } catch (err) {
      console.error("Error generating comprehensive PDF report:", err);
      toast.error("Failed to generate PDF report. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 relative">
          <button
            onClick={onClose}
            disabled={generating}
            className="absolute top-5 right-5 text-gray-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-2">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <FileText className="w-5 h-5" />
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Automated PDF Generator
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Export Ecosystem Analytics Report
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200/90 mt-1">
            Generate and download a comprehensive, publication-ready PDF report based on your active analytics and filters.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-gray-600 flex-1">
          {/* Active Filters Scope Badge Box */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              <span>Applied Report Filters & Scope:</span>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-gray-200 font-medium text-gray-700">
                <span className="text-gray-400 font-normal">Industry:</span>
                <span className="font-semibold text-indigo-600">
                  {activeFilters.industry || "All Industries"}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-gray-200 font-medium text-gray-700">
                <span className="text-gray-400 font-normal">Registration:</span>
                <span className="font-semibold text-emerald-600">
                  {activeFilters.govReg || "All Statuses"}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-gray-200 font-medium text-gray-700">
                <span className="text-gray-400 font-normal">TRL Level:</span>
                <span className="font-semibold text-amber-600">
                  {activeFilters.trl || "All Levels"}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-gray-200 font-medium text-gray-700">
                <span className="text-gray-400 font-normal">Metric:</span>
                <span className="font-semibold text-purple-600 uppercase">
                  {activeFilters.metric || "OVERALL"}
                </span>
              </div>
            </div>
          </div>

          {/* Included Sections Checklist */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              Included in this PDF Report
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-100 bg-gray-50/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-800">Executive KPI Summary</p>
                  <p className="text-[11px] text-gray-500">
                    Total startups ({kpis.totalStartups || 0}), P{kpis.formattedFunding || "0"} funding, benchmark score ({kpis.avgScore || "N/A"}/100)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-100 bg-gray-50/60">
                <MapPin className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-800">Geographical Footprint</p>
                  <p className="text-[11px] text-gray-500">
                    Visual chart image & density breakdown across {geoData.length} Philippine cities
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-100 bg-gray-50/60">
                <BarChart2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-800">Industry Performance Scores</p>
                  <p className="text-[11px] text-gray-500">
                    Visual chart & score matrix (Growth, Ecosystem, Overall) by sector
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-100 bg-gray-50/60">
                <ShieldCheck className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-800">Gov. Regulatory Status</p>
                  <p className="text-[11px] text-gray-500">
                    Compliance chart & agency breakdown (BIR, SEC, DTI verified)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-100 bg-gray-50/60">
                <Layers className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-800">TRL Maturity Stages</p>
                  <p className="text-[11px] text-gray-500">
                    Concept (TRL 1-3), Prototype (TRL 4-6), Commercial (TRL 7-9)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-100 bg-gray-50/60">
                <Building className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-800">Filtered Startups Directory</p>
                    <input
                      type="checkbox"
                      checked={includeDirectory}
                      onChange={(e) => setIncludeDirectory(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                      title="Toggle Startups Directory in PDF"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Table of top ranked startups with scores and credentials
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-800 flex items-start gap-2">
            <span className="font-bold shrink-0">Note:</span>
            <span>
              The PDF will be generated immediately with active visual charts and precise data rows computed from your current selection.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={generating}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-200/70 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleGeneratePdf}
            disabled={generating}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md transition-all cursor-pointer ${
              generating
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25 active:scale-98"
            }`}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Capturing Visualizations & Building PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download PDF Report</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
