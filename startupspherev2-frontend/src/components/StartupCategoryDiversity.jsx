import React, { useMemo } from "react";
import {
  Layers,
  PieChart,
  Tag,
  Building2,
  ChevronRight,
  ExternalLink,
  Sparkles,
  MapPin,
  CheckCircle,
} from "lucide-react";

const CATEGORY_COLORS = [
  { bg: "bg-blue-500", text: "text-blue-700", border: "border-blue-200", badgeBg: "bg-blue-50", hex: "#3b82f6" },
  { bg: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-200", badgeBg: "bg-emerald-50", hex: "#10b981" },
  { bg: "bg-amber-500", text: "text-amber-700", border: "border-amber-200", badgeBg: "bg-amber-50", hex: "#f59e0b" },
  { bg: "bg-purple-500", text: "text-purple-700", border: "border-purple-200", badgeBg: "bg-purple-50", hex: "#8b5cf6" },
  { bg: "bg-pink-500", text: "text-pink-700", border: "border-pink-200", badgeBg: "bg-pink-50", hex: "#ec4899" },
  { bg: "bg-cyan-500", text: "text-cyan-700", border: "border-cyan-200", badgeBg: "bg-cyan-50", hex: "#06b6d4" },
  { bg: "bg-indigo-500", text: "text-indigo-700", border: "border-indigo-200", badgeBg: "bg-indigo-50", hex: "#6366f1" },
  { bg: "bg-teal-500", text: "text-teal-700", border: "border-teal-200", badgeBg: "bg-teal-50", hex: "#14b8a6" },
];

export default function StartupCategoryDiversity({
  startups = [],
  selectedStartup = "all",
  onSelectStartup,
}) {
  // Only display specified diversity breakdown if user has multiple startups
  if (!startups || startups.length <= 1) {
    return null;
  }

  const diversityData = useMemo(() => {
    const categoryMap = {};

    startups.forEach((st) => {
      const category = st.industry && st.industry.trim() !== "" ? st.industry.trim() : "Unspecified Category";
      if (!categoryMap[category]) {
        categoryMap[category] = [];
      }
      categoryMap[category].push(st);
    });

    const categories = Object.entries(categoryMap)
      .map(([name, list], index) => {
        const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
        const percentage = Math.round((list.length / startups.length) * 100);
        return {
          name,
          count: list.length,
          percentage,
          color,
          startups: list,
        };
      })
      .sort((a, b) => b.count - a.count);

    return {
      categories,
      totalCategories: categories.length,
      diversityRatio: ((categories.length / startups.length) * 100).toFixed(0),
    };
  }, [startups]);

  const formatFunding = (val) => {
    const num = Number(val) || 0;
    if (num >= 1_000_000) return `₱${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `₱${(num / 1_000).toFixed(0)}K`;
    return `₱${num.toLocaleString()}`;
  };

  return (
    <div className="mb-3.5">
      <div className="bg-white rounded-xl shadow-xs border border-gray-200/90 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                  Startup Portfolio Diversity & Category Distribution
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-400/20 text-indigo-200 text-[10px] font-bold border border-indigo-400/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-300" />
                  Multiple Ventures
                </span>
              </div>
              <p className="text-[11px] text-indigo-200/80 mt-0.5">
                Specified category allocation across your {startups.length} owned startups
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white text-xs font-bold border border-white/15">
              {diversityData.totalCategories} Categor{diversityData.totalCategories > 1 ? "ies" : "y"} ({diversityData.diversityRatio}% Spread)
            </span>
          </div>
        </div>

        {/* Multi-Segment Proportion Bar */}
        <div className="p-3.5 sm:p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5 font-semibold">
            <span>Portfolio Category Breakdown</span>
            <span>{startups.length} Total User Ventures</span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-gray-200 overflow-hidden flex shadow-inner">
            {diversityData.categories.map((cat, i) => (
              <div
                key={i}
                className={`${cat.color.bg} transition-all duration-300`}
                style={{ width: `${cat.percentage}%` }}
                title={`${cat.name}: ${cat.count} startups (${cat.percentage}%)`}
              />
            ))}
          </div>

          {/* Quick Category Legend Pills */}
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            {diversityData.categories.map((cat, i) => (
              <div
                key={i}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ${cat.color.border} ${cat.color.badgeBg} ${cat.color.text}`}
              >
                <span className={`w-2 h-2 rounded-full ${cat.color.bg}`} />
                <span>{cat.name}</span>
                <span className="opacity-75 font-normal">({cat.count} · {cat.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Specified Category Matrix: Shows where startups belong */}
        <div className="p-3.5 sm:p-4">
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
            Ventures Categorized by Industry:
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {diversityData.categories.map((cat, idx) => (
              <div
                key={idx}
                className={`rounded-xl border ${cat.color.border} ${cat.color.badgeBg} p-3 flex flex-col justify-between transition-all duration-200 hover:shadow-sm`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Tag className={`w-3.5 h-3.5 ${cat.color.text}`} />
                      <span className={`text-xs font-bold ${cat.color.text} truncate max-w-[170px]`} title={cat.name}>
                        {cat.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-white border border-gray-200 text-gray-700 shadow-2xs">
                      {cat.count} {cat.count === 1 ? "Startup" : "Startups"}
                    </span>
                  </div>

                  {/* List of startups belonging to this category */}
                  <div className="space-y-1.5 mt-2">
                    {cat.startups.map((st) => {
                      const isFocused = String(selectedStartup) === String(st.id);
                      const trlNum = st.trlLevel
                        ? Number(String(st.trlLevel).replace(/\D/g, "")) || 4
                        : 4;
                      const fundingAmt = Number(st.totalStartupFundingReceived || st.paidUpCapital || 0);

                      return (
                        <div
                          key={st.id}
                          onClick={() => onSelectStartup && onSelectStartup(st.id)}
                          className={`p-2 rounded-lg bg-white border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                            isFocused
                              ? "border-indigo-600 ring-2 ring-indigo-200/80 shadow-xs"
                              : "border-gray-200 hover:border-indigo-300 hover:shadow-2xs"
                          }`}
                          title={`Click to focus ${st.companyName}`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                              <p className="text-xs font-bold text-gray-900 truncate">
                                {st.companyName}
                              </p>
                              {isFocused && (
                                <span className="px-1 py-0.2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[9px] font-bold">
                                  Focused
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                              <span className="flex items-center gap-0.5 truncate">
                                <MapPin className="w-2.5 h-2.5 text-gray-400" />
                                {st.city || st.locationName || "Philippines"}
                              </span>
                              <span>•</span>
                              <span className="font-semibold text-indigo-700">TRL {trlNum}</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[10.5px] font-black text-gray-900 block">
                              {formatFunding(fundingAmt)}
                            </span>
                            <span className="text-[9px] text-gray-400 font-medium">Funding</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-200/60 flex items-center justify-between text-[10px] text-gray-500">
                  <span>Category Share:</span>
                  <span className="font-bold text-gray-700">{cat.percentage}% of portfolio</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
