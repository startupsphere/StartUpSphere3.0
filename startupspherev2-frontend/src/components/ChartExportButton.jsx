import React, { useState, useRef, useEffect } from "react";
import { Download, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import {
  captureElementAsPng,
  downloadDataUrl,
  exportSingleChartPdf,
} from "../utils/chartExportUtils";
import { toast } from "react-toastify";

export default function ChartExportButton({
  chartId,
  chartTitle = "Chart",
  data = [],
  columns = [],
  summaryText = "",
  activeFilters = {},
  className = "",
  buttonSize = "sm", // "sm" | "xs"
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState(null); // "pdf" | "png" | null
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleExportPng = async () => {
    try {
      setLoading(true);
      setLoadingType("png");
      setOpen(false);

      const result = await captureElementAsPng(chartId);
      if (!result?.dataUrl) {
        toast.error("Failed to capture chart image. Please try again.");
        return;
      }

      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `${chartTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${dateStr}.png`;
      downloadDataUrl(result.dataUrl, filename);
      toast.success(`Exported ${chartTitle} as PNG image!`);
    } catch (err) {
      console.error("Error exporting chart PNG:", err);
      toast.error("Failed to export chart image.");
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleExportPdf = async () => {
    try {
      setLoading(true);
      setLoadingType("pdf");
      setOpen(false);

      await exportSingleChartPdf({
        chartTitle,
        containerId: chartId,
        data,
        columns,
        summaryText,
        activeFilters,
      });

      toast.success(`Exported ${chartTitle} PDF Report!`);
    } catch (err) {
      console.error("Error exporting chart PDF:", err);
      toast.error("Failed to generate chart PDF report.");
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  return (
    <div className={`relative inline-block text-left chart-export-ignore ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={loading}
        title={`Export ${chartTitle}`}
        aria-label={`Export ${chartTitle}`}
        className={`inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-2xs hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer ${
          buttonSize === "xs"
            ? "p-1 text-[11px] h-7 w-7"
            : "p-1.5 text-xs h-8 w-8"
        }`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white shadow-xl ring-1 ring-black/5 border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Export {chartTitle}
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportPdf}
            className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <div className="flex flex-col">
              <span>Export as PDF Report</span>
              <span className="text-[10px] text-gray-400 font-normal">Branded PDF with data table</span>
            </div>
          </button>

          <button
            type="button"
            onClick={handleExportPng}
            className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <div className="flex flex-col">
              <span>Export as PNG Image</span>
              <span className="text-[10px] text-gray-400 font-normal">High-resolution graphic</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
