import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getBackendUrl, getAuthHeaders } from "../config/apiConfig";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Building2,
  TrendingUp,
  Filter,
  Search,
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
  ArrowRight,
  XCircle,
  ChevronRight,
  ChevronLeft,
  FileText,
  DollarSign,
} from "lucide-react";
import StageHistoryBullets from "./StageHistoryBullets";

export const PIPELINE_STAGES = [
  {
    id: "NEW_INQUIRY",
    label: "New Inquiries",
    desc: "Fresh expressions of interest received from investors",
    color: "blue",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    headerBg: "bg-blue-500",
  },
  {
    id: "INITIAL_REVIEW",
    label: "Initial Screening",
    desc: "Pitch deck, team review & eligibility screening",
    color: "purple",
    badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
    headerBg: "bg-purple-500",
  },
  {
    id: "PITCH_MEETING",
    label: "Pitch & Discussion",
    desc: "Founder meetings, Q&A, and demo calls",
    color: "amber",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    headerBg: "bg-amber-500",
  },
  {
    id: "DUE_DILIGENCE",
    label: "Due Diligence",
    desc: "Financial audit, legal checks, and technical diligence",
    color: "indigo",
    badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    headerBg: "bg-indigo-500",
  },
  {
    id: "TERM_SHEET",
    label: "Term Sheet & Negotiation",
    desc: "Valuation, cap table, and term negotiation",
    color: "teal",
    badgeBg: "bg-teal-50 text-teal-700 border-teal-200",
    headerBg: "bg-teal-500",
  },
  {
    id: "CLOSED_DEAL",
    label: "Closed / Funded",
    desc: "Investment round committed, contract executed",
    color: "emerald",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    headerBg: "bg-emerald-600",
  },
  {
    id: "PASSED",
    label: "Passed / Archived",
    desc: "Inquiries not pursued or archived",
    color: "gray",
    badgeBg: "bg-gray-100 text-gray-700 border-gray-200",
    headerBg: "bg-gray-400",
  },
];

export default function InvestmentInquiriesPage() {
  const navigate = useNavigate();

  const [inquiries, setInquiries] = useState([]);
  const [userStartups, setUserStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("kanban"); // "kanban" or "table"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStartupFilter, setSelectedStartupFilter] = useState("all");
  const [selectedStageFilter, setSelectedStageFilter] = useState("all");

  // Detail / stage modal
  const [activeDealModal, setActiveDealModal] = useState(null);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [newStageInput, setNewStageInput] = useState("");
  const [notesInput, setNotesInput] = useState("");

  // Log Inbound Inquiry modal
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [logForm, setLogForm] = useState({
    startupId: "",
    investorName: "",
    investorEmail: "",
    investorPhone: "",
    investorType: "Angel Investor / Private Equity",
    amountRange: "₱500,000",
    processType: "Seed Stage Capital",
    stage: "NEW_INQUIRY",
    message: "",
    notes: "",
  });

  // Fetch inquiries and user's owned startups
  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const [inqRes, stRes] = await Promise.all([
        fetch(`${getBackendUrl()}/api/investments/received`, {
          headers: getAuthHeaders(),
          credentials: "include",
        }),
        fetch(`${getBackendUrl()}/startups/my-startups`, {
          headers: getAuthHeaders(),
          credentials: "include",
        }),
      ]);

      if (inqRes.ok) {
        const json = await inqRes.json();
        const data = json.data || [];
        setInquiries(data);
      }

      if (stRes.ok) {
        const startupsData = await stRes.json();
        const list = Array.isArray(startupsData) ? startupsData : startupsData.content || [];
        setUserStartups(list);
        const eligible = list.filter((s) => {
          const status = s.status?.trim() || "";
          const isApproved = status.toLowerCase() === "approved" || status.toLowerCase() === "accepted";
          const isRejected = status.toLowerCase() === "rejected";
          const isVerified = Boolean(s.emailVerified);
          return isApproved && isVerified && !isRejected;
        });
        if (eligible.length > 0 && !logForm.startupId) {
          setLogForm((prev) => ({ ...prev, startupId: eligible[0].id }));
        }
      }
    } catch (err) {
      console.warn("Could not fetch inquiries from backend:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  // Update deal stage
  const handleUpdateStage = async (dealId, nextStage, nextNotes) => {
    setUpdatingStage(true);
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
        throw new Error("Failed to update deal stage on server");
      }

      const resData = await response.json();
      const updatedDeal = resData.data;

      // Update state locally
      setInquiries((prev) =>
        prev.map((item) =>
          item.id === dealId
            ? { ...item, stage: nextStage, notes: nextNotes !== undefined ? nextNotes : item.notes }
            : item
        )
      );

      const stageLabel = PIPELINE_STAGES.find((s) => s.id === nextStage)?.label || nextStage;
      toast.success(`Deal moved to stage: ${stageLabel}`);

      if (activeDealModal && activeDealModal.id === dealId) {
        setActiveDealModal((prev) => ({
          ...prev,
          stage: nextStage,
          notes: nextNotes !== undefined ? nextNotes : prev.notes,
        }));
      }
    } catch (err) {
      console.error("Error updating deal stage:", err);
      toast.error(err.message || "Failed to update deal stage");
    } finally {
      setUpdatingStage(false);
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

  // Submit real inbound inquiry
  const handleCreateInquirySubmit = async (e) => {
    e.preventDefault();
    if (!logForm.investorName.trim()) {
      toast.error("Please enter the investor or organization name");
      return;
    }

    const targetSt = userStartups.find((s) => String(s.id) === String(logForm.startupId));
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

    setSubmittingInquiry(true);
    try {
      const response = await fetch(`${getBackendUrl()}/api/investments/create`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(logForm),
        credentials: "include",
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to log investment inquiry");
      }

      const resJson = await response.json();
      const created = resJson.data;

      setInquiries((prev) => [created, ...prev]);
      toast.success("Investment inquiry logged successfully and entered into Deal Flow!");
      setIsLogModalOpen(false);

      // Reset form
      setLogForm((prev) => ({
        ...prev,
        investorName: "",
        investorEmail: "",
        investorPhone: "",
        message: "",
        notes: "",
      }));
    } catch (err) {
      console.error("Error creating inquiry:", err);
      toast.error(err.message || "Could not log investment inquiry. Please try again.");
    } finally {
      setSubmittingInquiry(false);
    }
  };

  // Only verified, accepted and non-rejected startups can receive investments
  const eligibleUserStartups = useMemo(() => {
    return userStartups.filter((s) => {
      const status = s.status?.trim() || "";
      const isApproved = status.toLowerCase() === "approved" || status.toLowerCase() === "accepted";
      const isRejected = status.toLowerCase() === "rejected";
      const isVerified = Boolean(s.emailVerified);
      return isApproved && isVerified && !isRejected;
    });
  }, [userStartups]);

  // Extract unique startups for filter
  const uniqueStartups = useMemo(() => {
    const map = new Map();
    inquiries.forEach((item) => {
      if (item.startup && item.startup.id) {
        map.set(item.startup.id, item.startup.companyName || `Startup #${item.startup.id}`);
      }
    });
    userStartups.forEach((st) => {
      if (st.id && !map.has(st.id)) {
        map.set(st.id, st.companyName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [inquiries, userStartups]);

  // Only verified, accepted and non-rejected startups are eligible to receive investments
  const isEligibleStartup = (s) => {
    if (!s) return false;
    const status = s.status?.trim() || "";
    const isApproved = status.toLowerCase() === "approved" || status.toLowerCase() === "accepted";
    const isRejected = status.toLowerCase() === "rejected";
    const isVerified = Boolean(s.emailVerified);
    return isApproved && isVerified && !isRejected;
  };

  // Filter & de-duplicate inquiries (1 authentic card per startup based on chosen investment focus)
  const filteredInquiries = useMemo(() => {
    const uniqueMap = new Map();
    for (const item of inquiries) {
      if (!item || !item.startup || !item.startup.id || !isEligibleStartup(item.startup)) continue;
      const key = `${item.startup.id}-${item.investorEmail || item.investorName || "inv"}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      } else {
        const existing = uniqueMap.get(key);
        const isGeneric = (f) => !f || f === "Direct Investment" || f === "Flexible / Discussion";
        if (isGeneric(existing.processType) && !isGeneric(item.processType)) {
          uniqueMap.set(key, item);
        } else if (existing.id && item.id && item.id > existing.id && !isGeneric(item.processType)) {
          uniqueMap.set(key, item);
        }
      }
    }

    const uniqueList = Array.from(uniqueMap.values());

    return uniqueList.filter((item) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        (item.investorName && item.investorName.toLowerCase().includes(searchLower)) ||
        (item.investorType && item.investorType.toLowerCase().includes(searchLower)) ||
        (item.startup?.companyName && item.startup.companyName.toLowerCase().includes(searchLower)) ||
        (item.message && item.message.toLowerCase().includes(searchLower)) ||
        (item.notes && item.notes.toLowerCase().includes(searchLower));

      const matchesStartup =
        selectedStartupFilter === "all" ||
        String(item.startup?.id) === String(selectedStartupFilter);

      const matchesStage =
        selectedStageFilter === "all" ||
        item.stage === selectedStageFilter;

      return matchesSearch && matchesStartup && matchesStage;
    });
  }, [inquiries, searchQuery, selectedStartupFilter, selectedStageFilter]);

  // Metric computations based on unique deals
  const uniqueAllInquiries = useMemo(() => {
    const uniqueMap = new Map();
    for (const item of inquiries) {
      if (!item || !item.startup || !item.startup.id || !isEligibleStartup(item.startup)) continue;
      const key = `${item.startup.id}-${item.investorEmail || item.investorName || "inv"}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      } else {
        const existing = uniqueMap.get(key);
        const isGeneric = (f) => !f || f === "Direct Investment" || f === "Flexible / Discussion";
        if (isGeneric(existing.processType) && !isGeneric(item.processType)) {
          uniqueMap.set(key, item);
        }
      }
    }
    return Array.from(uniqueMap.values());
  }, [inquiries]);

  const totalInquiriesCount = uniqueAllInquiries.length;
  const activeDealsCount = uniqueAllInquiries.filter(
    (i) => i.stage !== "CLOSED_DEAL" && i.stage !== "PASSED"
  ).length;
  const closedDealsCount = uniqueAllInquiries.filter((i) => i.stage === "CLOSED_DEAL" && isEligibleStartup(i.startup)).length;

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                onClick={() => navigate("/startup-dashboard")}
                className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer shrink-0"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                  <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight truncate">
                    Deal Flow & Pipeline Management
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                  Manage investment inquiries received from investors, VCs, and angels for your startups
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Switcher */}
              <div className="hidden sm:flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === "kanban"
                    ? "bg-white text-emerald-800 shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  <Kanban className="w-3.5 h-3.5" />
                  Pipeline View
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === "table"
                    ? "bg-white text-emerald-800 shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  <List className="w-3.5 h-3.5" />
                  List View
                </button>
              </div>

              <button
                onClick={fetchInquiries}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                title="Refresh Deals"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>

              {/* Functional Add Inbound Inquiry Button */}
              <button
                onClick={() => setIsLogModalOpen(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Log Inbound Inquiry</span>
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
              <span className="text-xs font-bold uppercase tracking-wider">Total Inquiries</span>
              <Mail className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-gray-900 mt-2">{totalInquiriesCount}</p>
            <span className="text-[11px] text-gray-400 mt-1">All incoming investor inquiries</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200/90 shadow-2xs flex flex-col justify-between bg-emerald-50/20">
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-xs font-bold uppercase tracking-wider">Active Deal Flow</span>
              <Clock className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700 mt-2">{activeDealsCount}</p>
            <span className="text-[11px] text-emerald-600 font-medium mt-1">
              Screening, meetings & due diligence
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Closed / Funded</span>
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-2xl font-black text-teal-700 mt-2">{closedDealsCount}</p>
            <span className="text-[11px] text-gray-400 mt-1">Successful deal completions</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Ventures In Pipeline</span>
              <Building2 className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-black text-gray-900 mt-2">{uniqueStartups.length}</p>
            <span className="text-[11px] text-gray-400 mt-1">Your startups with interest</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by investor name, type, startup, or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Startup filter dropdown */}
            {uniqueStartups.length > 1 && (
              <select
                value={selectedStartupFilter}
                onChange={(e) => setSelectedStartupFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="all">All Startups ({uniqueStartups.length})</option>
                {uniqueStartups.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}

            {/* Stage filter dropdown */}
            <select
              value={selectedStageFilter}
              onChange={(e) => setSelectedStageFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="all">All Pipeline Stages</option>
              {PIPELINE_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Mode: Kanban / Pipeline Board */}
        {viewMode === "kanban" ? (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-[1300px]">
              {PIPELINE_STAGES.map((stage, stageIdx) => {
                const stageDeals = filteredInquiries.filter(
                  (i) => (i.stage || "NEW_INQUIRY") === stage.id
                );

                return (
                  <div
                    key={stage.id}
                    className="flex-1 bg-slate-100/70 border border-slate-200/90 rounded-2xl p-3 flex flex-col min-w-[210px] max-h-[750px] shadow-2xs"
                  >
                    {/* Column Header */}
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

                    {/* Column Cards */}
                    <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
                      {stageDeals.length === 0 ? (
                        <div className="py-10 text-center text-gray-400">
                          <p className="text-[11px] font-medium">No deals in this stage</p>
                        </div>
                      ) : (
                        stageDeals.map((deal) => (
                          <div
                            key={deal.id}
                            className="bg-white p-3.5 rounded-xl border border-gray-200/90 hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer group"
                          >
                            <div
                              onClick={() => {
                                setActiveDealModal(deal);
                                setNewStageInput(deal.stage || "NEW_INQUIRY");
                                setNotesInput("");
                              }}
                            >
                              <div className="flex items-start justify-between gap-1 mb-1.5">
                                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100 flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  <span className="truncate max-w-[120px]">
                                    {deal.startup?.companyName || "Your Startup"}
                                  </span>
                                </span>
                                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                  {deal.createdAt
                                    ? new Date(deal.createdAt).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })
                                    : "Recent"}
                                </span>
                              </div>

                              <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                                {deal.investorName}
                              </p>
                              <span className="text-[10.5px] text-gray-500 block truncate">
                                {deal.investorType || "Investor"}
                              </span>

                              {deal.amountRange && (
                                <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                                  <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                    {deal.amountRange}
                                  </span>
                                  <span className="text-[10px] text-gray-400 truncate max-w-[90px]">
                                    {deal.processType || "Inquiry"}
                                  </span>
                                </div>
                              )}

                              <StageHistoryBullets rawNotes={deal.notes} theme="emerald" />
                            </div>

                            {/* Quick Pipeline Stage Action Controls */}
                            <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between gap-1">
                              {stageIdx > 0 ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickAdvanceStage(deal, -1);
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded text-[10px] flex items-center gap-0.5 cursor-pointer"
                                  title="Move to previous stage"
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
                                  className="px-2 py-1 text-emerald-700 hover:bg-emerald-50 rounded text-[10.5px] font-bold flex items-center gap-0.5 cursor-pointer border border-emerald-200/70"
                                  title="Advance to next pipeline stage"
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
        ) : (
          /* Table View */
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/90 border-b border-gray-200 text-gray-600 font-semibold uppercase text-[10.5px] tracking-wider">
                    <th className="py-3.5 px-4">Investor / Firm</th>
                    <th className="py-3.5 px-4">Target Startup</th>
                    <th className="py-3.5 px-3">Proposed Capital</th>
                    <th className="py-3.5 px-3">Pipeline Stage</th>
                    <th className="py-3.5 px-3">Date Received</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInquiries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        <TrendingUp className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="font-semibold text-gray-600">No investment inquiries found</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Click "Log Inbound Inquiry" to record any investor meetings, calls, or term sheets.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredInquiries.map((deal) => {
                      const stageMeta =
                        PIPELINE_STAGES.find((s) => s.id === deal.stage) || PIPELINE_STAGES[0];

                      return (
                        <tr
                          key={deal.id}
                          className="hover:bg-slate-50/60 transition-colors duration-150"
                        >
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-gray-900">{deal.investorName}</p>
                            <span className="text-[11px] text-gray-500">{deal.investorType}</span>
                            <div className="flex items-center gap-2 mt-0.5 text-[10.5px] text-gray-400">
                              {deal.investorEmail && (
                                <span className="flex items-center gap-0.5">
                                  <Mail className="w-3 h-3" />
                                  {deal.investorEmail}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 flex items-center gap-1.5 w-fit">
                              <Building2 className="w-3 h-3 text-emerald-600" />
                              {deal.startup?.companyName || "Your Startup"}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 font-bold text-gray-900">
                            {deal.amountRange || "Undisclosed"}
                          </td>

                          <td className="py-3.5 px-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold border inline-flex items-center gap-1 ${stageMeta.badgeBg}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${stageMeta.headerBg}`}
                              />
                              {stageMeta.label}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-gray-500 whitespace-nowrap">
                            {deal.createdAt
                              ? new Date(deal.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                              : "Recent"}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setActiveDealModal(deal);
                                setNewStageInput(deal.stage || "NEW_INQUIRY");
                                setNotesInput("");
                              }}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 font-bold rounded-lg border border-gray-200 text-xs transition-colors cursor-pointer"
                            >
                              View / Update Deal
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Log Inbound Inquiry */}
      {isLogModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-indigo-950 text-white p-5 sm:p-6 relative">
              <button
                type="button"
                onClick={() => setIsLogModalOpen(false)}
                className="absolute top-5 right-5 text-gray-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <Plus className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-emerald-200">
                  Log Real Inbound Investor Inquiry
                </span>
              </div>
              <h3 className="text-xl font-bold">Record Investment Deal</h3>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Record investor discussions from email, events, or pitches directly into your Deal Flow
              </p>
            </div>

            <form onSubmit={handleCreateInquirySubmit} className="p-5 sm:p-6 space-y-3.5 text-xs">
              {/* Target Startup */}
              {eligibleUserStartups.length > 0 ? (
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Target Startup * (Verified & Accepted Only)</label>
                  <select
                    value={logForm.startupId}
                    onChange={(e) => setLogForm({ ...logForm, startupId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500/30"
                    required
                  >
                    {eligibleUserStartups.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.companyName} - Verified & Approved
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                  <p className="font-semibold text-red-900">Ineligible to Receive Investments</p>
                  <p className="mt-0.5">Your startup must be verified and approved by the administrator before inquiries and investments can be logged.</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Investor / Firm Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kickstart Ventures, Angel Investor"
                    value={logForm.investorName}
                    onChange={(e) => setLogForm({ ...logForm, investorName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Investor Type</label>
                  <select
                    value={logForm.investorType}
                    onChange={(e) => setLogForm({ ...logForm, investorType: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-emerald-500/30"
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
                  <label className="font-bold text-gray-700 block mb-1">Contact Email</label>
                  <input
                    type="email"
                    placeholder="investor@firm.ph"
                    value={logForm.investorEmail}
                    onChange={(e) => setLogForm({ ...logForm, investorEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+63 9..."
                    value={logForm.investorPhone}
                    onChange={(e) => setLogForm({ ...logForm, investorPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Proposed Ticket Size</label>
                  <input
                    type="text"
                    placeholder="e.g. ₱500,000, ₱1,000,000+"
                    value={logForm.amountRange}
                    onChange={(e) => setLogForm({ ...logForm, amountRange: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Investment Focus *</label>
                  <select
                    value={logForm.processType}
                    onChange={(e) => setLogForm({ ...logForm, processType: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 font-semibold focus:ring-2 focus:ring-emerald-500/30"
                  >
                    <option value="Direct Equity / Seed Round">Direct Equity / Seed Round</option>
                    <option value="Pre-Seed Angel Capital">Pre-Seed Angel Capital</option>
                    <option value="Series A Growth Funding">Series A Growth Funding</option>
                    <option value="SAFE / Convertible Note">SAFE / Convertible Note</option>
                    <option value="Strategic Partnership & Synergies">Strategic Partnership & Synergies</option>
                    <option value="Revenue-Share / Debt Financing">Revenue-Share / Debt Financing</option>
                    <option value="General Investment Discussion & Inquiry">General Investment Discussion & Inquiry</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Initial Pipeline Stage</label>
                <select
                  value={logForm.stage}
                  onChange={(e) => setLogForm({ ...logForm, stage: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 font-semibold focus:ring-2 focus:ring-emerald-500/30"
                >
                  {PIPELINE_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Discussion Summary / Message</label>
                <textarea
                  rows={2}
                  placeholder="Details of the investor's interest, market thesis, or pitch feedback..."
                  value={logForm.message}
                  onChange={(e) => setLogForm({ ...logForm, message: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Follow-up Notes / Checklist</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Need to email updated financial model and cap table by Friday..."
                  value={logForm.notes}
                  onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInquiry}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  {submittingInquiry ? "Saving Deal..." : "Log Deal into Pipeline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deal Details & Stage Transition Modal */}
      {activeDealModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-indigo-950 text-white p-5 sm:p-6 relative">
              <button
                type="button"
                onClick={() => setActiveDealModal(null)}
                className="absolute top-5 right-5 text-gray-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-emerald-200">
                  Deal Flow & Pipeline Management
                </span>
              </div>
              <h3 className="text-xl font-bold">{activeDealModal.investorName}</h3>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Target Startup: {activeDealModal.startup?.companyName || "Your Startup"}
              </p>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs sm:text-sm">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-gray-500 uppercase block">
                      Investor Type
                    </span>
                    <p className="font-semibold text-gray-900">{activeDealModal.investorType}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-gray-500 uppercase block">
                      Proposed Amount
                    </span>
                    <p className="font-bold text-emerald-700">
                      {activeDealModal.amountRange || "Undisclosed"}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-gray-500 uppercase block">
                      Email Contact
                    </span>
                    <a
                      href={`mailto:${activeDealModal.investorEmail}`}
                      className="font-medium text-blue-600 hover:underline truncate block"
                    >
                      {activeDealModal.investorEmail || "N/A"}
                    </a>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-gray-500 uppercase block">
                      Phone
                    </span>
                    <p className="font-medium text-gray-800">
                      {activeDealModal.investorPhone || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {activeDealModal.message && (
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Investor's Expression / Message:
                  </label>
                  <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl text-gray-800 leading-relaxed text-xs">
                    "{activeDealModal.message}"
                  </div>
                </div>
              )}

              {/* Deal Flow Stage Selector */}
              <div className="space-y-1.5 pt-2">
                <label className="font-bold text-gray-800 block">
                  Move Deal Stage:
                </label>
                <select
                  value={newStageInput}
                  onChange={(e) => setNewStageInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl font-bold text-xs sm:text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                >
                  {PIPELINE_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} ({s.desc})
                    </option>
                  ))}
                </select>
              </div>

              {/* Full Stage History & Audit Trail in Bullet Form with Expand Icon */}
              {activeDealModal.notes && (
                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <label className="font-bold text-gray-700 block text-xs">
                    Stage Progress & Activity History:
                  </label>
                  <StageHistoryBullets rawNotes={activeDealModal.notes} defaultExpanded={true} theme="emerald" />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-800 block">
                  Add New Internal Note / Update:
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g., Scheduled introductory pitch meeting for Thursday 2 PM. Shared data room."
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveDealModal(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                disabled={updatingStage}
                onClick={() =>
                  handleUpdateStage(activeDealModal.id, newStageInput, notesInput)
                }
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {updatingStage ? "Saving..." : "Save Pipeline Stage"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
