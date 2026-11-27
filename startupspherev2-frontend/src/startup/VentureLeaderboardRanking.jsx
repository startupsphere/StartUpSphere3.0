import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getBackendUrl, getAuthHeaders } from "../config/apiConfig";
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
} from "lucide-react";

export default function VentureLeaderboardRanking() {
  const navigate = useNavigate();

  const [myStartups, setMyStartups] = useState([]);
  const [topStartups, setTopStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [rankingMetric, setRankingMetric] = useState("overall"); // overall, growth, investment, ecosystem, engagement

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
                onClick={() => navigate("/all-startup-dashboard")}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg shadow-2xs hover:shadow transition-all cursor-pointer"
                title="Explore Complete Ecosystem Leaderboard"
              >
                <Award className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Ecosystem Leaderboard</span>
                <span className="sm:hidden">Leaderboard</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/add-startup")}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Venture</span>
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
                              onClick={() => navigate(`/startup/${venture.id}`)}
                              title={venture.companyName}
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

                        {/* Action Link */}
                        <button
                          type="button"
                          onClick={() => navigate(`/startup/${venture.id}`)}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 text-xs font-semibold rounded-xl border border-gray-200 hover:border-indigo-200 transition-all cursor-pointer shrink-0"
                        >
                          <span>View Profile</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 4-Pillar Score Breakdown */}
                    <div className="mt-5 pt-4 border-t border-gray-100">
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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
