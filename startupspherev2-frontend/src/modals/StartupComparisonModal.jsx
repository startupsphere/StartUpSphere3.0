import React, { useEffect, useState, useMemo } from "react";
import { getBackendUrl, getAuthHeaders } from "../config/apiConfig";
import {
  X,
  Check,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Layers,
  TrendingUp,
  Coins,
  Building2,
  MapPin,
  Calendar,
  Eye,
  ThumbsUp,
  Bookmark,
  BarChart2,
  Award,
  Loader2,
} from "lucide-react";
import { Bar } from "react-chartjs-2";

const STARTUP_COLORS = [
  "#4f46e5", // indigo
  "#059669", // emerald
  "#d97706", // amber
  "#e11d48", // rose
  "#0284c7", // sky
  "#7c3aed", // violet
  "#0d9488", // teal
  "#ea580c", // orange
];

const parseTrlNumber = (trlLevel) => {
  const match = String(trlLevel || "").match(/\d+/);
  return match ? Math.min(9, Math.max(1, parseInt(match[0], 10))) : 1;
};

const getTrlPhase = (lvl) => {
  if (lvl <= 3) return { label: "Concept", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (lvl <= 6) return { label: "Prototype", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  return { label: "Commercial", cls: "bg-blue-50 text-blue-700 border-blue-200" };
};

const getStatusInfo = (startup) => {
  const raw = String(startup?.status || "").trim();
  const lower = raw.toLowerCase();
  if (lower === "approved" || startup?.isApproved === true) {
    return {
      label: "Approved",
      key: "approved",
      badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dotCls: "bg-emerald-500",
      Icon: CheckCircle2,
    };
  }
  if (lower === "rejected") {
    return {
      label: "Rejected",
      key: "rejected",
      badgeCls: "bg-rose-50 text-rose-700 border-rose-200",
      dotCls: "bg-rose-500",
      Icon: AlertCircle,
    };
  }
  return {
    label: raw || "In Review",
    key: "inReview",
    badgeCls: "bg-amber-50 text-amber-700 border-amber-200",
    dotCls: "bg-amber-500",
    Icon: Clock,
  };
};

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  if (num >= 1_000_000_000) return `₱${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `₱${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `₱${(num / 1_000).toFixed(0)}K`;
  return `₱${num.toLocaleString()}`;
};

export default function StartupComparisonModal({
  isOpen,
  onClose,
  startups = [],
  selectedIds = [],
  onToggleId,
  onSelectAll,
  onClearAll,
  logoUrls = {},
}) {
  const [metricsMap, setMetricsMap] = useState({});
  const [fetchingIds, setFetchingIds] = useState(new Set());
  const [viewMode, setViewMode] = useState("all"); // "all" | "matrix" | "charts"

  // Deduplicate startups list
  const uniqueStartups = useMemo(() => {
    const map = new Map();
    (startups || []).forEach((s) => {
      if (s && !s.isDraft && s.id != null && !map.has(String(s.id))) {
        map.set(String(s.id), s);
      }
    });
    return Array.from(map.values());
  }, [startups]);

  const selectedStartups = useMemo(() => {
    const idSet = new Set(selectedIds.map(String));
    return uniqueStartups.filter((s) => idSet.has(String(s.id)));
  }, [uniqueStartups, selectedIds]);

  // Fetch live views, likes, bookmarks for any selected startup not yet cached
  useEffect(() => {
    if (!isOpen || selectedStartups.length === 0) return;

    const missing = selectedStartups.filter(
      (s) => !metricsMap[String(s.id)] && !fetchingIds.has(String(s.id))
    );
    if (missing.length === 0) return;

    let cancelled = false;
    setFetchingIds((prev) => {
      const next = new Set(prev);
      missing.forEach((s) => next.add(String(s.id)));
      return next;
    });

    const loadMetrics = async () => {
      const results = await Promise.all(
        missing.map(async (st) => {
          try {
            const [vRes, lRes, bRes] = await Promise.all([
              fetch(`${getBackendUrl()}/startups/${st.id}/view-count`, {
                headers: getAuthHeaders(),
                credentials: "include",
              }),
              fetch(`${getBackendUrl()}/api/likes/count/startup/${st.id}`, {
                headers: getAuthHeaders(),
                credentials: "include",
              }),
              fetch(`${getBackendUrl()}/api/bookmarks/count/startup/${st.id}`, {
                headers: getAuthHeaders(),
                credentials: "include",
              }),
            ]);
            const views = vRes.ok ? Number(await vRes.json()) || 0 : 0;
            const likes = lRes.ok ? Number(await lRes.json()) || 0 : 0;
            const bookmarks = bRes.ok ? Number(await bRes.json()) || 0 : 0;
            return { id: String(st.id), views, likes, bookmarks };
          } catch {
            return { id: String(st.id), views: 0, likes: 0, bookmarks: 0 };
          }
        })
      );

      if (cancelled) return;
      setMetricsMap((prev) => {
        const next = { ...prev };
        results.forEach((r) => {
          next[r.id] = { views: r.views, likes: r.likes, bookmarks: r.bookmarks };
        });
        return next;
      });
      setFetchingIds((prev) => {
        const next = new Set(prev);
        missing.forEach((s) => next.delete(String(s.id)));
        return next;
      });
    };

    loadMetrics();
    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedStartups, metricsMap, fetchingIds]);

  // Summary metrics across selected startups
  const summary = useMemo(() => {
    let approved = 0;
    let inReview = 0;
    let rejected = 0;
    let govRegistered = 0;
    let totalTrl = 0;
    let totalFunding = 0;

    selectedStartups.forEach((s) => {
      const st = getStatusInfo(s);
      if (st.key === "approved") approved += 1;
      else if (st.key === "rejected") rejected += 1;
      else inReview += 1;

      if (
        s.isGovernmentRegistered ||
        (s.registrationAgency && !["Unregistered", ""].includes(String(s.registrationAgency).trim()))
      ) {
        govRegistered += 1;
      }
      totalTrl += parseTrlNumber(s.trlLevel);
      totalFunding +=
        Number(s.totalStartupFundingReceived || s.paidUpCapital || 0) +
        Number(s.amountOfGovernmentGrantsOrSubsidiesReceived || 0);
    });

    return {
      approved,
      inReview,
      rejected,
      govRegistered,
      avgTrl: selectedStartups.length > 0 ? (totalTrl / selectedStartups.length).toFixed(1) : "0",
      totalFunding,
    };
  }, [selectedStartups]);

  // Leaders for highlighting top values in matrix
  const leaders = useMemo(() => {
    if (selectedStartups.length < 2) return {};
    let maxViews = -1;
    let maxLikes = -1;
    let maxBookmarks = -1;
    let maxTrl = -1;
    let maxFunding = -1;

    selectedStartups.forEach((s) => {
      const m = metricsMap[String(s.id)] || { views: 0, likes: 0, bookmarks: 0 };
      const trl = parseTrlNumber(s.trlLevel);
      const funding =
        Number(s.totalStartupFundingReceived || s.paidUpCapital || 0) +
        Number(s.amountOfGovernmentGrantsOrSubsidiesReceived || 0);
      if (m.views > maxViews) maxViews = m.views;
      if (m.likes > maxLikes) maxLikes = m.likes;
      if (m.bookmarks > maxBookmarks) maxBookmarks = m.bookmarks;
      if (trl > maxTrl) maxTrl = trl;
      if (funding > maxFunding) maxFunding = funding;
    });

    return { maxViews, maxLikes, maxBookmarks, maxTrl, maxFunding };
  }, [selectedStartups, metricsMap]);

  // Grouped Bar Chart data comparing engagement across all selected startups
  const engagementChartData = useMemo(() => {
    const labels = selectedStartups.map((s) =>
      s.companyName?.length > 18 ? `${s.companyName.slice(0, 16)}…` : s.companyName || `Startup #${s.id}`
    );
    return {
      labels,
      datasets: [
        {
          label: "Views",
          data: selectedStartups.map((s) => metricsMap[String(s.id)]?.views ?? 0),
          backgroundColor: "#3b82f6",
          borderRadius: 6,
          maxBarThickness: 32,
        },
        {
          label: "Likes",
          data: selectedStartups.map((s) => metricsMap[String(s.id)]?.likes ?? 0),
          backgroundColor: "#10b981",
          borderRadius: 6,
          maxBarThickness: 32,
        },
        {
          label: "Bookmarks",
          data: selectedStartups.map((s) => metricsMap[String(s.id)]?.bookmarks ?? 0),
          backgroundColor: "#f59e0b",
          borderRadius: 6,
          maxBarThickness: 32,
        },
      ],
    };
  }, [selectedStartups, metricsMap]);

  const trlChartData = useMemo(() => {
    const labels = selectedStartups.map((s) =>
      s.companyName?.length > 18 ? `${s.companyName.slice(0, 16)}…` : s.companyName || `Startup #${s.id}`
    );
    return {
      labels,
      datasets: [
        {
          label: "TRL Level (1–9)",
          data: selectedStartups.map((s) => parseTrlNumber(s.trlLevel)),
          backgroundColor: selectedStartups.map(
            (_, idx) => STARTUP_COLORS[idx % STARTUP_COLORS.length]
          ),
          borderRadius: 6,
          maxBarThickness: 38,
        },
      ],
    };
  }, [selectedStartups]);

  if (!isOpen) return null;

  const isLoadingAny = fetchingIds.size > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50/90 via-blue-50/50 to-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
              style={{ background: "linear-gradient(135deg, #2563eb 0%, #4338ca 100%)" }}
            >
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Compare Startups Status & Performance
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select 2 or more startups to compare approval status, compliance, TRL readiness, funding, and engagement
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
              {[
                { id: "all", label: "All" },
                { id: "matrix", label: "Status Matrix" },
                { id: "charts", label: "Charts" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setViewMode(tab.id)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    viewMode === tab.id
                      ? "bg-white text-indigo-700 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close comparison"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Multi-Select Startup Chips Bar */}
        <div className="px-5 py-3 bg-slate-50/90 border-b border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select Startups ({selectedStartups.length} of {uniqueStartups.length} selected)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSelectAll}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-0.5 rounded hover:bg-indigo-50 transition-colors cursor-pointer"
              >
                Select All ({uniqueStartups.length})
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs font-semibold text-slate-500 hover:text-rose-600 px-2 py-0.5 rounded hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
            {uniqueStartups.map((st, idx) => {
              const isSelected = selectedIds.some((id) => String(id) === String(st.id));
              const statusInfo = getStatusInfo(st);
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onToggleId(st.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                      isSelected
                        ? "bg-white/20 border-white/40 text-white"
                        : "border-slate-300 bg-slate-50"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${statusInfo.dotCls}`}
                    title={statusInfo.label}
                  />
                  <span className="max-w-[160px] truncate">{st.companyName || `Startup #${st.id}`}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {statusInfo.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-white">
          {selectedStartups.length < 2 ? (
            <div className="py-14 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 border border-indigo-100">
                <BarChart2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Select at least 2 startups to compare
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Click any startups from the bar above (you can select 2, 3, or all {uniqueStartups.length} of your startups) to compare their statuses, compliance, TRL stage, and metrics side by side.
              </p>
              {uniqueStartups.length >= 2 && (
                <button
                  type="button"
                  onClick={onSelectAll}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Compare All {uniqueStartups.length} Startups
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Status Breakdown Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Status Breakdown
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {summary.approved} Approved
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {summary.inReview} In Review
                    </span>
                    {summary.rejected > 0 && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        {summary.rejected} Rejected
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Gov. Registered
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-lg font-black text-emerald-600">
                      {summary.govRegistered}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      of {selectedStartups.length} selected
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Avg. TRL Readiness
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-lg font-black text-indigo-700">
                      TRL {summary.avgTrl}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/ 9</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Combined Funding
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-lg font-black text-slate-900">
                      {formatCurrency(summary.totalFunding)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Comparison Matrix */}
              {(viewMode === "all" || viewMode === "matrix") && (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>Side-by-Side Status & Metrics Comparison</span>
                    </h3>
                    {isLoadingAny && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-indigo-600">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Syncing live metrics...
                      </span>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider min-w-[165px] border-r border-slate-200">
                            Attribute / Metric
                          </th>
                          {selectedStartups.map((st, idx) => (
                            <th
                              key={st.id}
                              className="px-4 py-3 min-w-[200px] border-r last:border-r-0 border-slate-100"
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs"
                                  style={{
                                    backgroundColor: STARTUP_COLORS[idx % STARTUP_COLORS.length],
                                  }}
                                >
                                  {logoUrls[st.id] ? (
                                    <img
                                      src={logoUrls[st.id]}
                                      alt={st.companyName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    (st.companyName?.[0] || "S").toUpperCase()
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-slate-900 truncate max-w-[150px]" title={st.companyName}>
                                    {st.companyName || `Startup #${st.id}`}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                                    {st.industry || "Unspecified"}
                                  </div>
                                </div>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100 text-xs">
                        {/* Row 1: Approval / Review Status */}
                        <tr className="hover:bg-slate-50/60">
                          <td className="sticky left-0 z-10 bg-white px-4 py-3 font-bold text-slate-700 border-r border-slate-200">
                            Approval Status
                          </td>
                          {selectedStartups.map((st) => {
                            const info = getStatusInfo(st);
                            const StatusIcon = info.Icon;
                            return (
                              <td key={st.id} className="px-4 py-3 border-r last:border-r-0 border-slate-100">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${info.badgeCls}`}
                                >
                                  <StatusIcon className="w-3.5 h-3.5" />
                                  {info.label}
                                </span>
                                {info.key === "rejected" && (st.rejectionReason || st.comments) && (
                                  <p
                                    className="text-[10px] text-rose-600 mt-1 line-clamp-2"
                                    title={st.rejectionReason || st.comments}
                                  >
                                    Note: {st.rejectionReason || st.comments}
                                  </p>
                                )}
                              </td>
                            );
                          })}
                        </tr>

                        {/* Row 2: Government Compliance */}
                        <tr className="hover:bg-slate-50/60">
                          <td className="sticky left-0 z-10 bg-white px-4 py-3 font-bold text-slate-700 border-r border-slate-200">
                            Gov. Compliance
                          </td>
                          {selectedStartups.map((st) => {
                            const agency = String(st.registrationAgency || "").trim();
                            const isBir = agency.toUpperCase().includes("BIR");
                            const isReg =
                              Boolean(st.isGovernmentRegistered) ||
                              (agency && agency.toLowerCase() !== "unregistered");
                            return (
                              <td key={st.id} className="px-4 py-3 border-r last:border-r-0 border-slate-100">
                                {isBir ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <ShieldCheck className="w-3 h-3" /> Gov. Certified (BIR)
                                  </span>
                                ) : isReg ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    <CheckCircle2 className="w-3 h-3" /> {agency || "Registered"}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                    Pending / Unregistered
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>

                        {/* Row 3: TRL Readiness */}
                        <tr className="hover:bg-slate-50/60">
                          <td className="sticky left-0 z-10 bg-white px-4 py-3 font-bold text-slate-700 border-r border-slate-200">
                            <span className="inline-flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-indigo-500" />
                              TRL Stage
                            </span>
                          </td>
                          {selectedStartups.map((st) => {
                            const lvl = parseTrlNumber(st.trlLevel);
                            const phase = getTrlPhase(lvl);
                            const isLeader = lvl === leaders.maxTrl && leaders.maxTrl > 1;
                            return (
                              <td key={st.id} className="px-4 py-3 border-r last:border-r-0 border-slate-100">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="font-bold text-slate-900">
                                    TRL {lvl} <span className="text-slate-400 font-normal">/ 9</span>
                                  </span>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${phase.cls}`}>
                                    {phase.label}
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
                                    style={{ width: `${(lvl / 9) * 100}%` }}
                                  />
                                </div>
                                {isLeader && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-indigo-600 mt-1">
                                    <Award className="w-3 h-3" /> Highest TRL
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>

                        {/* Row 4: Views */}
                        <tr className="hover:bg-slate-50/60">
                          <td className="sticky left-0 z-10 bg-white px-4 py-3 font-bold text-slate-700 border-r border-slate-200">
                            <span className="inline-flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5 text-blue-500" />
                              Total Views
                            </span>
                          </td>
                          {selectedStartups.map((st) => {
                            const val = metricsMap[String(st.id)]?.views ?? 0;
                            const isTop = val === leaders.maxViews && leaders.maxViews > 0;
                            return (
                              <td key={st.id} className="px-4 py-3 border-r last:border-r-0 border-slate-100">
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold ${isTop ? "text-blue-700" : "text-slate-800"}`}>
                                    {val.toLocaleString()}
                                  </span>
                                  {isTop && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                      Top
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>

                        {/* Row 5: Likes */}
                        <tr className="hover:bg-slate-50/60">
                          <td className="sticky left-0 z-10 bg-white px-4 py-3 font-bold text-slate-700 border-r border-slate-200">
                            <span className="inline-flex items-center gap-1.5">
                              <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
                              Total Likes
                            </span>
                          </td>
                          {selectedStartups.map((st) => {
                            const val = metricsMap[String(st.id)]?.likes ?? 0;
                            const isTop = val === leaders.maxLikes && leaders.maxLikes > 0;
                            return (
                              <td key={st.id} className="px-4 py-3 border-r last:border-r-0 border-slate-100">
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold ${isTop ? "text-emerald-700" : "text-slate-800"}`}>
                                    {val.toLocaleString()}
                                  </span>
                                  {isTop && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Top
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>

                        {/* Row 6: Bookmarks */}
                        <tr className="hover:bg-slate-50/60">
                          <td className="sticky left-0 z-10 bg-white px-4 py-3 font-bold text-slate-700 border-r border-slate-200">
                            <span className="inline-flex items-center gap-1.5">
                              <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                              Total Bookmarks
                            </span>
                          </td>
                          {selectedStartups.map((st) => {
                            const val = metricsMap[String(st.id)]?.bookmarks ?? 0;
                            const isTop = val === leaders.maxBookmarks && leaders.maxBookmarks > 0;
                            return (
                              <td key={st.id} className="px-4 py-3 border-r last:border-r-0 border-slate-100">
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold ${isTop ? "text-amber-700" : "text-slate-800"}`}>
                                    {val.toLocaleString()}
                                  </span>
                                  {isTop && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                      Top
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>

                        {/* Row 7: Engagement Rate */}
                        <tr className="hover:bg-slate-50/60">
                          <td className="sticky left-0 z-10 bg-white px-4 py-3 font-bold text-slate-700 border-r border-slate-200">
                            <span className="inline-flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                              Engagement Rate
                            </span>
                          </td>
                          {selectedStartups.map((st) => {
                            const m = metricsMap[String(st.id)] || { views: 0, likes: 0, bookmarks: 0 };
                            const rate =
                              m.views > 0 ? (((m.likes + m.bookmarks) / m.views) * 100).toFixed(1) : "0.0";
                            return (
                              <td key={st.id} className="px-4 py-3 font-semibold text-slate-700 border-r last:border-r-0 border-slate-100">
                                {rate}%
                              </td>
                            );
                          })}
                        </tr>

                        {/* Row 8: Total Funding & Grants */}
                        <tr className="hover:bg-slate-50/60">
                          <td className="sticky left-0 z-10 bg-white px-4 py-3 font-bold text-slate-700 border-r border-slate-200">
                            <span className="inline-flex items-center gap-1.5">
                              <Coins className="w-3.5 h-3.5 text-indigo-500" />
                              Total Funding
                            </span>
                          </td>
                          {selectedStartups.map((st) => {
                            const base = Number(st.totalStartupFundingReceived || st.paidUpCapital || 0);
                            const grants = Number(st.amountOfGovernmentGrantsOrSubsidiesReceived || 0);
                            const total = base + grants;
                            const isTop = total === leaders.maxFunding && leaders.maxFunding > 0;
                            return (
                              <td key={st.id} className="px-4 py-3 border-r last:border-r-0 border-slate-100">
                                <div className="flex items-center gap-1.5">
                                  <span className={`font-bold ${isTop ? "text-indigo-700" : "text-slate-800"}`}>
                                    {formatCurrency(total)}
                                  </span>
                                  {isTop && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      Top
                                    </span>
                                  )}
                                </div>
                                {grants > 0 && (
                                  <span className="text-[10px] text-emerald-600 block mt-0.5">
                                    Incl. {formatCurrency(grants)} gov. grants
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>

                        {/* Row 9: Location & Founded */}
                        <tr className="hover:bg-slate-50/60">
                          <td className="sticky left-0 z-10 bg-white px-4 py-3 font-bold text-slate-700 border-r border-slate-200">
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              Location & Founded
                            </span>
                          </td>
                          {selectedStartups.map((st) => (
                            <td key={st.id} className="px-4 py-3 text-slate-600 border-r last:border-r-0 border-slate-100">
                              <div className="truncate max-w-[180px]" title={st.locationName || st.city}>
                                {st.locationName || st.city || "N/A"}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3" />
                                {st.foundedDate ? new Date(st.foundedDate).toLocaleDateString() : "N/A"}
                              </div>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Visual Comparison Charts */}
              {(viewMode === "all" || viewMode === "charts") && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4 text-blue-600" />
                      <span>Engagement Comparison (Views, Likes & Bookmarks)</span>
                    </h4>
                    <div className="h-56">
                      <Bar
                        data={engagementChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11 } } },
                          },
                          scales: {
                            y: { beginAtZero: true, ticks: { precision: 0, font: { size: 11 } } },
                            x: { ticks: { font: { size: 11 } } },
                          },
                        }}
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>TRL Readiness Stage Comparison (Levels 1–9)</span>
                    </h4>
                    <div className="h-56">
                      <Bar
                        data={trlChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              max: 9,
                              ticks: { stepSize: 1, font: { size: 11 } },
                            },
                            x: { ticks: { font: { size: 11 } } },
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Comparing <strong className="text-slate-800">{selectedStartups.length}</strong> startup{selectedStartups.length === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
