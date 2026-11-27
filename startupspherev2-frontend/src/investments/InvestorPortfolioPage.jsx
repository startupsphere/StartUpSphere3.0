import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getBackendUrl, getAuthHeaders } from "../config/apiConfig";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Building2,
  TrendingUp,
  Coins,
  Search,
  ExternalLink,
  Calendar,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  Briefcase,
  RefreshCw,
  Plus,
  Kanban,
  List,
  Compass,
  MapPin,
  Tag,
  DollarSign,
  XCircle,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { PIPELINE_STAGES } from "./InvestmentInquiriesPage";
import StageHistoryBullets from "./StageHistoryBullets";

export const INVESTMENT_FOCUS_OPTIONS = [
  "Direct Equity / Seed Round",
  "Pre-Seed Angel Capital",
  "Series A Growth Funding",
  "SAFE / Convertible Note",
  "Strategic Partnership & Synergies",
  "Revenue-Share / Debt Financing",
  "General Investment Discussion & Inquiry",
];

export default function InvestorPortfolioPage() {
  const navigate = useNavigate();

  const [investments, setInvestments] = useState([]);
  const [allStartups, setAllStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "kanban"
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");

  // Detail / stage modal
  const [activeModal, setActiveModal] = useState(null);
  const [newStageInput, setNewStageInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Express Interest modal
  const [isExpressModalOpen, setIsExpressModalOpen] = useState(false);
  const [submittingInterest, setSubmittingInterest] = useState(false);
  const [expressForm, setExpressForm] = useState({
    startupId: "",
    investorName: "",
    investorEmail: "",
    investorPhone: "",
    investorType: "Angel Investor / Private Equity",
    amountRange: "₱500,000",
    processType: "Direct Equity / Seed Round",
    message: "",
  });

  // Fetch investor's expressed deals and registered startups in system
  const fetchMyInvestments = async () => {
    setLoading(true);
    try {
      const [invRes, stRes] = await Promise.all([
        fetch(`${getBackendUrl()}/api/investments/my-investments`, {
          headers: getAuthHeaders(),
          credentials: "include",
        }),
        fetch(`${getBackendUrl()}/startups?page=0&size=100`, {
          headers: getAuthHeaders(),
          credentials: "include",
        }),
      ]);

      if (invRes.ok) {
        const json = await invRes.json();
        setInvestments(json.data || []);
      }

      if (stRes.ok) {
        const startupsData = await stRes.json();
        const list = Array.isArray(startupsData) ? startupsData : startupsData.content || [];
        setAllStartups(list);
        const eligible = list.filter((s) => {
          const status = s.status?.trim() || "";
          const isApproved = status.toLowerCase() === "approved" || status.toLowerCase() === "accepted";
          const isRejected = status.toLowerCase() === "rejected";
          const isVerified = Boolean(s.emailVerified);
          return isApproved && isVerified && !isRejected;
        });
        if (eligible.length > 0 && !expressForm.startupId) {
          setExpressForm((prev) => ({ ...prev, startupId: eligible[0].id }));
        }
      }
    } catch (err) {
      console.warn("Could not fetch investor deals from backend:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Populate user profile info into express interest form
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const u = JSON.parse(userStr);
        setExpressForm((prev) => ({
          ...prev,
          investorName: `${u.firstname || ""} ${u.lastname || ""}`.trim() || prev.investorName,
          investorEmail: u.email || prev.investorEmail,
        }));
      }
    } catch {}

    fetchMyInvestments();
  }, []);

  // Update deal stage
  const handleUpdateStage = async (dealId, nextStage, nextNotes) => {
    setSaving(true);
    try {
      const response = await fetch(`${getBackendUrl()}/api/investments/${dealId}/stage`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stage: nextStage,
          notes: nextNotes !== undefined ? nextNotes : "",
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to update pipeline stage on server");
      }

      setInvestments((prev) =>
        prev.map((item) =>
          item.id === dealId
            ? { ...item, stage: nextStage, notes: nextNotes !== undefined ? nextNotes : item.notes }
            : item
        )
      );

      const stageLabel = PIPELINE_STAGES.find((s) => s.id === nextStage)?.label || nextStage;
      toast.success(`Pipeline stage updated to: ${stageLabel}`);

      if (activeModal && activeModal.id === dealId) {
        setActiveModal((prev) => ({
          ...prev,
          stage: nextStage,
          notes: nextNotes !== undefined ? nextNotes : prev.notes,
        }));
      }
    } catch (err) {
      console.error("Error updating pipeline stage:", err);
      toast.error(err.message || "Failed to update pipeline stage");
    } finally {
      setSaving(false);
    }
  };

  // Quick move to next/prev stage
  const handleQuickAdvanceStage = (deal, direction) => {
    const currentIndex = PIPELINE_STAGES.findIndex((s) => s.id === (deal.stage || "NEW_INQUIRY"));
    if (currentIndex === -1) return;

    let targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= PIPELINE_STAGES.length) return;

    const targetStage = PIPELINE_STAGES[targetIndex].id;
    handleUpdateStage(deal.id, targetStage, "");
  };

  // Submit real investment interest to any startup
  const handleExpressInterestSubmit = async (e) => {
    e.preventDefault();
    if (!expressForm.startupId) {
      toast.error("Please select a target startup to invest in");
      return;
    }

    const targetSt = allStartups.find((s) => String(s.id) === String(expressForm.startupId));
    if (targetSt) {
      const status = targetSt.status?.trim() || "";
      const isApproved = status.toLowerCase() === "approved" || status.toLowerCase() === "accepted";
      const isRejected = status.toLowerCase() === "rejected";
      const isVerified = Boolean(targetSt.emailVerified);
      if (isRejected) {
        toast.error("Investors cannot invest in rejected businesses.");
        return;
      }
      if (!isVerified) {
        toast.error("Investors cannot invest in unverified businesses.");
        return;
      }
      if (!isApproved) {
        toast.error("Investors can only invest in verified and accepted businesses.");
        return;
      }
    }

    setSubmittingInterest(true);
    try {
      const response = await fetch(
        `${getBackendUrl()}/startups/${expressForm.startupId}/express-investment-interest`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            investorName: expressForm.investorName,
            investorEmail: expressForm.investorEmail,
            investorPhone: expressForm.investorPhone,
            investorType: expressForm.investorType,
            amountRange: expressForm.amountRange,
            processType: expressForm.processType,
            message: expressForm.message,
          }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to submit investment interest");
      }

      const targetSt = allStartups.find((s) => String(s.id) === String(expressForm.startupId));
      toast.success(
        `Investment interest successfully submitted to ${targetSt?.companyName || "the startup"}! It is now active in your Deal Flow.`
      );
      setIsExpressModalOpen(false);

      // Refresh list from backend
      await fetchMyInvestments();
    } catch (err) {
      console.error("Error expressing investment interest:", err);
      toast.error(err.message || "Could not submit investment interest");
    } finally {
      setSubmittingInterest(false);
    }
  };

  // Only verified, accepted and non-rejected startups are eligible to receive investments
  const isEligibleStartup = (s) => {
    if (!s) return false;
    const status = s.status?.trim() || "";
    const isApproved = status.toLowerCase() === "approved" || status.toLowerCase() === "accepted";
    const isRejected = status.toLowerCase() === "rejected";
    const isVerified = Boolean(s.emailVerified);
    return isApproved && isVerified && !isRejected;
  };

  const eligibleStartups = useMemo(() => {
    return allStartups.filter(isEligibleStartup);
  }, [allStartups]);

  // Filtered & de-duplicated investments (1 authentic card per startup based on chosen investment focus)
  const filteredInvestments = useMemo(() => {
    // 1. Group by startup to select only the best/most specific card per startup
    const uniqueMap = new Map();
    for (const item of investments) {
      if (!item || !item.startup || !item.startup.id || !isEligibleStartup(item.startup)) continue;
      const stId = item.startup.id;
      if (!uniqueMap.has(stId)) {
        uniqueMap.set(stId, item);
      } else {
        const existing = uniqueMap.get(stId);
        const isGeneric = (f) => !f || f === "Direct Investment" || f === "Flexible / Discussion";
        // Prefer the one that has an explicit chosen investment focus and parsed ticket size
        if (isGeneric(existing.processType) && !isGeneric(item.processType)) {
          uniqueMap.set(stId, item);
        } else if (existing.id && item.id && item.id > existing.id && !isGeneric(item.processType)) {
          uniqueMap.set(stId, item);
        }
      }
    }

    const uniqueList = Array.from(uniqueMap.values());

    return uniqueList.filter((item) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        (item.startup?.companyName && item.startup.companyName.toLowerCase().includes(searchLower)) ||
        (item.startup?.industry && item.startup.industry.toLowerCase().includes(searchLower)) ||
        (item.message && item.message.toLowerCase().includes(searchLower)) ||
        (item.notes && item.notes.toLowerCase().includes(searchLower));

      const matchesStage = stageFilter === "all" || item.stage === stageFilter;

      return matchesSearch && matchesStage;
    });
  }, [investments, searchQuery, stageFilter]);

  // Helper to safely extract numeric funding amount from a range or string
  const parseAmountNumber = (amtStr) => {
    if (!amtStr) return 0;
    const cleaned = String(amtStr).replace(/[^0-9.]/g, "");
    const val = parseFloat(cleaned);
    return isNaN(val) ? 0 : val;
  };

  // Metrics based on unique active investments
  const uniqueAllInvestments = useMemo(() => {
    const uniqueMap = new Map();
    for (const item of investments) {
      if (!item || !item.startup || !item.startup.id || !isEligibleStartup(item.startup)) continue;
      const stId = item.startup.id;
      if (!uniqueMap.has(stId)) {
        uniqueMap.set(stId, item);
      } else {
        const existing = uniqueMap.get(stId);
        const isGeneric = (f) => !f || f === "Direct Investment" || f === "Flexible / Discussion";
        if (isGeneric(existing.processType) && !isGeneric(item.processType)) {
          uniqueMap.set(stId, item);
        }
      }
    }
    return Array.from(uniqueMap.values());
  }, [investments]);

  const totalCount = uniqueAllInvestments.length;
  const activeCount = uniqueAllInvestments.filter(
    (i) => i.stage !== "CLOSED_DEAL" && i.stage !== "PASSED"
  ).length;
  const closedInvestments = useMemo(() => {
    return uniqueAllInvestments.filter((i) => i.stage === "CLOSED_DEAL" && isEligibleStartup(i.startup));
  }, [uniqueAllInvestments]);
  const closedCount = closedInvestments.length;

  const totalCapitalInvested = useMemo(() => {
    return closedInvestments.reduce((sum, item) => {
      const amt = parseAmountNumber(item.amountRange || item.message);
      return sum + amt;
    }, 0);
  }, [closedInvestments]);

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                onClick={() => navigate("/")}
                className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer shrink-0"
                title="Back to Map"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                    <Briefcase className="w-4 h-4" />
                  </span>
                  <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight truncate">
                    Interested Ventures & Deal Flow
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                  Businesses and startups you have expressed interest in and are tracking for investment
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white text-amber-800 shadow-2xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  Ventures Grid
                </button>
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "kanban"
                      ? "bg-white text-amber-800 shadow-2xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Kanban className="w-3.5 h-3.5" />
                  Pipeline View
                </button>
              </div>

              <button
                onClick={fetchMyInvestments}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                title="Refresh Pipeline"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>

              <button
                onClick={() => setIsExpressModalOpen(true)}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Express Interest in a Startup</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Interested Ventures</span>
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-gray-900 mt-2">{totalCount}</p>
            <span className="text-[11px] text-gray-400 mt-1">Startups in your deal flow</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200/90 shadow-2xs flex flex-col justify-between bg-amber-50/20">
            <div className="flex items-center justify-between text-amber-800">
              <span className="text-xs font-bold uppercase tracking-wider">Active Deals</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-700 mt-2">{activeCount}</p>
            <span className="text-[11px] text-amber-600 font-medium mt-1">
              Currently in evaluation or negotiation
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200/90 shadow-2xs flex flex-col justify-between bg-emerald-50/20">
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-xs font-bold uppercase tracking-wider">Total Capital Invested</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700 mt-2">
              ₱{totalCapitalInvested.toLocaleString()}
            </p>
            <span className="text-[11px] text-emerald-600 font-medium mt-1">
              Across {closedCount} funded {closedCount === 1 ? "venture" : "ventures"}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Closed / Funded Deals</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-gray-900 mt-2">{closedCount}</p>
            <span className="text-[11px] text-gray-400 mt-1">Completed investments</span>
          </div>
        </div>

        {/* Business-Specific Invested Funds Showcase (When closed investments exist) */}
        {closedInvestments.length > 0 && (
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-5 text-white shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Your Funded Businesses Portfolio
                </h3>
                <p className="text-xs text-emerald-100/80 mt-0.5">
                  Breakdown of capital funded into specific businesses reached through Closed/Funded stage
                </p>
              </div>
              <div className="text-xs font-semibold px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-200 self-start sm:self-auto">
                Cumulative: ₱{totalCapitalInvested.toLocaleString()}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {closedInvestments.map((deal) => {
                const amountVal = parseAmountNumber(deal.amountRange || deal.message);
                return (
                  <div
                    key={`funded-${deal.id}`}
                    className="bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl p-3.5 backdrop-blur-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">
                          {deal.startup?.companyName || "Portfolio Business"}
                        </h4>
                        <p className="text-[11px] text-emerald-200 truncate mt-0.5">
                          {deal.startup?.industry || "Startup"}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-400/20 text-emerald-300 text-[10px] font-bold rounded-full uppercase border border-emerald-400/30">
                        Funded
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/10 flex items-baseline justify-between">
                      <span className="text-[11px] text-slate-300">Invested Capital:</span>
                      <span className="text-base font-extrabold text-emerald-300">
                        {amountVal > 0 ? `₱${amountVal.toLocaleString()}` : (deal.amountRange || "Committed")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search interested businesses by company name, industry, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          >
            <option value="all">All Pipeline Stages</option>
            {PIPELINE_STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode: Grid View */}
        {viewMode === "grid" ? (
          filteredInvestments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400 shadow-2xs">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-700">No Interested Ventures Yet</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
                You can express interest directly from any startup on the 3D map, or click the button below to submit your investment interest to a registered business.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpressModalOpen(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Express Interest in a Startup</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Explore Startups on Map</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInvestments.map((deal) => {
                const stageMeta =
                  PIPELINE_STAGES.find((s) => s.id === deal.stage) || PIPELINE_STAGES[0];

                return (
                  <div
                    key={deal.id}
                    className="bg-white rounded-2xl border border-gray-200 hover:border-amber-400 hover:shadow-sm transition-all p-5 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Top Bar: Industry & Stage Badge */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-gray-700 text-[10px] font-bold border border-slate-200 truncate max-w-[140px]">
                          {deal.startup?.industry || "Venture"}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border inline-flex items-center gap-1 ${stageMeta.badgeBg}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${stageMeta.headerBg}`}
                          />
                          {stageMeta.label}
                        </span>
                      </div>

                      {/* Startup Title */}
                      <h3 className="text-base font-black text-gray-900 leading-snug">
                        {deal.startup?.companyName || "Target Venture"}
                      </h3>

                      {deal.startup?.city && (
                        <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                          <span>
                            {deal.startup.city}, {deal.startup.province}
                          </span>
                        </p>
                      )}

                      {/* Proposal Details Box */}
                      <div className="mt-3 p-3 rounded-xl bg-amber-50/40 border border-amber-100/80 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10.5px] font-semibold text-gray-500">
                            Proposed Ticket Size:
                          </span>
                          <span className="font-bold text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-200 shadow-2xs">
                            {deal.amountRange || "Flexible / Discussion"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-500">Investment Focus:</span>
                          <span className="font-medium text-gray-800">
                            {deal.processType || "Direct Investment"}
                          </span>
                        </div>
                      </div>

                      {/* Stage Updates & History in Bullet Form with Expand Icon */}
                      <StageHistoryBullets rawNotes={deal.notes} theme="amber" />
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      {deal.startup?.id ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/startup/${deal.startup.id}`)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer hover:underline"
                        >
                          <span>View Profile</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Archived Startup</span>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setActiveModal(deal);
                          setNewStageInput(deal.stage || "NEW_INQUIRY");
                          setNotesInput("");
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
                      >
                        Update Stage
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Kanban View */
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-[1300px]">
              {PIPELINE_STAGES.map((stage, stageIdx) => {
                const stageDeals = filteredInvestments.filter(
                  (i) => (i.stage || "NEW_INQUIRY") === stage.id
                );

                return (
                  <div
                    key={stage.id}
                    className="flex-1 bg-slate-100/70 border border-slate-200/90 rounded-2xl p-3 flex flex-col min-w-[210px] max-h-[750px] shadow-2xs"
                  >
                    <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${stage.headerBg}`} />
                        <h3 className="text-xs font-bold text-gray-900 leading-tight">
                          {stage.label}
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-white text-gray-700 text-[10px] font-bold border border-gray-200 shadow-2xs">
                        {stageDeals.length}
                      </span>
                    </div>

                    <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
                      {stageDeals.length === 0 ? (
                        <div className="py-10 text-center text-gray-400">
                          <p className="text-[11px] font-medium">No ventures in this stage</p>
                        </div>
                      ) : (
                        stageDeals.map((deal) => (
                          <div
                            key={deal.id}
                            className="bg-white p-3.5 rounded-xl border border-gray-200/90 hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer group"
                          >
                            <div
                              onClick={() => {
                                setActiveModal(deal);
                                setNewStageInput(deal.stage || "NEW_INQUIRY");
                                setNotesInput("");
                              }}
                            >
                              <p className="text-xs font-bold text-gray-900 group-hover:text-amber-700 transition-colors">
                                {deal.startup?.companyName || "Target Venture"}
                              </p>
                              <span className="text-[10.5px] text-gray-500 block">
                                {deal.startup?.industry || "Venture"}
                              </span>

                              <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                  {deal.amountRange || "Discussion"}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {deal.createdAt
                                    ? new Date(deal.createdAt).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                      })
                                    : "Recent"}
                                </span>
                              </div>
                            </div>

                            {/* Quick Pipeline Controls */}
                            <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between gap-1">
                              {stageIdx > 0 ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickAdvanceStage(deal, -1);
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded text-[10px] flex items-center gap-0.5 cursor-pointer"
                                  title="Previous stage"
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                  <span>Prev</span>
                                </button>
                              ) : <span />}

                              {stageIdx < PIPELINE_STAGES.length - 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickAdvanceStage(deal, 1);
                                  }}
                                  className="px-2 py-1 text-amber-800 hover:bg-amber-50 rounded text-[10.5px] font-bold flex items-center gap-0.5 cursor-pointer border border-amber-200/70"
                                  title="Advance to next stage"
                                >
                                  <span>Advance</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Express Interest in Any Startup */}
      {isExpressModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-indigo-950 text-white p-5 sm:p-6 relative">
              <button
                type="button"
                onClick={() => setIsExpressModalOpen(false)}
                className="absolute top-5 right-5 text-gray-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  <Briefcase className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-amber-200">
                  Investor Deal Initiation
                </span>
              </div>
              <h3 className="text-xl font-bold">Express Investment Interest</h3>
              <p className="text-xs text-amber-100/90 mt-0.5">
                Submit an investment proposal to any registered startup on StartUpSphere
              </p>
            </div>

            <form onSubmit={handleExpressInterestSubmit} className="p-5 sm:p-6 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Select Target Startup * (Verified & Accepted Only)</label>
                <select
                  value={expressForm.startupId}
                  onChange={(e) => setExpressForm({ ...expressForm, startupId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl font-semibold text-gray-900 focus:ring-2 focus:ring-amber-500/30"
                  required
                >
                  <option value="">-- Choose a Verified & Accepted Startup to Invest In --</option>
                  {eligibleStartups.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.companyName} {s.industry ? `(${s.industry})` : ""} - Verified & Approved
                    </option>
                  ))}
                </select>
                {eligibleStartups.length === 0 && (
                  <p className="text-[11px] text-red-600 mt-1">
                    No verified and accepted businesses available for investment. Investors cannot invest in rejected or unverified businesses.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Your Name / Organization</label>
                  <input
                    type="text"
                    required
                    value={expressForm.investorName}
                    onChange={(e) => setExpressForm({ ...expressForm, investorName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Investor Type</label>
                  <select
                    value={expressForm.investorType}
                    onChange={(e) => setExpressForm({ ...expressForm, investorType: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-amber-500/30"
                  >
                    <option value="Angel Investor / Private Equity">Angel Investor / Private Equity</option>
                    <option value="Venture Capital (VC)">Venture Capital (VC)</option>
                    <option value="Corporate Venture Capital">Corporate Venture Capital</option>
                    <option value="Investment Syndicate">Investment Syndicate</option>
                    <option value="Accelerator / Incubator Fund">Accelerator / Incubator Fund</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Proposed Ticket Size</label>
                  <input
                    type="text"
                    placeholder="e.g. ₱500,000, ₱1,000,000"
                    value={expressForm.amountRange}
                    onChange={(e) => setExpressForm({ ...expressForm, amountRange: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Investment Focus *</label>
                  <select
                    value={expressForm.processType}
                    onChange={(e) => setExpressForm({ ...expressForm, processType: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-amber-500/30 text-xs sm:text-sm font-semibold"
                  >
                    {INVESTMENT_FOCUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Message to Startup Founders *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why you are interested in this venture, strategic synergies, or meeting proposal..."
                  value={expressForm.message}
                  onChange={(e) => setExpressForm({ ...expressForm, message: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpressModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInterest}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  {submittingInterest ? "Submitting..." : "Send Proposal & Enter Pipeline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stage Transition Modal */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-indigo-950 text-white p-5 sm:p-6 relative">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="absolute top-5 right-5 text-gray-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  <Briefcase className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-amber-200">
                  Investor Deal Flow Management
                </span>
              </div>
              <h3 className="text-xl font-bold">
                {activeModal.startup?.companyName || "Target Venture"}
              </h3>
              <p className="text-xs text-amber-100/90 mt-0.5">
                {activeModal.startup?.industry} • {activeModal.startup?.city || "Philippines"}
              </p>
            </div>

            <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs sm:text-sm">
              <div className="space-y-1.5">
                <label className="font-bold text-gray-800 block">
                  Move Deal in Your Pipeline:
                </label>
                <select
                  value={newStageInput}
                  onChange={(e) => setNewStageInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl font-bold text-xs sm:text-sm text-gray-900 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                >
                  {PIPELINE_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} ({s.desc})
                    </option>
                  ))}
                </select>
              </div>

              {/* Full Stage History & Audit Trail */}
              {activeModal.notes && (
                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <label className="font-bold text-gray-700 block text-xs">
                    Stage Progress & Activity History:
                  </label>
                  <StageHistoryBullets rawNotes={activeModal.notes} defaultExpanded={true} theme="amber" />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-gray-800 block">
                  Add New Update / Diligence Notes:
                </label>
                <textarea
                  rows={3}
                  placeholder="Record your findings, term requirements, meeting highlights, and diligence status..."
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>

              {activeModal.startup?.contactEmail && (
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500">Founder Email:</span>
                  <a
                    href={`mailto:${activeModal.startup.contactEmail}`}
                    className="font-bold text-blue-600 hover:underline"
                  >
                    {activeModal.startup.contactEmail}
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  handleUpdateStage(activeModal.id, newStageInput, notesInput)
                }
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
              >
                {saving ? "Updating..." : "Save Pipeline Status"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
