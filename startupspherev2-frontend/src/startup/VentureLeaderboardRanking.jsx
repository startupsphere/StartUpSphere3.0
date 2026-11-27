import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getBackendUrl, getAuthHeaders } from "../config/apiConfig";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Trophy,
  Crown,
  Award,
  TrendingUp,
  CheckCircle2,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  BarChart3,
  Building2,
  Sparkles,
  RefreshCw,
  Plus,
  Coins,
  ArrowUpRight,
  Info,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Zap,
  Target,
  Flame,
  Activity,
  Layers,
  Users,
  DollarSign,
  PieChart as PieIcon,
  Check,
} from "lucide-react";

export default function VentureLeaderboardRanking() {
  const navigate = useNavigate();

  const [myStartups, setMyStartups] = useState([]);
  const [topStartups, setTopStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [rankingMetric, setRankingMetric] = useState("overall"); // overall, growth, investment, ecosystem, engagement

  // Statistical Ranking Details Modal State
  const [selectedVentureForDetails, setSelectedVentureForDetails] = useState(null);
  const [detailsTab, setDetailsTab] = useState("charts"); // "charts" | "breakdown"

  // Popup Board (Modal) for Overall Leaderboard
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [modalIndustry, setModalIndustry] = useState("All");
  const [modalPage, setModalPage] = useState(0);
  const modalItemsPerPage = 10;

  const fetchData = async () => {
    try {
      setError(null);

      // 1. Fetch user's own startups
      const userRes = await fetch(`${getBackendUrl()}/startups/my-startups/details`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });

      let userStartupsData = [];
      if (userRes.ok) {
        const rawUser = await userRes.json();
        userStartupsData = Array.isArray(rawUser) ? rawUser : [];
      } else {
        console.warn("Could not load user startups:", userRes.status);
      }
      setMyStartups(userStartupsData);

      // 2. Fetch full ecosystem rankings
      const params = new URLSearchParams({
        page: "0",
        size: "1000",
        limit: "1000",
        metric: rankingMetric,
      });

      let rankRes = await fetch(`${getBackendUrl()}/api/rankings?${params.toString()}`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (!rankRes.ok) {
        rankRes = await fetch(`${getBackendUrl()}/api/rankings/top?${params.toString()}`, {
          headers: getAuthHeaders(),
          credentials: "include",
        });
      }

      if (rankRes.ok) {
        const rawRankings = await rankRes.json();
        const rankingList = Array.isArray(rawRankings) ? rawRankings : (rawRankings.content || []);
        setTopStartups(rankingList);
      } else {
        console.warn("Could not load ecosystem rankings:", rankRes.status);
      }
    } catch (err) {
      console.error("Error loading venture rankings:", err);
      setError("Unable to load leaderboard rankings. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [rankingMetric]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Enrich user startups with ranking and sort highest-ranking business to the top
  const sortedUserVentures = useMemo(() => {
    if (!myStartups || myStartups.length === 0) return [];

    const enriched = myStartups.map((st) => {
      const matchIdx = topStartups.findIndex(
        (ts) => String(ts.id) === String(st.id)
      );
      const isRanked = matchIdx !== -1;
      const rankedItem = isRanked ? topStartups[matchIdx] : null;
      const rankNum = isRanked ? (rankedItem.rank || matchIdx + 1) : null;
      const overallScore = rankedItem
        ? Number(rankedItem.overallScore ?? rankedItem.score ?? 0)
        : null;
      const growthScore = rankedItem
        ? Number(rankedItem.growthScore ?? rankedItem.growthRate ?? 0)
        : 0;
      const investmentScore = rankedItem
        ? Number(rankedItem.investmentScore ?? 0)
        : 0;
      const ecosystemScore = rankedItem
        ? Number(rankedItem.ecosystemScore ?? 0)
        : 0;
      const engagementScore = rankedItem
        ? Number(rankedItem.engagementScore ?? 0)
        : 0;

      const rawTrl = String(st.trlLevel || "");
      const trlNum = parseInt(rawTrl.match(/\d/)?.[0] || "4", 10);

      return {
        ...st,
        isRanked,
        rankNum,
        overallScore,
        growthScore,
        investmentScore,
        ecosystemScore,
        engagementScore,
        trlNum,
      };
    });

    // Requirement: "if the user has 1 or more business the highest should be on the top"
    // Ranked startups come first, ordered ascending by rankNum (1 is highest, then 2, 3...)
    // Or if rank numbers are equal, descending by overallScore.
    // Unranked come last, sorted descending by any available overallScore.
    return enriched.sort((a, b) => {
      if (a.isRanked && !b.isRanked) return -1;
      if (!a.isRanked && b.isRanked) return 1;
      if (a.isRanked && b.isRanked) {
        if (a.rankNum !== b.rankNum) {
          return (a.rankNum || 999999) - (b.rankNum || 999999);
        }
        return (b.overallScore || 0) - (a.overallScore || 0);
      }
      return (b.overallScore || 0) - (a.overallScore || 0);
    });
  }, [myStartups, topStartups]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalOwned = myStartups.length;
    const rankedOnly = sortedUserVentures.filter((v) => v.isRanked && v.rankNum != null);
    const bestRank = rankedOnly.length > 0 ? Math.min(...rankedOnly.map((v) => v.rankNum)) : null;
    const bestVenture = rankedOnly.find((v) => v.rankNum === bestRank);
    const topScore = sortedUserVentures.reduce(
      (max, v) => (v.overallScore != null && v.overallScore > max ? v.overallScore : max),
      0
    );
    const avgTrl = totalOwned > 0
      ? (sortedUserVentures.reduce((sum, v) => sum + (v.trlNum || 0), 0) / totalOwned).toFixed(1)
      : 0;

    return {
      totalOwned,
      bestRank,
      bestVentureName: bestVenture?.companyName || null,
      topScore,
      avgTrl,
    };
  }, [myStartups, sortedUserVentures]);

  // Ecosystem Benchmark Averages for Statistical Charts
  const ecosystemAverages = useMemo(() => {
    const list = topStartups || [];
    if (list.length === 0) {
      return {
        growth: 65,
        investment: 58,
        ecosystem: 62,
        engagement: 54,
        top10Growth: 88,
        top10Invest: 85,
        top10Eco: 84,
        top10Eng: 80,
      };
    }
    const sample = list.slice(0, 50);
    const top10 = list.slice(0, 10);
    const avg = (arr, key, fallback) => {
      if (!arr || arr.length === 0) return fallback;
      const sum = arr.reduce((acc, item) => acc + Number(item[key] || 0), 0);
      const val = Math.round(sum / arr.length);
      return val > 0 ? val : fallback;
    };
    return {
      growth: avg(sample, "growthScore", 65),
      investment: avg(sample, "investmentScore", 58),
      ecosystem: avg(sample, "ecosystemScore", 62),
      engagement: avg(sample, "engagementScore", 54),
      top10Growth: avg(top10, "growthScore", 88),
      top10Invest: avg(top10, "investmentScore", 85),
      top10Eco: avg(top10, "ecosystemScore", 84),
      top10Eng: avg(top10, "engagementScore", 80),
    };
  }, [topStartups]);

  // Popup Board: Filtered startups & pagination
  const modalIndustries = useMemo(() => {
    const set = new Set();
    (topStartups || []).forEach((s) => {
      if (s.industry) set.add(s.industry);
    });
    return ["All", ...Array.from(set).sort()];
  }, [topStartups]);

  const modalFilteredStartups = useMemo(() => {
    let list = topStartups || [];
    if (modalIndustry !== "All") {
      list = list.filter((s) => s.industry === modalIndustry);
    }
    if (modalSearch.trim()) {
      const q = modalSearch.toLowerCase().trim();
      list = list.filter(
        (s) =>
          (s.companyName && s.companyName.toLowerCase().includes(q)) ||
          (s.industry && s.industry.toLowerCase().includes(q))
      );
    }
    return list;
  }, [topStartups, modalIndustry, modalSearch]);

  const modalTotalPages = Math.max(1, Math.ceil(modalFilteredStartups.length / modalItemsPerPage));
  const modalPageStartups = useMemo(() => {
    const start = modalPage * modalItemsPerPage;
    return modalFilteredStartups.slice(start, start + modalItemsPerPage);
  }, [modalFilteredStartups, modalPage]);

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                onClick={() => navigate("/startup-dashboard")}
                className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer shrink-0"
                title="Back to Startup Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                  </span>
                  <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight truncate">
                    Your Venture Leaderboard Ranking
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate hidden sm:block">
                  Verified official standings and performance metrics across the Philippine innovation ecosystem
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="p-2 sm:px-3 sm:py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Refresh ranking positions"
              >
                <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? "animate-spin" : ""}`} />
                <span className="hidden md:inline">Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLeaderboardModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg shadow-2xs hover:shadow transition-all cursor-pointer"
                title="View Overall Leaderboard Pop Board"
              >
                <Award className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Overall Leaderboard</span>
                <span className="sm:hidden">Leaderboard</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* KPI / Summary Highlights */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {/* Card 1: Total Startups Owned */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Ventures Owned</span>
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <Building2 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900">
              {stats.totalOwned}
            </div>
            <div className="text-[11px] text-gray-500 mt-1">
              {stats.totalOwned === 1 ? "1 registered startup" : `${stats.totalOwned} registered startups`}
            </div>
          </div>

          {/* Card 2: Highest Global Standing */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Best Rank</span>
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Crown className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900 flex items-baseline gap-1">
              {stats.bestRank ? (
                <>
                  <span className="text-amber-500 text-xl font-bold">#</span>
                  <span>{stats.bestRank}</span>
                  <span className="text-xs text-gray-400 font-normal ml-1">Global</span>
                </>
              ) : (
                <span className="text-gray-400 text-xl font-medium">Unranked</span>
              )}
            </div>
            <div className="text-[11px] text-gray-500 mt-1 truncate">
              {stats.bestVentureName ? `by ${stats.bestVentureName}` : "Pending performance score"}
            </div>
          </div>

          {/* Card 3: Top Performance Score */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Peak Score</span>
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <BarChart3 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900 flex items-baseline">
              <span>{stats.topScore}</span>
              <span className="text-xs text-gray-400 font-normal ml-1">/100</span>
            </div>
            <div className="text-[11px] text-gray-500 mt-1">
              Weighted composite 4-pillar index
            </div>
          </div>

          {/* Card 4: Average Maturity Stage */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Avg TRL Stage</span>
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900">
              TRL {Math.round(stats.avgTrl) || 4}
            </div>
            <div className="text-[11px] text-gray-500 mt-1">
              Technology Readiness Level
            </div>
          </div>
        </div>

        {/* Filter / Sort Indicator Header */}
        <div className="bg-white rounded-xl p-4 border border-gray-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <p className="text-xs text-gray-600">
              Ventures are sorted with your <strong className="text-gray-900 font-semibold">highest-ranking business at the top</strong>, benchmarked against {topStartups.length > 0 ? topStartups.length : "all"} approved startups nationwide.
            </p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <span className="text-xs font-semibold text-gray-500">Metric:</span>
            <select
              value={rankingMetric}
              onChange={(e) => setRankingMetric(e.target.value)}
              className="text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="overall">Overall Score</option>
              <option value="growth">Growth Index</option>
              <option value="investment">Investment Readiness</option>
              <option value="ecosystem">Ecosystem Impact</option>
              <option value="engagement">Engagement Score</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-6 w-48 bg-gray-200 rounded"></div>
                  <div className="h-8 w-16 bg-gray-200 rounded"></div>
                </div>
                <div className="h-4 w-3/4 bg-gray-100 rounded"></div>
                <div className="grid grid-cols-4 gap-3 pt-4 border-t border-gray-100">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-12 bg-gray-100 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center text-red-700 text-sm">
            <p>{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State: User owns 0 startups */}
        {!loading && !error && sortedUserVentures.length === 0 && (
          <div className="bg-white rounded-2xl p-8 sm:p-12 border border-gray-200 shadow-sm text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Registered Ventures Found</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Register your venture to unlock ecosystem rankings, benchmark performance across Growth, Investment, and Ecosystem metrics, and qualify for investor deal flow.
            </p>
            <button
              onClick={() => navigate("/add-startup")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Register Your Startup
            </button>
          </div>
        )}

        {/* Ventures List: Highest Ranking Business at the Top */}
        {!loading && !error && sortedUserVentures.length > 0 && (
          <div className="space-y-4">
            {sortedUserVentures.map((venture, index) => {
              const isTopVenture = index === 0;

              return (
                <div
                  key={venture.id}
                  className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-xs hover:shadow-md ${
                    isTopVenture
                      ? "border-indigo-300 ring-2 ring-indigo-100"
                      : "border-gray-200/90 hover:border-indigo-200"
                  }`}
                >
                  {/* Top Badge Banner for the highest-ranking venture */}
                  {isTopVenture && sortedUserVentures.length > 1 && (
                    <div className="bg-gradient-to-r from-amber-500 via-indigo-600 to-indigo-700 px-5 py-1.5 text-white flex items-center justify-between text-xs font-bold shadow-2xs">
                      <div className="flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-amber-200" />
                        <span>#1 Highest Ranked Venture in Your Portfolio</span>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-100">
                        Top Performer
                      </span>
                    </div>
                  )}

                  {/* Main Venture Header Section */}
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                      {/* Left info */}
                      <div className="flex items-start gap-4 min-w-0">
                        {/* Rank Badge */}
                        <div className="relative shrink-0 flex flex-col items-center">
                          <div
                            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center font-black border shadow-2xs ${
                              !venture.isRanked
                                ? "bg-gray-100 text-gray-400 border-gray-200"
                                : venture.rankNum === 1
                                ? "bg-gradient-to-br from-amber-100 to-amber-50 text-amber-900 border-amber-300 ring-4 ring-amber-100/70"
                                : venture.rankNum <= 3
                                ? "bg-amber-50 text-amber-900 border-amber-300 ring-2 ring-amber-100"
                                : isTopVenture
                                ? "bg-indigo-50 text-indigo-700 border-indigo-300 ring-2 ring-indigo-100"
                                : "bg-slate-50 text-slate-700 border-slate-200"
                            }`}
                          >
                            {venture.isRanked ? (
                              <>
                                <span className="text-[11px] font-semibold text-gray-500">RANK</span>
                                <span className="text-lg sm:text-2xl leading-none">#{venture.rankNum}</span>
                              </>
                            ) : (
                              <span className="text-xs font-bold text-gray-400">N/A</span>
                            )}
                          </div>
                          {venture.rankNum === 1 && (
                            <Crown className="w-4 h-4 text-amber-500 absolute -top-2 -right-1 drop-shadow" />
                          )}
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-400 mt-1">
                            {venture.isRanked ? "Global" : "Pending"}
                          </span>
                        </div>

                        {/* Startup Name & Tags */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2
                              className="text-lg sm:text-xl font-black text-gray-900 hover:text-indigo-600 transition-colors cursor-pointer truncate"
                              onClick={() => setSelectedVentureForDetails(venture)}
                              title={`View statistical ranking details for ${venture.companyName}`}
                            >
                              {venture.companyName}
                            </h2>
                            {isTopVenture && sortedUserVentures.length > 1 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                                <Crown className="w-3 h-3 text-amber-600" /> Top Performer
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-xl">
                            {venture.companyDescription || "No detailed description provided."}
                          </p>

                          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                              {venture.industry || "General Tech"}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                              TRL {venture.trlNum} Stage
                            </span>
                            {(venture.registrationAgency === "BIR" || venture.isGovernmentRegistered) && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                {venture.registrationAgency || "BIR Registered"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Scores & Actions */}
                      <div className="flex items-center justify-between lg:justify-end gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                        {/* Overall Score */}
                        <div className="text-left lg:text-right">
                          <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                            Composite Score
                          </div>
                          <div className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight flex items-baseline lg:justify-end">
                            <span>{venture.overallScore !== null ? venture.overallScore : "—"}</span>
                            <span className="text-xs font-normal text-gray-400 ml-1">/100</span>
                          </div>
                          <div className="text-[10px] font-medium text-indigo-600 mt-0.5">
                            {rankingMetric.toUpperCase()} Metric
                          </div>
                        </div>

                        {/* Action Link: View Statistical Details */}
                        <button
                          type="button"
                          onClick={() => setSelectedVentureForDetails(venture)}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 text-xs font-bold rounded-xl border border-indigo-200 hover:border-indigo-300 transition-all cursor-pointer shrink-0 shadow-2xs hover:shadow"
                          title="View statistical ranking breakdown and charts"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>

                    {/* 4-Pillar Score Breakdown */}
                    <div className="mt-5 pt-4 border-t border-gray-100">
                      {venture.isRanked ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                          {/* Growth */}
                          <div className="bg-blue-50/60 rounded-xl p-3 border border-blue-100/70">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-blue-700 mb-1">
                              <span className="uppercase tracking-wider">Growth Index</span>
                              <span className="font-bold">{venture.growthScore}%</span>
                            </div>
                            <div className="w-full bg-blue-100/60 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(0, venture.growthScore))}%` }}
                              />
                            </div>
                          </div>

                          {/* Investment */}
                          <div className="bg-purple-50/60 rounded-xl p-3 border border-purple-100/70">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-purple-700 mb-1">
                              <span className="uppercase tracking-wider">Investment Readiness</span>
                              <span className="font-bold">{venture.investmentScore}%</span>
                            </div>
                            <div className="w-full bg-purple-100/60 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-purple-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(0, venture.investmentScore))}%` }}
                              />
                            </div>
                          </div>

                          {/* Ecosystem */}
                          <div className="bg-pink-50/60 rounded-xl p-3 border border-pink-100/70">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-pink-700 mb-1">
                              <span className="uppercase tracking-wider">Ecosystem Impact</span>
                              <span className="font-bold">{venture.ecosystemScore}%</span>
                            </div>
                            <div className="w-full bg-pink-100/60 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-pink-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(0, venture.ecosystemScore))}%` }}
                              />
                            </div>
                          </div>

                          {/* Engagement */}
                          <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-100/70">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-amber-800 mb-1">
                              <span className="uppercase tracking-wider">Engagement</span>
                              <span className="font-bold">{venture.engagementScore}%</span>
                            </div>
                            <div className="w-full bg-amber-100/60 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-amber-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(0, venture.engagementScore))}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 flex items-center justify-between text-xs text-amber-800">
                          <div className="flex items-center gap-2">
                            <Info className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>
                              {venture.status ? `Status: ${venture.status}. ` : ""}
                              This venture will be scored and assigned its official leaderboard position once reviewed and approved.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Overall Leaderboard Popup Board Modal */}
      {showLeaderboardModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowLeaderboardModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh] my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50/80 via-blue-50/50 to-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
                  <Award className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-black text-gray-900 truncate flex items-center gap-2">
                    <span>Overall Startup Leaderboard</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      {topStartups.length} Startups Ranked
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    Official rankings and verified performance standings across the Philippine innovation ecosystem
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowLeaderboardModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer shrink-0 ml-2"
                title="Close Board"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 border-b border-gray-100 bg-slate-50/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={modalSearch}
                  onChange={(e) => {
                    setModalSearch(e.target.value);
                    setModalPage(0);
                  }}
                  placeholder="Search startup by name or industry..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 shrink-0">Industry:</span>
                <select
                  value={modalIndustry}
                  onChange={(e) => {
                    setModalIndustry(e.target.value);
                    setModalPage(0);
                  }}
                  className="bg-white border border-gray-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
                >
                  {modalIndustries.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Leaderboard Table / Cards */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5">
              {modalFilteredStartups.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">
                  No startups match your search filter.
                </div>
              ) : (
                modalPageStartups.map((st, idx) => {
                  const globalRank = st.rank || (modalPage * modalItemsPerPage + idx + 1);
                  const isUserOwned = myStartups.some((m) => String(m.id) === String(st.id));
                  const score = st.overallScore ?? st.score ?? 0;
                  const growth = st.growthScore ?? st.growthRate ?? 0;
                  const investment = st.investmentScore ?? 0;
                  const ecosystem = st.ecosystemScore ?? 0;
                  const engagement = st.engagementScore ?? 0;
                  const rawTrl = String(st.trlLevel || "");
                  const trlNum = parseInt(rawTrl.match(/\d/)?.[0] || "4", 10);

                  return (
                    <div
                      key={st.id || idx}
                      className={`p-3 sm:p-4 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                        isUserOwned
                          ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-200/60 shadow-xs"
                          : "bg-white border-gray-200/90 hover:border-indigo-200 hover:shadow-2xs"
                      }`}
                    >
                      {/* Left: Rank & Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rank Badge */}
                        <div
                          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border shadow-2xs relative ${
                            globalRank === 1
                              ? "bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-200"
                              : globalRank <= 3
                              ? "bg-amber-50 text-amber-900 border-amber-200"
                              : isUserOwned
                              ? "bg-indigo-100 text-indigo-800 border-indigo-300 font-black"
                              : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                        >
                          <span className="text-[10px] font-semibold">#</span>
                          <span>{globalRank}</span>
                          {globalRank === 1 && (
                            <Crown className="w-3.5 h-3.5 text-amber-500 absolute -top-1.5 -right-1 drop-shadow" />
                          )}
                        </div>

                        {/* Name & Tags */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              onClick={() => {
                                const match = sortedUserVentures.find((uv) => String(uv.id) === String(st.id));
                                setSelectedVentureForDetails(match || {
                                  ...st,
                                  isRanked: true,
                                  rankNum: globalRank,
                                  overallScore: score,
                                  growthScore: growth,
                                  investmentScore: investment,
                                  ecosystemScore: ecosystem,
                                  engagementScore: engagement,
                                  trlNum,
                                });
                              }}
                              className="font-bold text-sm text-gray-900 hover:text-indigo-600 transition-colors cursor-pointer truncate"
                              title={`View statistical ranking details for ${st.companyName}`}
                            >
                              {st.companyName}
                            </span>
                            {isUserOwned && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-2xs">
                                Your Venture
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              {st.industry || "Tech"}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              TRL {trlNum}
                            </span>
                            {(st.registrationAgency === "BIR" || st.isGovernmentRegistered) && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                {st.registrationAgency || "Govt Reg"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Scores */}
                      <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-5 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                        {/* 4 Pillars */}
                        <div className="grid grid-cols-4 gap-1.5 text-center shrink-0">
                          <div className="bg-blue-50/80 rounded-md px-1.5 py-1 border border-blue-100 min-w-[50px]">
                            <span className="block text-[8px] text-blue-600 font-semibold uppercase">Growth</span>
                            <span className="text-[10px] font-bold text-gray-800">{growth}%</span>
                          </div>
                          <div className="bg-purple-50/80 rounded-md px-1.5 py-1 border border-purple-100 min-w-[50px]">
                            <span className="block text-[8px] text-purple-600 font-semibold uppercase">Invest</span>
                            <span className="text-[10px] font-bold text-gray-800">{investment}%</span>
                          </div>
                          <div className="bg-pink-50/80 rounded-md px-1.5 py-1 border border-pink-100 min-w-[50px]">
                            <span className="block text-[8px] text-pink-600 font-semibold uppercase">Eco</span>
                            <span className="text-[10px] font-bold text-gray-800">{ecosystem}%</span>
                          </div>
                          <div className="bg-amber-50/80 rounded-md px-1.5 py-1 border border-amber-100 min-w-[50px]">
                            <span className="block text-[8px] text-amber-700 font-semibold uppercase">Engage</span>
                            <span className="text-[10px] font-bold text-gray-800">{engagement}%</span>
                          </div>
                        </div>

                        {/* Composite Score */}
                        <div className="text-right shrink-0 min-w-[65px]">
                          <div className="text-[9px] uppercase font-bold text-gray-400">Score</div>
                          <div className="text-lg font-black text-gray-900 leading-tight">
                            <span>{score}</span>
                            <span className="text-[10px] text-gray-400 font-normal">/100</span>
                          </div>
                        </div>

                        {/* Action: Details */}
                        <button
                          type="button"
                          onClick={() => {
                            const match = sortedUserVentures.find((uv) => String(uv.id) === String(st.id));
                            setSelectedVentureForDetails(match || {
                              ...st,
                              isRanked: true,
                              rankNum: globalRank,
                              overallScore: score,
                              growthScore: growth,
                              investmentScore: investment,
                              ecosystemScore: ecosystem,
                              engagementScore: engagement,
                              trlNum,
                            });
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer shrink-0 border border-indigo-200"
                          title="View Ranking Statistical Details"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Details</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Pagination Footer */}
            <div className="px-5 py-3 border-t border-gray-200 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="text-xs text-gray-500 font-medium">
                Page {modalPage + 1} of {modalTotalPages} ({modalFilteredStartups.length} startups)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setModalPage((p) => Math.max(0, p - 1))}
                  disabled={modalPage === 0}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1 shadow-2xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalPage((p) => Math.min(modalTotalPages - 1, p + 1))}
                  disabled={modalPage >= modalTotalPages - 1}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1 shadow-2xs"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowLeaderboardModal(false)}
                  className="ml-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistical Ranking Details Modal */}
      {selectedVentureForDetails && (() => {
        const v = selectedVentureForDetails;
        const vRank = v.rankNum != null ? v.rankNum : (v.isRanked ? 1 : null);
        const vScore = v.overallScore !== null && v.overallScore !== undefined ? Number(v.overallScore) : null;

        // Pillar Scores (0-100)
        const vGrowth = Math.min(100, Math.max(0, Math.round(Number(v.growthScore || (v.averageStartupGrowthRate || 0) * 1.5 || 30))));
        const vInvestment = Math.min(100, Math.max(0, Math.round(Number(v.investmentScore || ((v.totalStartupFundingReceived || 0) > 0 ? 65 : 20)))));
        const vEcosystem = Math.min(100, Math.max(0, Math.round(Number(v.ecosystemScore || ((v.trlNum || 1) * 8 + (v.isGovernmentRegistered ? 20 : 5))))));
        const vEngagement = Math.min(100, Math.max(0, Math.round(Number(v.engagementScore || Math.min(95, (v.viewsCount || 0) * 2 + 15)))));

        // Weighted Points (Growth 30%, Capital 30%, Readiness 25%, Engagement 15%)
        const growthPts = (vGrowth * 0.30).toFixed(1);
        const investPts = (vInvestment * 0.30).toFixed(1);
        const ecoPts = (vEcosystem * 0.25).toFixed(1);
        const engagePts = (vEngagement * 0.15).toFixed(1);
        const calculatedComposite = (Number(growthPts) + Number(investPts) + Number(ecoPts) + Number(engagePts)).toFixed(1);

        // Radar Data
        const radarData = [
          { subject: "Growth (30%)", Venture: vGrowth, EcosystemAvg: ecosystemAverages.growth, fullMark: 100 },
          { subject: "Capital (30%)", Venture: vInvestment, EcosystemAvg: ecosystemAverages.investment, fullMark: 100 },
          { subject: "Readiness (25%)", Venture: vEcosystem, EcosystemAvg: ecosystemAverages.ecosystem, fullMark: 100 },
          { subject: "Engagement (15%)", Venture: vEngagement, EcosystemAvg: ecosystemAverages.engagement, fullMark: 100 },
        ];

        // Benchmark Bar Data
        const benchmarkData = [
          {
            pillar: "Growth",
            "This Venture": vGrowth,
            "Top 10 Benchmark": ecosystemAverages.top10Growth,
            "Ecosystem Avg": ecosystemAverages.growth,
          },
          {
            pillar: "Capital",
            "This Venture": vInvestment,
            "Top 10 Benchmark": ecosystemAverages.top10Invest,
            "Ecosystem Avg": ecosystemAverages.investment,
          },
          {
            pillar: "Readiness",
            "This Venture": vEcosystem,
            "Top 10 Benchmark": ecosystemAverages.top10Eco,
            "Ecosystem Avg": ecosystemAverages.ecosystem,
          },
          {
            pillar: "Engagement",
            "This Venture": vEngagement,
            "Top 10 Benchmark": ecosystemAverages.top10Eng,
            "Ecosystem Avg": ecosystemAverages.engagement,
          },
        ];

        // Weight Pie Data
        const pieData = [
          { name: "Growth (30%)", value: 30, color: "#3b82f6", score: vGrowth, earned: growthPts },
          { name: "Capital (30%)", value: 30, color: "#8b5cf6", score: vInvestment, earned: investPts },
          { name: "Readiness (25%)", value: 25, color: "#ec4899", score: vEcosystem, earned: ecoPts },
          { name: "Engagement (15%)", value: 15, color: "#f59e0b", score: vEngagement, earned: engagePts },
        ];

        const totalEcosystemCount = Math.max(topStartups.length, myStartups.length, 1);
        const percentile = vRank ? Math.max(1, Math.round(((totalEcosystemCount - vRank + 1) / totalEcosystemCount) * 100)) : null;

        const effectiveScore = vScore !== null ? vScore : Number(calculatedComposite);
        let tierLabel = "Development Stage";
        let tierBg = "bg-slate-100 text-slate-800 border-slate-300";
        if (effectiveScore >= 80) {
          tierLabel = "Tier 1: Elite Ecosystem Leader";
          tierBg = "bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-100";
        } else if (effectiveScore >= 65) {
          tierLabel = "Tier 2: High-Velocity Performer";
          tierBg = "bg-indigo-50 text-indigo-800 border-indigo-300";
        } else if (effectiveScore >= 45) {
          tierLabel = "Tier 3: Emerging Contender";
          tierBg = "bg-amber-50 text-amber-800 border-amber-300";
        }

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto"
            onClick={() => setSelectedVentureForDetails(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-5 sm:px-6 py-4 border-b border-gray-200 bg-slate-50/90 flex items-start justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-black text-base sm:text-lg shrink-0 border shadow-2xs relative ${
                      vRank === 1
                        ? "bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-200"
                        : vRank && vRank <= 3
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-indigo-100 text-indigo-800 border-indigo-200"
                    }`}
                  >
                    {vRank ? (
                      <>
                        <span className="text-xs font-semibold">#</span>
                        <span>{vRank}</span>
                        {vRank === 1 && (
                          <Crown className="w-4 h-4 text-amber-500 absolute -top-1.5 -right-1 drop-shadow" />
                        )}
                      </>
                    ) : (
                      <span className="text-xs font-bold text-gray-500">—</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-xl font-black text-gray-900 truncate" title={v.companyName}>
                        {v.companyName}
                      </h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${tierBg}`}>
                        {tierLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-gray-500">
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {v.industry || "General Tech"}
                      </span>
                      <span>•</span>
                      <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        TRL {v.trlNum || 1} Stage
                      </span>
                      {v.isGovernmentRegistered && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {v.registrationAgency || "Government Registered"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Composite Score</div>
                    <div className="text-2xl font-black text-gray-900 leading-tight">
                      {vScore !== null ? vScore : calculatedComposite}
                      <span className="text-xs font-normal text-gray-400 ml-0.5">/100</span>
                    </div>
                    {percentile && (
                      <span className="text-[10px] font-bold text-indigo-600 block">
                        Top {Math.max(1, 100 - percentile)}% Ecosystem
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedVentureForDetails(null)}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    aria-label="Close details"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Navigation Tabs */}
              <div className="px-5 sm:px-6 border-b border-gray-200 bg-white flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setDetailsTab("charts")}
                  className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                    detailsTab === "charts"
                      ? "border-indigo-600 text-indigo-700"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Statistical Ranking Charts</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailsTab("breakdown")}
                  className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                    detailsTab === "breakdown"
                      ? "border-indigo-600 text-indigo-700"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>Weight Formula & Operational Drivers</span>
                </button>
              </div>

              {/* Modal Body Content */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
                {detailsTab === "charts" ? (
                  <>
                    {/* Top Statistical Summary Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100">
                        <div className="flex items-center justify-between text-blue-700 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Growth Velocity</span>
                          <TrendingUp className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-xl font-black text-gray-900">{vGrowth}<span className="text-xs font-normal text-gray-500">/100</span></div>
                        <div className="text-[11px] text-blue-600 font-semibold mt-0.5">Weighted: {growthPts} pts (30%)</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100">
                        <div className="flex items-center justify-between text-purple-700 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Capital & Funding</span>
                          <DollarSign className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-xl font-black text-gray-900">{vInvestment}<span className="text-xs font-normal text-gray-500">/100</span></div>
                        <div className="text-[11px] text-purple-600 font-semibold mt-0.5">Weighted: {investPts} pts (30%)</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-pink-50/70 border border-pink-100">
                        <div className="flex items-center justify-between text-pink-700 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Tech Readiness</span>
                          <Layers className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-xl font-black text-gray-900">{vEcosystem}<span className="text-xs font-normal text-gray-500">/100</span></div>
                        <div className="text-[11px] text-pink-600 font-semibold mt-0.5">Weighted: {ecoPts} pts (25%)</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100">
                        <div className="flex items-center justify-between text-amber-700 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Engagement</span>
                          <Users className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-xl font-black text-gray-900">{vEngagement}<span className="text-xs font-normal text-gray-500">/100</span></div>
                        <div className="text-[11px] text-amber-600 font-semibold mt-0.5">Weighted: {engagePts} pts (15%)</div>
                      </div>
                    </div>

                    {/* Chart Row 1: Radar (Spider) Chart & Benchmark Bar Chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Radar Chart Card */}
                      <div className="bg-slate-50/70 rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col">
                        <div className="mb-2">
                          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                            <Target className="w-4 h-4 text-indigo-600" />
                            <span>Pillar Dimension Performance (Radar Profile)</span>
                          </h3>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Compares this venture's footprint against ecosystem averages across all 4 ranking dimensions.
                          </p>
                        </div>

                        <div className="min-h-[260px] h-64 sm:h-72 w-full mt-auto">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                              <PolarGrid stroke="#e2e8f0" />
                              <PolarAngleAxis dataKey="subject" tick={{ fill: "#475569", fontSize: 11, fontWeight: 600 }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 9 }} />
                              <Radar name="This Venture" dataKey="Venture" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.45} />
                              <Radar name="Ecosystem Avg" dataKey="EcosystemAvg" stroke="#94a3b8" fill="#cbd5e1" fillOpacity={0.25} />
                              <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Benchmark Bar Chart Card */}
                      <div className="bg-slate-50/70 rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col">
                        <div className="mb-2">
                          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                            <BarChart3 className="w-4 h-4 text-indigo-600" />
                            <span>Competitive Ecosystem Benchmarks</span>
                          </h3>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Direct comparison against Top 10 Leaders and Median Ecosystem performance.
                          </p>
                        </div>

                        <div className="min-h-[260px] h-64 sm:h-72 w-full mt-auto">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={benchmarkData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                              <XAxis dataKey="pillar" tick={{ fill: "#475569", fontSize: 11, fontWeight: 600 }} />
                              <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                              <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                              <Bar dataKey="This Venture" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                              <Bar dataKey="Top 10 Benchmark" fill="#a855f7" radius={[6, 6, 0, 0]} />
                              <Bar dataKey="Ecosystem Avg" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Chart Row 2: Weight Contribution Donut Chart & Score Formula */}
                    <div className="bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/40 rounded-2xl border border-indigo-100 p-5">
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="w-full md:w-1/2 flex flex-col items-center">
                          <div className="text-center mb-1">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                              Composite Score Weight Allocation
                            </h4>
                            <p className="text-[11px] text-gray-500">How each pillar contributes to the final ranking score</p>
                          </div>
                          <div className="min-h-[200px] h-52 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={pieData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={55}
                                  outerRadius={80}
                                  paddingAngle={4}
                                  dataKey="value"
                                >
                                  {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip
                                  formatter={(val, name, item) => [`${item.payload.earned} pts (${val}%)`, `${name}: Score ${item.payload.score}/100`]}
                                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "10px", fontSize: "11px" }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="w-full md:w-1/2 space-y-2">
                          <div className="text-xs font-extrabold text-gray-800 uppercase tracking-wider mb-2">
                            Pillar Points Earned Breakdown:
                          </div>
                          {pieData.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white/80 border border-slate-200/80 shadow-2xs">
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                                <span className="text-xs font-semibold text-gray-800">{p.name}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-black text-gray-900">{p.earned}</span>
                                <span className="text-[10px] text-gray-400 font-medium"> / {p.value} max pts</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Mathematical Formula Explanation Table */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
                      <div className="px-5 py-3.5 bg-slate-50 border-b border-gray-200 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">StartUpSphere Leaderboard Ranking Formula</h3>
                          <p className="text-xs text-gray-500">Standardized composite calculation defining national venture standings</p>
                        </div>
                        <span className="text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200">
                          Score = Σ (Pillar_Score × Weight)
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100/70 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                              <th className="px-4 py-3">Pillar Dimension</th>
                              <th className="px-4 py-3">Weight</th>
                              <th className="px-4 py-3">Venture Metric Drivers</th>
                              <th className="px-4 py-3 text-center">Score (0-100)</th>
                              <th className="px-4 py-3 text-right">Points Earned</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            <tr className="hover:bg-slate-50/60">
                              <td className="px-4 py-3 font-bold text-gray-900 flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                                <span>Growth Velocity</span>
                              </td>
                              <td className="px-4 py-3 font-semibold text-blue-600">30%</td>
                              <td className="px-4 py-3 text-gray-600">
                                Growth rate: {v.averageStartupGrowthRate || 0}% • Annual Revenue: ₱{Number(v.annualRevenue || v.revenue || 0).toLocaleString()} • Team: {v.numberOfEmployees || "Early"}
                              </td>
                              <td className="px-4 py-3 text-center font-bold">{vGrowth}</td>
                              <td className="px-4 py-3 text-right font-black text-blue-700">{growthPts}</td>
                            </tr>
                            <tr className="hover:bg-slate-50/60">
                              <td className="px-4 py-3 font-bold text-gray-900 flex items-center gap-1.5">
                                <DollarSign className="w-3.5 h-3.5 text-purple-600" />
                                <span>Capital & Funding</span>
                              </td>
                              <td className="px-4 py-3 font-semibold text-purple-600">30%</td>
                              <td className="px-4 py-3 text-gray-600">
                                Total funding: ₱{Number(v.totalStartupFundingReceived || 0).toLocaleString()} • Closed rounds: {v.numberOfFundingRounds || 0} • Paid-up: ₱{Number(v.paidUpCapital || 0).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-center font-bold">{vInvestment}</td>
                              <td className="px-4 py-3 text-right font-black text-purple-700">{investPts}</td>
                            </tr>
                            <tr className="hover:bg-slate-50/60">
                              <td className="px-4 py-3 font-bold text-gray-900 flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-pink-600" />
                                <span>Tech Readiness & Compliance</span>
                              </td>
                              <td className="px-4 py-3 font-semibold text-pink-600">25%</td>
                              <td className="px-4 py-3 text-gray-600">
                                TRL Level {v.trlNum || 1} • Agency: {v.registrationAgency || (v.isGovernmentRegistered ? "Govt Reg" : "Pending")} • Subsidies: ₱{Number(v.amountOfGovernmentGrantsOrSubsidiesReceived || 0).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-center font-bold">{vEcosystem}</td>
                              <td className="px-4 py-3 text-right font-black text-pink-700">{ecoPts}</td>
                            </tr>
                            <tr className="hover:bg-slate-50/60">
                              <td className="px-4 py-3 font-bold text-gray-900 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-amber-600" />
                                <span>Community & Public Engagement</span>
                              </td>
                              <td className="px-4 py-3 font-semibold text-amber-600">15%</td>
                              <td className="px-4 py-3 text-gray-600">
                                Platform views: {v.viewsCount || 0} • Social followers: {v.facebookFollowers || 0} • Inquiries active
                              </td>
                              <td className="px-4 py-3 text-center font-bold">{vEngagement}</td>
                              <td className="px-4 py-3 text-right font-black text-amber-700">{engagePts}</td>
                            </tr>
                            <tr className="bg-indigo-50/60 font-black text-gray-900">
                              <td className="px-4 py-3 text-indigo-900 font-extrabold" colSpan={4}>
                                Official Composite Leaderboard Score
                              </td>
                              <td className="px-4 py-3 text-right text-base text-indigo-700 font-black">
                                {vScore !== null ? vScore : calculatedComposite} / 100
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Operational Drivers Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="p-4 rounded-xl border border-gray-200 bg-white">
                        <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
                          Official Registration & Certifications
                        </span>
                        <div className="flex items-center gap-2 mt-2">
                          <ShieldCheck className="w-5 h-5 text-emerald-600" />
                          <span className="text-sm font-bold text-gray-900">
                            {v.registrationAgency ? `${v.registrationAgency} Registered` : (v.isGovernmentRegistered ? "Government Certified" : "Unverified / Pending Registration")}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Certificate/TIN: {v.tin || v.businessLicenseNumber || v.registrationNumber || "On file in verified repository"}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl border border-gray-200 bg-white">
                        <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
                          Technology Readiness Level (TRL)
                        </span>
                        <div className="flex items-center gap-2 mt-2">
                          <Zap className="w-5 h-5 text-amber-600" />
                          <span className="text-sm font-bold text-gray-900">
                            TRL {v.trlNum || 1} Stage
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {v.trlNum >= 7 ? "Commercial application operational & verified" : v.trlNum >= 4 ? "Technology validated in lab/relevant environment" : "Early research and prototype development"}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-5 sm:px-6 py-3.5 border-t border-gray-200 bg-slate-50 flex items-center justify-between shrink-0">
                <span className="text-xs text-gray-500 hidden sm:inline">
                  Rankings computed dynamically across ecosystem data points
                </span>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVentureForDetails(null);
                      navigate(`/startup/${v.id}`);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-colors cursor-pointer"
                  >
                    <span>Open Full Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedVentureForDetails(null)}
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
