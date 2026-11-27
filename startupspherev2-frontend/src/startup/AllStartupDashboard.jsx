import { getBackendUrl, getAuthHeaders } from "../config/apiConfig";
import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Search,
  Filter,
  MapPin,
  TrendingUp,
  DollarSign,
  Users,
  Award,
  FileText,
  Download,
  Calendar,
  Zap,
  BarChart2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Layers,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Trash2,
  Eye,
  X,
  Trophy,
  Crown,
} from "lucide-react";
import TooltipInfo from "../components/TooltipInfo";
import ChartExportButton from "../components/ChartExportButton";
import ExportReportModal from "../modals/ExportReportModal";
import { exportSpecificReportPdf } from "../utils/chartExportUtils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useLocation } from "react-router-dom";
import StartupReviewSection from "./StartupReviewSelection";
import { useSidebar } from "../context/SidebarContext";
import loginLogo from "/StartUpSphere_loginLogo.png";

export default function AllStartupDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { closeSidebar } = useSidebar();
  const [activeTab, setActiveTab] = useState(
    location.state?.activeTab || "rankings"
  );
  const [selectedIndustry, setSelectedIndustry] = useState("All");
  const [rankingMetric, setRankingMetric] = useState("overall");
  const [selectedGovReg, setSelectedGovReg] = useState("All");
  const [selectedTrlStage, setSelectedTrlStage] = useState("All");
  const isFiltered =
    selectedIndustry !== "All" ||
    selectedGovReg !== "All" ||
    selectedTrlStage !== "All";
  const [currentPage, setCurrentPage] = useState(0); // Changed to 0-based for API
  const itemsPerPage = 10;
  const [totalPagesState, setTotalPagesState] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [overviewPage, setOverviewPage] = useState(0);
  const [activePage, setActivePage] = useState(0);
  const [archivePage, setArchivePage] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedReviewStartupId, setSelectedReviewStartupId] = useState(
    location.state?.reviewStartupId || null
  );

  const [topStartups, setTopStartups] = useState([]);
  const [topStartupsLoading, setTopStartupsLoading] = useState(false);
  const [topStartupsError, setTopStartupsError] = useState(null);
  const [rankedStartups, setRankedStartups] = useState([]);
  const [totalStartups, setTotalStartups] = useState(0);
  const [loading, setLoading] = useState(true);
  const [industries, setIndustries] = useState([]);
  const [industryData, setIndustryData] = useState([]);
  const [ecosystemTotalFunding, setEcosystemTotalFunding] = useState(0);
  const [ecosystemAllBusinesses, setEcosystemAllBusinesses] = useState([]);

  // Cache for startup locations to avoid repeated fetching
  const [startupLocationsCache, setStartupLocationsCache] = useState(null);
  const [industriesCache, setIndustriesCache] = useState(null);
  const [topStartupsCache, setTopStartupsCache] = useState(null);

  // New state for dashboard analytics data
  const [growthData, setGrowthData] = useState([]);
  const [fundingData, setFundingData] = useState([]);
  const [locationData, setLocationData] = useState([]);
  const [monthlyGrowthData, setMonthlyGrowthData] = useState([]);
  const [selectedTrlModal, setSelectedTrlModal] = useState(null);
  const [activeSearch, setActiveSearch] = useState("");
  const [archiveSearch, setArchiveSearch] = useState("");

  // Logged-in user's own startups for prominent leaderboard ranking
  const [myStartups, setMyStartups] = useState([]);
  const [myStartupsLoading, setMyStartupsLoading] = useState(false);

  useEffect(() => {
    const fetchMyStartups = async () => {
      try {
        setMyStartupsLoading(true);
        const res = await fetch(`${getBackendUrl()}/startups/my-startups/details`, {
          headers: getAuthHeaders(),
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setMyStartups(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load user startups for ranking:", err);
      } finally {
        setMyStartupsLoading(false);
      }
    };
    fetchMyStartups();
  }, [refreshTrigger]);

  useEffect(() => {
    setOverviewPage(0);
  }, [selectedIndustry]);

  useEffect(() => {
    setActivePage(0);
  }, [activeSearch]);

  useEffect(() => {
    setArchivePage(0);
  }, [archiveSearch]);
  const [inactivityActionLoading, setInactivityActionLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [geoViewMode, setGeoViewMode] = useState("bar"); // "bar" | "donut"
  const [geoShowAll, setGeoShowAll] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const GEO_PALETTE = useMemo(
    () => [
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
      "#ec4899",
      "#06b6d4",
      "#f97316",
      "#6366f1",
      "#14b8a6",
      "#84cc16",
    ],
    []
  );

  const sortedLocationData = useMemo(() => {
    if (!locationData || !Array.isArray(locationData)) return [];
    return [...locationData]
      .filter((item) => item && item.name && (item.value || 0) > 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));
  }, [locationData]);

  const totalGeoStartups = useMemo(() => {
    return sortedLocationData.reduce((sum, item) => sum + (item.value || 0), 0);
  }, [sortedLocationData]);

  const barChartLocationData = useMemo(() => {
    if (geoShowAll || sortedLocationData.length <= 8) {
      return sortedLocationData;
    }
    const top7 = sortedLocationData.slice(0, 7);
    const otherSum = sortedLocationData.slice(7).reduce((acc, c) => acc + (c.value || 0), 0);
    return [
      ...top7,
      { name: `Others (${sortedLocationData.length - 7})`, value: otherSum, isOther: true },
    ];
  }, [sortedLocationData, geoShowAll]);

  const [govComplianceData, setGovComplianceData] = useState([]);
  const [trlStagesData, setTrlStagesData] = useState([]);
  const [industryScoresData, setIndustryScoresData] = useState([]);

  const donutLocationData = useMemo(() => {
    if (sortedLocationData.length <= 5) {
      return sortedLocationData;
    }
    const top4 = sortedLocationData.slice(0, 4);
    const otherSum = sortedLocationData.slice(4).reduce((acc, c) => acc + (c.value || 0), 0);
    return [
      ...top4,
      { name: `Other Cities (${sortedLocationData.length - 4})`, value: otherSum, isOther: true },
    ];
  }, [sortedLocationData]);

  const computedIndustryScores = useMemo(() => {
    if (industryScoresData && industryScoresData.length > 0) {
      return industryScoresData;
    }
    const sourceList = (ecosystemAllBusinesses && ecosystemAllBusinesses.length > 0)
      ? ecosystemAllBusinesses
      : ((topStartups && topStartups.length > 0) ? topStartups : rankedStartups);
    if (!sourceList || sourceList.length === 0) return [];

    const uniqueInds = [...new Set(sourceList.map((s) => s.industry).filter(Boolean))];
    return uniqueInds
      .map((ind, index) => {
        const matched = sourceList.filter((s) => s.industry === ind);
        const avgOverall =
          matched.reduce((sum, s) => sum + (Number(s.overallScore) || 0), 0) /
          matched.length;
        const avgGrowth =
          matched.reduce((sum, s) => {
            if (s.growthScore !== undefined && s.growthScore !== null && Number(s.growthScore) > 0) {
              return sum + Number(s.growthScore);
            }
            const trlMatch = String(s.trlLevel || "").match(/\d+/);
            const trlLvl = trlMatch ? parseInt(trlMatch[0], 10) : 1;
            return sum + Math.round((Math.max(trlLvl, 1) / 9) * 100);
          }, 0) / matched.length;
        const avgEco =
          matched.reduce((sum, s) => sum + (Number(s.ecosystemScore) || 0), 0) /
          matched.length;
        return {
          name: ind,
          industry: ind,
          score: Math.round(avgOverall),
          overallScore: Math.round(avgOverall),
          growthScore: Math.round(avgGrowth),
          ecosystemScore: Math.round(avgEco),
          count: matched.length,
          color: GEO_PALETTE[index % GEO_PALETTE.length],
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [industryScoresData, ecosystemAllBusinesses, topStartups, rankedStartups, GEO_PALETTE]);

  const computedGovCompliance = useMemo(() => {
    if (govComplianceData && govComplianceData.length > 0) {
      return govComplianceData;
    }
    const sourceList = (topStartups && topStartups.length > 0) ? topStartups : rankedStartups;
    const registered = sourceList.filter(
      (s) =>
        Boolean(s.isGovernmentRegistered) ||
        (s.registrationAgency && !["Unregistered", ""].includes(s.registrationAgency))
    ).length;
    const sec = sourceList.filter(
      (s) => String(s.registrationAgency || "").toUpperCase() === "SEC"
    ).length;
    const dti = sourceList.filter(
      (s) => String(s.registrationAgency || "").toUpperCase() === "DTI"
    ).length;
    const bir = sourceList.filter((s) =>
      String(s.registrationAgency || "").toUpperCase().includes("BIR")
    ).length;
    const otherAgc = sourceList.filter(
      (s) =>
        s.registrationAgency &&
        !["BIR", "SEC", "DTI", "UNREGISTERED"].includes(
          String(s.registrationAgency).toUpperCase()
        )
    ).length;
    const unregistered = sourceList.filter(
      (s) =>
        !s.isGovernmentRegistered &&
        (!s.registrationAgency ||
          String(s.registrationAgency).toUpperCase() === "UNREGISTERED")
    ).length;

    return [
      { name: "Gov. Registered", count: registered, fill: "#10b981" },
      { name: "SEC (Corp)", count: sec, fill: "#3b82f6" },
      { name: "DTI (Trade)", count: dti, fill: "#6366f1" },
      { name: "BIR (Certified)", count: bir, fill: "#8b5cf6" },
      { name: "Other Agc.", count: otherAgc, fill: "#ec4899" },
      { name: "Unregistered", count: unregistered, fill: "#f59e0b" },
    ];
  }, [govComplianceData, topStartups, rankedStartups]);

  const computedTrlStages = useMemo(() => {
    const sourceList = (topStartups && topStartups.length > 0) ? topStartups : rankedStartups;

    if (trlStagesData && trlStagesData.length > 0) {
      return trlStagesData.map((s) => {
        const lvl = s.level;
        const fill = lvl <= 3 ? "#10b981" : lvl <= 6 ? "#eab308" : "#ef4444";
        const detailedList = (s.startupList && s.startupList.length > 0)
          ? s.startupList
          : sourceList.filter((item) => {
            const num = parseInt(String(item.trlLevel || "").match(/\d+/)?.[0] || "0", 10);
            return num === lvl;
          });
        return {
          ...s,
          stage: `TRL ${lvl}`,
          level: lvl,
          startups: s.count ?? detailedList.length,
          count: s.count ?? detailedList.length,
          startupList: detailedList,
          fill: fill,
        };
      });
    }

    return Array.from({ length: 9 }, (_, i) => {
      const lvl = i + 1;
      const matched = sourceList.filter((s) => {
        const num = parseInt(String(s.trlLevel || "").match(/\d+/)?.[0] || "0", 10);
        return num === lvl;
      });
      const fill = lvl <= 3 ? "#10b981" : lvl <= 6 ? "#eab308" : "#ef4444";
      return {
        stage: `TRL ${lvl}`,
        level: lvl,
        startups: matched.length,
        count: matched.length,
        startupList: matched,
        fill: fill,
      };
    });
  }, [trlStagesData, topStartups, rankedStartups]);

  // New state for chart filtering and interaction
  const [selectedChartIndustry, setSelectedChartIndustry] = useState(null);
  const [selectedFundingStage, setSelectedFundingStage] = useState(null);
  const [hoveredIndustry, setHoveredIndustry] = useState(null);
  const [hoveredFundingStage, setHoveredFundingStage] = useState(null);

  // States for Admin Reports tab
  const [generatedReports, setGeneratedReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportFormData, setReportFormData] = useState({
    industry: "All Industries",
    region: "All Regions",
    timePeriod: "2025 (YTD)",
    metrics: [
      "Growth Rate",
      "Funding Amount",
      "Survival Rate",
      "Employment Data",
      "Investment Rounds",
      "Foreign Investment",
      "Government Support",
      "Mentorship Data",
      "Public-Private Partnerships",
    ],
  });

  // State for Review tab filters
  const [reviewSelectedRegion, setReviewSelectedRegion] = useState("All Regions");
  const [availableRegions, setAvailableRegions] = useState([]);

  // Add these new state variables at the top of your component with other state declarations
  const [psgcRegions, setPsgcRegions] = useState([]);
  const [psgcLoading, setPsgcLoading] = useState(false);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  const [role, setRole] = useState(null);
  const [deleteConfirmStartup, setDeleteConfirmStartup] = useState(null);
  const [isDeletingStartup, setIsDeletingStartup] = useState(false);

  const handleConfirmDeleteStartup = async () => {
    if (!deleteConfirmStartup) return;
    setIsDeletingStartup(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${getBackendUrl()}/startups/${deleteConfirmStartup.id}`, {
        method: "DELETE",
        headers,
        credentials: "include",
      });

      if (!res.ok && res.status !== 204) {
        throw new Error(`Failed to delete startup (${res.status})`);
      }

      toast.success(`"${deleteConfirmStartup.companyName}" deleted successfully`);
      setRankedStartups((prev) => prev.filter((s) => s.id !== deleteConfirmStartup.id));
      setTopStartups((prev) => prev.filter((s) => s.id !== deleteConfirmStartup.id));
      setTotalStartups((prev) => Math.max(0, prev - 1));
      setDeleteConfirmStartup(null);
    } catch (err) {
      console.error("Error deleting startup:", err);
      toast.error(err.message || "Failed to delete startup");
    } finally {
      setIsDeletingStartup(false);
    }
  };

  const fetchRole = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${getBackendUrl()}/users/me/role`,
        {
          headers: headers,
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.text();
        console.log("Role:", data);
        setRole(data);
        if (data !== "ROLE_ADMIN") {
          setActiveTab("rankings");
        }
      } else {
        console.log("Error fetching role:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching role:", error);
    }
  };

  const refreshDashboard = () => {
    // Clear caches to force fresh data fetch
    setStartupLocationsCache(null);
    setIndustriesCache(null);
    setTopStartupsCache(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    const fetchDashboardAnalytics = async () => {
      setDashboardLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedIndustry !== "All") params.append("industry", selectedIndustry);
        if (selectedGovReg !== "All") params.append("govReg", selectedGovReg);
        if (selectedTrlStage !== "All") params.append("trl", selectedTrlStage);
        const queryStr = params.toString() ? `?${params.toString()}` : "";

        const response = await fetch(
          `${getBackendUrl()}/api/rankings/dashboard-analytics${queryStr}`,
          {
            headers: getAuthHeaders(),
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard analytics");
        }

        const data = await response.json();
        setGrowthData(data.growthData || []);
        setFundingData(data.fundingData || []);
        setLocationData(data.locationData || []);
        setGovComplianceData(data.govCompliance || []);
        setTrlStagesData(data.trlStages || []);
        setMonthlyGrowthData(data.monthlyGrowth || []);
        if (data.industryScores) {
          setIndustryScoresData(data.industryScores);
        }
        if (data.totalFunding !== undefined && data.totalFunding !== null) {
          setEcosystemTotalFunding(Number(data.totalFunding));
        }

        if (data.locationData && data.locationData.length) {
          const regions = data.locationData.map((item) => item.name);
          setAvailableRegions(regions);
        }

        setDashboardLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard analytics:", error);
        setDashboardLoading(false);
      }
    };

    fetchDashboardAnalytics();
  }, [selectedIndustry, selectedGovReg, selectedTrlStage, refreshTrigger]);

  // Fetch role only once on mount
  useEffect(() => {
    fetchRole();
  }, []);

  useEffect(() => {
    const fetchTopStartups = async () => {
      // Always fetch fresh data when filtering by a specific industry, govt reg, or TRL
      // Only use cache when viewing all
      const isFiltered = selectedIndustry !== "All" || selectedGovReg !== "All" || selectedTrlStage !== "All";

      if (!isFiltered && topStartupsCache &&
        topStartupsCache.industry === selectedIndustry &&
        topStartupsCache.govReg === selectedGovReg &&
        topStartupsCache.trl === selectedTrlStage &&
        topStartupsCache.metric === rankingMetric) {
        setTopStartups(topStartupsCache.data);
        setTopStartupsError(null);
        return;
      }

      setTopStartupsLoading(true);
      setTopStartups([]); // Clear old data while loading for visual feedback
      setTopStartupsError(null);

      try {
        const params = new URLSearchParams({
          page: "0",
          size: "1000",
          limit: "1000",
          metric: rankingMetric
        });

        if (selectedIndustry !== "All") {
          params.append("industry", selectedIndustry);
        }
        if (selectedGovReg !== "All") {
          params.append("govReg", selectedGovReg);
        }
        if (selectedTrlStage !== "All") {
          params.append("trl", selectedTrlStage);
        }

        // Use /api/rankings to fetch all startups matching the selected filters
        let response = await fetch(
          `${getBackendUrl()}/api/rankings?${params.toString()}`,
          {
            headers: getAuthHeaders(),
            credentials: "include",
          }
        );
        if (!response.ok) {
          // Fallback to /api/rankings/top if needed
          response = await fetch(
            `${getBackendUrl()}/api/rankings/top?${params.toString()}`,
            {
              headers: getAuthHeaders(),
              credentials: "include",
            }
          );
        }
        if (!response.ok) {
          throw new Error("Failed to fetch startups");
        }
        const data = await response.json();
        const startups = Array.isArray(data) ? data : (data.content || []);

        // Normalize startup data to ensure all score fields are properly set
        const normalizedStartups = startups.map(startup => {
          const overallScore = startup.overallScore ?? startup.score ?? 0;
          const growthRate = startup.growthScore ?? startup.growthRate ?? 0;

          return {
            ...startup,
            overallScore: Number(overallScore),
            growthScore: Number(growthRate),
            locationName: startup.locationName || startup.city || "Unknown"
          };
        });

        // Validate that we have startup data
        if (!normalizedStartups || normalizedStartups.length === 0) {
          console.warn("No startups returned from API for industry:", selectedIndustry);
        }

        setTopStartups(normalizedStartups);
        setTopStartupsError(null);

        // Derive industries breakdown & location cache directly from normalizedStartups (avoids extra network calls)
        if (!isFiltered && normalizedStartups.length > 0) {
          const uniqueIndustries = [
            ...new Set(normalizedStartups.map((s) => s.industry)),
          ].filter(Boolean);

          const industryBreakdown = uniqueIndustries.map((ind, idx) => {
            const count = normalizedStartups.filter((s) => s.industry === ind).length;
            return {
              name: ind,
              value: count,
              color: COLORS[idx % COLORS.length],
            };
          });

          setIndustries(uniqueIndustries);
          setIndustryData(industryBreakdown);
          setIndustriesCache(true);
          setTotalStartups(normalizedStartups.length);

          const locMap = {};
          normalizedStartups.forEach((s) => {
            locMap[s.id] = s.city || s.locationName || "Unknown";
          });
          setStartupLocationsCache(locMap);
        }

        // Cache the result only for non-filtered requests
        if (!isFiltered) {
          setTopStartupsCache({
            industry: selectedIndustry,
            govReg: selectedGovReg,
            trl: selectedTrlStage,
            metric: rankingMetric,
            data: normalizedStartups
          });
        }
      } catch (error) {
        console.error("Error fetching top startups:", error);
        setTopStartups([]);
        setTopStartupsError(error.message || "Failed to fetch top startups");
      } finally {
        setTopStartupsLoading(false);
      }
    };

    fetchTopStartups();
  }, [selectedIndustry, selectedGovReg, selectedTrlStage, rankingMetric, refreshTrigger]);

  useEffect(() => {
    const fetchRankedStartups = async () => {
      // Set loading to true at the start of fetching
      setLoading(true);

      try {
        // Get rankings with pagination (only request current page items)
        const params = new URLSearchParams({
          page: currentPage.toString(),
          size: itemsPerPage.toString(),
          metric: rankingMetric
        });

        if (selectedIndustry !== "All") {
          params.append("industry", selectedIndustry);
        }
        if (selectedGovReg !== "All") {
          params.append("govReg", selectedGovReg);
        }
        if (selectedTrlStage !== "All") {
          params.append("trl", selectedTrlStage);
        }

        const url = `${getBackendUrl()}/api/rankings?${params.toString()}`;
        const response = await fetch(url, { credentials: "include", headers: getAuthHeaders() });

        if (!response.ok) {
          throw new Error("Failed to fetch rankings");
        }

        const data = await response.json();
        if (data.totalFunding !== undefined && data.totalFunding !== null) {
          setEcosystemTotalFunding(Number(data.totalFunding));
        }

        // Extract rankings from paginated response
        const rankings = data.content || [];
        const processedStartups = rankings.map((startup) => ({
          ...startup,
          locationName: startup.locationName || startup.city || (startupLocationsCache ? startupLocationsCache[startup.id] || "Unknown" : "Unknown"),
        }));

        setRankedStartups(processedStartups);
        setTotalPagesState(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchRankedStartups();
  }, [selectedIndustry, selectedGovReg, selectedTrlStage, rankingMetric, currentPage, refreshTrigger]);



  useEffect(() => {
    closeSidebar();

    // Sync active tab if passed from navigation
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }

    // Check if we have a startup ID to review from navigation
    if (
      location.state?.activeTab === "review" &&
      location.state?.reviewStartupId
    ) {
      setActiveTab("review");
      setSelectedReviewStartupId(location.state.reviewStartupId);
      if (location.state?.actorFilter) {
        setReviewActorFilter(location.state.actorFilter);
      }

      // Show a toast notification to indicate which entity is being reviewed
      if (location.state?.startupName) {
        const isInv = location.state?.isInvestor || location.state?.actorFilter === "ROLE_INVESTOR";
        toast.info(`Reviewing ${isInv ? "investor" : "startup"}: ${location.state.startupName}`);
      }
    }
  }, [closeSidebar, location.state]);

  // Listen for instant tab switch events dispatched from sidebar buttons
  useEffect(() => {
    const handleSwitchTab = (e) => {
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
    };
    window.addEventListener("switch-startup-dashboard-tab", handleSwitchTab);
    return () => {
      window.removeEventListener("switch-startup-dashboard-tab", handleSwitchTab);
    };
  }, []);

  // Reusable PaginationBar component matching ranking leaderboard design
  const PaginationBar = ({
    page = 0,
    totalPages = 1,
    totalItems = 0,
    onPageChange,
    activeColor = "indigo",
    label = "results"
  }) => {
    const safeTotalItems = typeof totalItems === "number" && !isNaN(totalItems) ? Math.max(0, totalItems) : 0;
    const safeTotalPages = typeof totalPages === "number" && !isNaN(totalPages) ? Math.max(1, totalPages) : 1;
    const safePage = typeof page === "number" && !isNaN(page) ? Math.max(0, Math.min(page, safeTotalPages - 1)) : 0;

    const isFirstPage = safePage === 0;
    const isLastPage = safePage === safeTotalPages - 1 || safeTotalPages === 0;
    const activeColorClass =
      activeColor === "emerald"
        ? "bg-emerald-600 text-white"
        : activeColor === "rose"
          ? "bg-rose-600 text-white"
          : "bg-indigo-600 text-white";
    const hoverColorClass =
      activeColor === "emerald"
        ? "text-emerald-700 hover:bg-emerald-50"
        : activeColor === "rose"
          ? "text-rose-700 hover:bg-rose-50"
          : "text-blue-600 hover:bg-blue-50";

    if (safeTotalItems === 0) return null;

    const startIdx = safePage * itemsPerPage + 1;
    const endIdx = Math.min((safePage + 1) * itemsPerPage, safeTotalItems);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
        <div className="text-sm text-gray-600">
          Showing {startIdx} to {endIdx} of {safeTotalItems} {label}
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => onPageChange(0)}
            disabled={isFirstPage}
            className={`p-2 rounded ${isFirstPage ? "text-gray-300 cursor-not-allowed" : hoverColorClass
              }`}
            title="First page"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={() => onPageChange(safePage - 1)}
            disabled={isFirstPage}
            className={`px-3 py-1 rounded text-sm font-medium ${isFirstPage ? "text-gray-300 cursor-not-allowed" : hoverColorClass
              }`}
          >
            Previous
          </button>

          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, safeTotalPages) }, (_, i) => {
              let pageNum;
              if (safeTotalPages <= 5) {
                pageNum = i;
              } else if (safePage <= 2) {
                pageNum = i;
              } else if (safePage >= safeTotalPages - 3) {
                pageNum = safeTotalPages - 5 + i;
              } else {
                pageNum = safePage - 2 + i;
              }

              return (
                <button
                  key={i}
                  onClick={() => onPageChange(pageNum)}
                  className={`w-8 h-8 flex items-center justify-center rounded text-sm font-semibold transition-colors ${safePage === pageNum ? activeColorClass : hoverColorClass
                    }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(safePage + 1)}
            disabled={isLastPage}
            className={`px-3 py-1 rounded text-sm font-medium ${isLastPage ? "text-gray-300 cursor-not-allowed" : hoverColorClass
              }`}
          >
            Next
          </button>

          <button
            onClick={() => onPageChange(safeTotalPages - 1)}
            disabled={isLastPage}
            className={`p-2 rounded ${isLastPage ? "text-gray-300 cursor-not-allowed" : hoverColorClass
              }`}
            title="Last page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  // Update the PaginationControls component for 0-based server-side pagination in Rankings
  const PaginationControls = () => (
    <PaginationBar
      page={currentPage}
      totalPages={totalPagesState}
      totalItems={totalElements}
      onPageChange={setCurrentPage}
      activeColor="indigo"
      label="results"
    />
  );

  // Add these new state variables for review filtering
  const [reviewFilterStatus, setReviewFilterStatus] = useState("all");
  const [reviewActorFilter, setReviewActorFilter] = useState(
    location.state?.actorFilter || "all"
  );
  const [reviewSearchQuery, setReviewSearchQuery] = useState("");
  const [filteredStartups, setFilteredStartups] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Add this new function to handle review filtering
  const handleReviewFilter = async () => {
    setReviewLoading(true);
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();

      if (selectedIndustry !== "All") {
        queryParams.append("industry", selectedIndustry);
      }

      // Use region code if available, otherwise use name
      if (reviewSelectedRegion !== "All Regions") {
        // Find selected region in PSGC data
        const selectedRegionData = psgcRegions.find(
          r => r.name === reviewSelectedRegion || r.regionName === reviewSelectedRegion
        );

        if (selectedRegionData) {
          queryParams.append("regionCode", selectedRegionData.code);
          queryParams.append("region", selectedRegionData.name);
        } else {
          queryParams.append("region", reviewSelectedRegion);
        }
      }

      if (reviewFilterStatus !== "all") {
        queryParams.append("status", reviewFilterStatus);
      }

      if (reviewSearchQuery.trim()) {
        queryParams.append("search", reviewSearchQuery.trim());
      }

      // Fetch startups with filters (with pagination)
      queryParams.append("page", "0");
      queryParams.append("size", "1000");
      queryParams.append("sortBy", "companyName");
      queryParams.append("sortDir", "ASC");

      const response = await fetch(
        `${getBackendUrl()}/startups/review?${queryParams.toString()}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch startups for review");
      }

      const data = await response.json();
      const startups = data.content || data || [];
      setFilteredStartups(startups);

      const totalFound = data.totalElements || startups.length;
      toast.success(`Found ${totalFound} startup${totalFound !== 1 ? 's' : ''} matching your criteria`);
    } catch (error) {
      console.error("Error applying filters:", error);
      toast.error("Failed to apply filters. Please try again.");
    } finally {
      setReviewLoading(false);
    }
  };

  // Reset filters function
  const resetReviewFilters = () => {
    setSelectedIndustry("All");
    setReviewSelectedRegion("All Regions");
    setReviewFilterStatus("all");
    setReviewSearchQuery("");
    // Trigger a refetch with reset filters
    handleReviewFilter();
  };

  // Add this function to fetch PSGC regions data
  const fetchPsgcRegions = async () => {
    setPsgcLoading(true);
    try {
      // Fetch regions from PSGC API
      const response = await fetch(`https://psgc.gitlab.io/api/regions/`);

      if (!response.ok) {
        throw new Error('Failed to fetch PSGC regions');
      }

      const data = await response.json();
      setPsgcRegions(data);

      // Update available regions with standardized PSGC regions
      const standardizedRegions = data.map(region => ({
        code: region.code,
        name: region.name,
        regionName: region.regionName || region.name
      }));

      setAvailableRegions(standardizedRegions);
    } catch (error) {
      console.error("Error fetching PSGC regions:", error);
      toast.error("Failed to load region data. Using local data instead.");
    } finally {
      setPsgcLoading(false);
    }
  };

  // Call this function when the component mounts or the activeTab changes to "review" or "reports"
  useEffect(() => {
    if (activeTab === "review") {
      fetchPsgcRegions();
    }
    if (activeTab === "reports") {
      fetchPsgcRegions();
      fetchAvailableReports();
    }
  }, [activeTab]);

  const fetchAvailableReports = async () => {
    setReportsLoading(true);
    try {
      const reports = [
        {
          id: 1,
          title: "Annual Ecosystem Report",
          description: `Comprehensive analysis of all ${totalStartups} startups across ${industries.length} industries`,
          date: "May 2025",
          type: "pdf",
        },
        {
          id: 2,
          title: "Funding Landscape",
          description: `Analysis of funding distribution across ${fundingData.length} startup stages`,
          date: "April 2025",
          type: "pdf",
        },
        {
          id: 3,
          title: "Industry Analysis",
          description: `Performance comparison of ${industries
            .slice(0, 3)
            .join(", ")} and other industries`,
          date: "March 2025",
          type: "pdf",
        },
        {
          id: 4,
          title: "Regional Performance",
          description: `Startup distribution and performance across ${locationData.length} major regions`,
          date: "February 2025",
          type: "pdf",
        },
        {
          id: 5,
          title: "Top Performers Spotlight",
          description: `Detailed analysis of top ${topStartups.length} performing startups`,
          date: "January 2025",
          type: "pdf",
        },
        {
          id: 6,
          title: "Government Support Analysis",
          description:
            "Impact of government programs on startup growth and survival",
          date: "December 2024",
          type: "pdf",
        },
      ];

      setGeneratedReports(reports);
      setReportsLoading(false);
    } catch (error) {
      console.error("Error generating reports:", error);
      setReportsLoading(false);
    }
  };

  const handleReportFormChange = (e) => {
    const { name, value } = e.target;
    setReportFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMetricChange = (metric) => {
    setReportFormData((prev) => {
      const metrics = [...prev.metrics];
      if (metrics.includes(metric)) {
        return {
          ...prev,
          metrics: metrics.filter((m) => m !== metric),
        };
      } else {
        return {
          ...prev,
          metrics: [...metrics, metric],
        };
      }
    });
  };

  const downloadReport = async (report) => {
    try {
      toast.info(`Preparing ${report.title}...`);
      await exportSpecificReportPdf(report, {
        totalStartups,
        calculatedTotalFunding,
        industries,
        industryData,
        locationData,
        fundingData,
        govComplianceData: computedGovCompliance,
        trlStagesData: computedTrlStages,
        growthData,
        topStartups: (topStartups && topStartups.length > 0) ? topStartups : rankedStartups,
        rankedStartups,
        formatFundingAmount,
      });
      toast.success(`${report.title} downloaded successfully!`);
      refreshDashboard();
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const generateCustomReport = async () => {
    setReportsLoading(true);

    try {
      // Filter startups based on selected criteria
      const filteredStartups = rankedStartups.filter((startup) => {
        const industryMatch =
          reportFormData.industry === "All Industries" ||
          startup.industry === reportFormData.industry;

        const selectedRegion = reportFormData.region.toLowerCase();
        const startupLocation = startup.locationName?.toLowerCase() || "";

        const regionMatch =
          reportFormData.region === "All Regions" ||
          startupLocation.includes(selectedRegion) ||
          selectedRegion.includes(startupLocation);

        return industryMatch && regionMatch;
      });

      if (filteredStartups.length === 0) {
        toast.warning(
          `No startups found for the selected criteria. Please try different filters.`
        );
        setReportsLoading(false);
        return;
      }

      // Create PDF with enhanced styling
      const doc = new jsPDF();

      // Add header with logo and title
      doc.setFillColor(29, 53, 87);
      doc.rect(0, 0, 210, 40, "F");

      // Add logo
      doc.addImage(loginLogo, "PNG", 20, 10, 50, 25);

      // Add title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("Custom Startup Report", 80, 25);

      // Add subtitle
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("StartupSphere Philippines", 80, 35);

      // Reset text color for content
      doc.setTextColor(0, 0, 0);

      // Add generation date
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 50);

      // Add filters section with styling
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Report Filters", 20, 65);

      // Add filters in a styled box
      doc.setFillColor(240, 240, 240);
      doc.rect(20, 70, 170, 40, "F");

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Industry: ${reportFormData.industry}`, 25, 80);
      doc.text(`Region: ${reportFormData.region}`, 25, 90);
      doc.text(`Time Period: ${reportFormData.timePeriod}`, 25, 100);

      // Add summary statistics
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Summary Statistics", 20, 120);

      // Add statistics in a styled box
      doc.setFillColor(240, 240, 240);
      doc.rect(20, 125, 170, 30, "F");

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Total Startups Analyzed: ${filteredStartups.length}`, 25, 135);

      // Calculate and add industry distribution
      const industryDistribution = {};
      filteredStartups.forEach((startup) => {
        if (startup.industry) {
          industryDistribution[startup.industry] =
            (industryDistribution[startup.industry] || 0) + 1;
        }
      });

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Industry Distribution", 20, 165);

      const industryTableData = Object.entries(industryDistribution).map(
        ([industry, count]) => [
          industry,
          count.toString(),
          ((count / filteredStartups.length) * 100).toFixed(1) + "%",
        ]
      );

      autoTable(doc, {
        startY: 170,
        head: [["Industry", "Count", "Percentage"]],
        body: industryTableData,
        theme: "grid",
        headStyles: {
          fillColor: [29, 53, 87],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        styles: {
          fontSize: 10,
          cellPadding: 5,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: 10, right: 20, bottom: 10, left: 20 },
      });

      // Add regional distribution
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Regional Distribution", 20, doc.lastAutoTable.finalY + 20);

      const regionalDistribution = {};
      filteredStartups.forEach((startup) => {
        if (startup.locationName) {
          regionalDistribution[startup.locationName] =
            (regionalDistribution[startup.locationName] || 0) + 1;
        }
      });

      const regionalTableData = Object.entries(regionalDistribution).map(
        ([region, count]) => [
          region,
          count.toString(),
          ((count / filteredStartups.length) * 100).toFixed(1) + "%",
        ]
      );

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 25,
        head: [["Region", "Count", "Percentage"]],
        body: regionalTableData,
        theme: "grid",
        headStyles: {
          fillColor: [29, 53, 87],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        styles: {
          fontSize: 10,
          cellPadding: 5,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: 10, right: 20, bottom: 10, left: 20 },
      });

      // Add startup details
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Startup Details", 20, doc.lastAutoTable.finalY + 20);

      const startupTableData = filteredStartups.map((startup) => [
        startup.companyName || "N/A",
        startup.industry || "N/A",
        startup.locationName || "N/A",
        (startup.overallScore || 0).toFixed(2),
        (startup.growthScore || 0).toFixed(2),
        (startup.investmentScore || 0).toFixed(2),
        (startup.ecosystemScore || 0).toFixed(2),
      ]);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 25,
        head: [
          [
            "Company",
            "Industry",
            "Location",
            "Overall",
            "Growth",
            "Investment",
            "Ecosystem",
          ],
        ],
        body: startupTableData,
        theme: "grid",
        headStyles: {
          fillColor: [29, 53, 87],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 4,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 30 },
          2: { cellWidth: 25 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 25 },
          6: { cellWidth: 25 },
        },
        margin: { top: 10, right: 20, bottom: 10, left: 20 },
      });

      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Page ${i} of ${pageCount} | StartupSphere Philippines`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      }

      // Save the PDF
      const fileName = `custom-report-${new Date().toISOString().split("T")[0]
        }.pdf`;
      doc.save(fileName);

      // Add new report to list
      const newReport = {
        id: generatedReports.length + 1,
        title: `Custom Report: ${reportFormData.industry} in ${reportFormData.region}`,
        description: `Analysis for ${reportFormData.timePeriod} including ${reportFormData.metrics.length
          } metrics: ${reportFormData.metrics.slice(0, 2).join(", ")}${reportFormData.metrics.length > 2 ? "..." : ""
          }`,
        date: new Date().toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        type: "pdf",
        isCustom: true,
      };

      setGeneratedReports((prev) => [newReport, ...prev]);
      setReportFormData((prev) => ({ ...prev, metrics: [] }));
      setReportsLoading(false);
      toast.success("Custom report generated successfully!");
      refreshDashboard();
    } catch (error) {
      console.error("Error generating custom report:", error);
      setReportsLoading(false);
      toast.error("Failed to generate report. Please try again.");
    }
  };

  // Helper function to get industry icon
  const getIndustryIcon = (industryName) => {
    const iconMap = {
      "Mobile App Development": "📱",
      "Food & Beverage": "🍴",
      "Technology & IT Services": "💻",
      "Healthcare & Medical Services": "🏥",
      "Agriculture & Farming": "🌾",
      "Education & Training": "🎓",
      "Web Development": "🌐",
      "Software Development": "⚙️",
      "IT Solutions & Consulting": "🔧",
      "Manufacturing": "🏭",
      "Retail & E-commerce": "🛍️",
      "Wholesale Trade": "📦",
      "Aquaculture & Fisheries": "🐠",
      "Sari-Sari Store": "🏪",
      "Other Services": "✨"
    };
    return iconMap[industryName] || "💼";
  };

  // Helper function to get funding stage description
  const getFundingStageDescription = (stageName) => {
    const descriptions = {
      "Seed": "Early-stage funding, often from angel investors",
      "Series A": "First institutional funding round",
      "Series B": "Growth and expansion stage",
      "Series C": "Late-stage scaling and expansion",
      "Other": "Alternative funding sources"
    };
    return descriptions[stageName] || "";
  };

  // Helper to format funding with dynamic unit K, M, B (handles 5 digits e.g. 50K up to Billions)
  const formatFundingAmount = (amount) => {
    const num = Number(amount) || 0;
    if (num === 0) return "0";

    if (num >= 1_000_000_000) {
      const val = (num / 1_000_000_000).toFixed(1);
      return val.endsWith(".0") ? `${parseInt(val, 10)}B` : `${val}B`;
    }
    if (num >= 1_000_000) {
      const val = (num / 1_000_000).toFixed(1);
      return val.endsWith(".0") ? `${parseInt(val, 10)}M` : `${val}M`;
    }
    if (num >= 1_000) {
      const val = (num / 1_000).toFixed(1);
      return val.endsWith(".0") ? `${parseInt(val, 10)}K` : `${val}K`;
    }
    return num.toLocaleString();
  };

  const allBusinesses = useMemo(() => {
    if (ecosystemAllBusinesses && ecosystemAllBusinesses.length > 0) {
      return ecosystemAllBusinesses;
    }
    return (topStartups && topStartups.length > 0) ? topStartups : rankedStartups;
  }, [ecosystemAllBusinesses, topStartups, rankedStartups]);

  const activeBusinesses = useMemo(() => {
    return allBusinesses.filter((s) => {
      const days = Number(s.daysSinceLastUpdate ?? 0);
      return !s.isArchived && s.activityStatus !== "ARCHIVED" && s.activityStatus !== "INACTIVE" && days <= 90;
    });
  }, [allBusinesses]);

  const archivedBusinesses = useMemo(() => {
    return allBusinesses.filter((s) => {
      const days = Number(s.daysSinceLastUpdate ?? 0);
      return s.isArchived || s.activityStatus === "ARCHIVED" || s.activityStatus === "INACTIVE" || days > 90;
    });
  }, [allBusinesses]);

  const totalOverviewPages = Math.max(1, Math.ceil(topStartups.length / itemsPerPage));
  const paginatedTopStartups = useMemo(() => {
    return topStartups.slice(overviewPage * itemsPerPage, (overviewPage + 1) * itemsPerPage);
  }, [topStartups, overviewPage, itemsPerPage]);

  const filteredActiveBusinesses = useMemo(() => {
    if (!activeBusinesses || !Array.isArray(activeBusinesses)) return [];
    if (!activeSearch.trim()) return activeBusinesses;
    const q = activeSearch.toLowerCase();
    return activeBusinesses.filter((s) =>
      (s.companyName || "").toLowerCase().includes(q) ||
      (s.industry || "").toLowerCase().includes(q) ||
      (s.city || s.locationName || "").toLowerCase().includes(q)
    );
  }, [activeBusinesses, activeSearch]);

  const totalActivePages = Math.max(1, Math.ceil(filteredActiveBusinesses.length / itemsPerPage));
  const paginatedActiveBusinesses = useMemo(() => {
    return filteredActiveBusinesses.slice(activePage * itemsPerPage, (activePage + 1) * itemsPerPage);
  }, [filteredActiveBusinesses, activePage, itemsPerPage]);

  const filteredArchivedBusinesses = useMemo(() => {
    if (!archivedBusinesses || !Array.isArray(archivedBusinesses)) return [];
    if (!archiveSearch.trim()) return archivedBusinesses;
    const q = archiveSearch.toLowerCase();
    return archivedBusinesses.filter((s) =>
      (s.companyName || "").toLowerCase().includes(q) ||
      (s.industry || "").toLowerCase().includes(q) ||
      (s.contactEmail || "").toLowerCase().includes(q)
    );
  }, [archivedBusinesses, archiveSearch]);

  const totalArchivedPages = Math.max(1, Math.ceil(filteredArchivedBusinesses.length / itemsPerPage));
  const paginatedArchivedBusinesses = useMemo(() => {
    return filteredArchivedBusinesses.slice(archivePage * itemsPerPage, (archivePage + 1) * itemsPerPage);
  }, [filteredArchivedBusinesses, archivePage, itemsPerPage]);

  const calculatedTotalFunding = useMemo(() => {
    if (allBusinesses && allBusinesses.length > 0) {
      const sum = allBusinesses.reduce((acc, startup) => {
        const funding =
          Number(startup.totalStartupFundingReceived || startup.totalFunding || 0) +
          Number(startup.amountOfGovernmentGrantsOrSubsidiesReceived || 0);
        return acc + funding;
      }, 0);
      if (sum > 0) return sum;
    }
    return ecosystemTotalFunding;
  }, [allBusinesses, ecosystemTotalFunding]);

  const handleSendInactivityWarning = async (startupId, companyName) => {
    setInactivityActionLoading(true);
    try {
      const res = await fetch(`${getBackendUrl()}/startups/${startupId}/send-inactivity-reminder`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to send warning email");
      }
      toast.success(`Inactivity warning notice dispatched to ${companyName}`);
      refreshDashboard();
    } catch (err) {
      toast.error(err.message || "Failed to send warning notice");
    } finally {
      setInactivityActionLoading(false);
    }
  };

  const handleReactivateStartup = async (startupId, companyName) => {
    setInactivityActionLoading(true);
    try {
      const res = await fetch(`${getBackendUrl()}/startups/${startupId}/reactivate`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to reactivate startup");
      }
      toast.success(`"${companyName}" reactivated and restored to map!`);
      refreshDashboard();
    } catch (err) {
      toast.error(err.message || "Failed to reactivate startup");
    } finally {
      setInactivityActionLoading(false);
    }
  };

  const handleTriggerLifecycleCheck = async () => {
    setInactivityActionLoading(true);
    try {
      const res = await fetch(`${getBackendUrl()}/startups/check-inactivity-lifecycle`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to execute inactivity lifecycle check");
      }
      toast.success("Inactivity lifecycle check completed successfully!");
      refreshDashboard();
    } catch (err) {
      toast.error(err.message || "Failed to execute lifecycle check");
    } finally {
      setInactivityActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20 md:pb-10 overflow-x-hidden">
      <main className="flex-grow p-3 sm:p-6">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="cursor-pointer flex items-center text-gray-800 mb-4 sm:mb-6 transition-colors hover:text-white hover:bg-indigo-500 rounded-md px-3 py-1.5 text-sm font-medium w-fit"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span>Back to Home</span>
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          {/* Total Startups Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-6 border border-indigo-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-indigo-700 text-xs sm:text-sm font-medium mb-1">Total Startups</p>
                <p className="text-2xl sm:text-3xl font-bold text-indigo-900 mb-2">{totalStartups}</p>
                <p className="text-xs text-indigo-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                  Active in ecosystem
                </p>
              </div>
              <div className="p-2.5 sm:p-3 bg-indigo-200 rounded-lg">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-700" />
              </div>
            </div>
          </div>

          {/* Total Funding Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-6 border border-green-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="text-green-700 text-xs sm:text-sm font-medium">Total Funding</p>
                  {calculatedTotalFunding >= 1_000_000_000 ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-200 text-green-800">Billions</span>
                  ) : calculatedTotalFunding >= 1_000_000 ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-200 text-green-800">Millions</span>
                  ) : calculatedTotalFunding >= 1_000 ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-200 text-green-800">Thousands</span>
                  ) : null}
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-green-900 mb-2">
                  ₱{formatFundingAmount(calculatedTotalFunding)}
                </p>
                <p className="text-xs text-green-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                  Total invested
                </p>
              </div>
              <div className="p-2.5 sm:p-3 bg-green-200 rounded-lg">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-700" />
              </div>
            </div>
          </div>

          {/* Industries Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-6 border border-blue-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-blue-700 text-xs sm:text-sm font-medium mb-1">Industries</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">{industries.length}</p>
                <p className="text-xs text-blue-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                  Diversified sectors
                </p>
              </div>
              <div className="p-2.5 sm:p-3 bg-blue-200 rounded-lg">
                <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-blue-700" />
              </div>
            </div>
          </div>

          {/* Average Score Card */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-6 border border-amber-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-amber-700 text-xs sm:text-sm font-medium mb-1">Avg. Score</p>
                <p className="text-2xl sm:text-3xl font-bold text-amber-900 mb-2">
                  {rankedStartups.length > 0
                    ? Math.round(
                      rankedStartups.reduce(
                        (sum, startup) => sum + startup.overallScore,
                        0
                      ) / rankedStartups.length
                    )
                    : "N/A"}/100
                </p>
                <p className="text-xs text-amber-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                  Performance metric
                </p>
              </div>
              <div className="p-3 bg-amber-200 rounded-lg">
                <Users className="h-6 w-6 text-amber-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Consolidated Ecosystem Executive Filter Toolbar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/90 p-5 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 mb-4 border-b border-gray-100 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                <Filter className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span>Ecosystem Filters & Analytics Controls</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    Consolidated
                  </span>
                </h2>
                <p className="text-xs text-gray-500">Filter entire ecosystem directory across all tabs in real-time</p>
              </div>
            </div>

            {/* Reset Filters Action */}
            {(selectedIndustry !== "All" || selectedGovReg !== "All" || selectedTrlStage !== "All" || rankingMetric !== "overall") && (
              <button
                onClick={() => {
                  setSelectedIndustry("All");
                  setSelectedGovReg("All");
                  setSelectedTrlStage("All");
                  setRankingMetric("overall");
                  setCurrentPage(0);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer border border-rose-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            )}

            {/* Export Report Button */}
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-sm shadow-indigo-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Report</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Industry Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                <span>Industry Sector</span>
              </label>
              <div className="relative">
                <select
                  value={selectedIndustry}
                  onChange={(e) => {
                    setSelectedIndustry(e.target.value);
                    setCurrentPage(0);
                  }}
                  className={`w-full rounded-xl px-3.5 py-2.5 pr-10 text-xs md:text-sm font-semibold transition-all border outline-none cursor-pointer ${selectedIndustry !== "All"
                    ? "bg-indigo-50/70 border-indigo-400 text-indigo-900 ring-2 ring-indigo-100"
                    : "bg-gray-50 hover:bg-gray-100/80 border-gray-300 text-gray-800"
                    }`}
                >
                  <option value="All">All Industries ({industries.length} available)</option>
                  {industries.map((ind, i) => (
                    <option key={i} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Government Registration (with BIR) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                  <span>Govt. Registration</span>
                  <TooltipInfo type="GOV_REG" size="xs" />
                </label>
              </div>
              <div className="relative">
                <select
                  value={selectedGovReg}
                  onChange={(e) => {
                    setSelectedGovReg(e.target.value);
                    setCurrentPage(0);
                  }}
                  className={`w-full rounded-xl px-3.5 py-2.5 pr-10 text-xs md:text-sm font-semibold transition-all border outline-none cursor-pointer ${selectedGovReg !== "All"
                    ? "bg-emerald-50/70 border-emerald-400 text-emerald-900 ring-2 ring-emerald-100"
                    : "bg-gray-50 hover:bg-gray-100/80 border-gray-300 text-gray-800"
                    }`}
                >
                  <option value="All">All Registration States</option>
                  <option value="BIR">Government Certified</option>
                  <option value="SEC">SEC (Securities & Exchange Commission)</option>
                  <option value="DTI">DTI (Dept. of Trade & Industry)</option>
                  <option value="REGISTERED">Any Registered Agency</option>
                  <option value="UNREGISTERED">Unregistered / Pending</option>
                </select>
              </div>
            </div>

            {/* 3. TRL Readiness Stage */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                  <span>TRL Readiness</span>
                  <TooltipInfo type="TRL" size="xs" />
                </label>
              </div>
              <div className="relative">
                <select
                  value={selectedTrlStage}
                  onChange={(e) => {
                    setSelectedTrlStage(e.target.value);
                    setCurrentPage(0);
                  }}
                  className={`w-full rounded-xl px-3.5 py-2.5 pr-10 text-xs md:text-sm font-semibold transition-all border outline-none cursor-pointer ${selectedTrlStage !== "All"
                    ? "bg-amber-50/70 border-amber-400 text-amber-900 ring-2 ring-amber-100"
                    : "bg-gray-50 hover:bg-gray-100/80 border-gray-300 text-gray-800"
                    }`}
                >
                  <option value="All">All TRL Levels</option>
                  <option value="TRL 1">TRL 1 - Basic Principles Observed</option>
                  <option value="TRL 2">TRL 2 - Technology Concept Formulated</option>
                  <option value="TRL 3">TRL 3 - Experimental Proof of Concept</option>
                  <option value="TRL 4">TRL 4 - Technology Validated in Lab</option>
                  <option value="TRL 5">TRL 5 - Technology Validated in Relevant Environment</option>
                  <option value="TRL 6">TRL 6 - Technology Demonstrated in Relevant Environment</option>
                  <option value="TRL 7">TRL 7 - System Prototype Demonstration</option>
                  <option value="TRL 8">TRL 8 - System Complete and Qualified</option>
                  <option value="TRL 9">TRL 9 - Actual System Proven in Operational Environment</option>
                </select>
              </div>
            </div>

            {/* 4. Ranking Performance Metric */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                <span>Leaderboard Metric</span>
              </label>
              <div className="relative">
                <select
                  value={rankingMetric}
                  onChange={(e) => {
                    setRankingMetric(e.target.value);
                    setCurrentPage(0);
                  }}
                  className="w-full rounded-xl px-3.5 py-2.5 pr-10 text-xs md:text-sm font-semibold bg-gray-50 hover:bg-gray-100/80 border border-gray-300 text-gray-800 outline-none cursor-pointer focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                >
                  <option value="overall">Overall Performance Score</option>
                  <option value="growth">Growth Score</option>
                  <option value="investment">Investment Score</option>
                  <option value="ecosystem">Ecosystem Score</option>
                  <option value="engagement">Engagement Score</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Only for Admin */}
        {role === "ROLE_ADMIN" && (
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-6 sm:space-x-8 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${activeTab === "overview"
                  ? "border-indigo-500 text-indigo-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("active")}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${activeTab === "active"
                  ? "border-indigo-500 text-indigo-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                <span>Active</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {activeBusinesses.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("rankings")}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${activeTab === "rankings"
                  ? "border-indigo-500 text-indigo-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                Rankings
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${activeTab === "analytics"
                  ? "border-indigo-500 text-indigo-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab("archive")}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${activeTab === "archive"
                  ? "border-indigo-500 text-indigo-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                <span>Archive</span>
                {archivedBusinesses.length > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                    {archivedBusinesses.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("reports")}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${activeTab === "reports"
                  ? "border-indigo-500 text-indigo-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                Reports
              </button>

              <button
                onClick={() => setActiveTab("review")}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${activeTab === "review"
                  ? "border-indigo-500 text-indigo-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                Startup Review
              </button>
            </nav>
          </div>
        )}

        {activeTab === "overview" && role === "ROLE_ADMIN" && (
          <div className="space-y-6">
            {/* Top Performing Startups Section */}
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
              <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-5">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 mr-3"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                      Top Performing Startups
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedIndustry === "All"
                        ? `Displaying all startups (${topStartups.length} total) ranked by overall performance`
                        : `Displaying all startups in ${selectedIndustry} (${topStartups.length} found)`}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <label htmlFor="industry-select" className="text-sm font-medium text-gray-700">Filter by Industry:</label>
                    <select
                      id="industry-select"
                      className={`px-4 py-2 border rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 ${selectedIndustry !== "All"
                        ? 'border-indigo-500 ring-2 ring-indigo-200 font-semibold'
                        : 'border-gray-300'
                        }`}
                      value={selectedIndustry}
                      onChange={(e) => {
                        setSelectedIndustry(e.target.value);
                      }}
                    >
                      <option value="All">All Industries</option>
                      {industries.map((industry, index) => (
                        <option key={index} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {topStartupsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading top startups {selectedIndustry !== "All" ? `for ${selectedIndustry}` : ""}...</p>
                  </div>
                ) : topStartupsError ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg max-w-md">
                      <p className="text-red-700 font-semibold mb-2">Failed to Load Top Startups</p>
                      <p className="text-red-600 text-sm mb-4">{topStartupsError}</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="text-sm font-medium text-red-700 hover:text-red-800 bg-red-100 hover:bg-red-200 px-3 py-2 rounded transition-colors"
                      >
                        Try Refreshing Page
                      </button>
                    </div>
                  </div>
                ) : topStartups.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="px-3.5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Rank</th>
                            <th className="px-3.5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Company Name</th>
                            <th className="px-3.5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Industry</th>
                            <th className="px-3.5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Overall Score</th>
                            <th className="px-3.5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Growth Rate</th>
                            {role === "ROLE_ADMIN" && (
                              <th className="px-3.5 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {paginatedTopStartups.map((startup, index) => {
                            const rankNum = overviewPage * itemsPerPage + index + 1;
                            return (
                              <tr key={startup.id} className="hover:bg-indigo-50 transition-colors duration-150">
                                <td className="px-3.5 py-3 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <span className="inline-flex items-center justify-center h-7 w-7 min-w-[28px] rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-bold text-xs shadow-xs shrink-0">
                                      {rankNum}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3.5 py-3 whitespace-nowrap">
                                  <span className="text-sm font-semibold text-gray-900 truncate block max-w-[200px]" title={startup.companyName}>
                                    {startup.companyName}
                                  </span>
                                </td>
                                <td className="px-3.5 py-3 whitespace-nowrap">
                                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 inline-block max-w-[140px] truncate" title={startup.industry}>
                                    {startup.industry}
                                  </span>
                                </td>
                                <td className="px-3.5 py-3 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="w-14 h-2 bg-gray-200 rounded-full mr-2">
                                      <div
                                        className="h-2 bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min(Math.max(startup.overallScore || 0, 0), 100)}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">{Math.round(Math.min(Math.max(startup.overallScore || 0, 0), 100))}/100</span>
                                  </div>
                                </td>
                                <td className="px-3.5 py-3 whitespace-nowrap">
                                  <div className="flex items-center text-sm font-semibold text-green-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                                    +{(startup.growthScore ?? startup.growthRate ?? 0).toFixed(1)}%
                                  </div>
                                </td>
                                {role === "ROLE_ADMIN" && (
                                  <td className="px-3.5 py-3 whitespace-nowrap text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => navigate(`/startup/${startup.id}`)}
                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                        title="View startup details"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setDeleteConfirmStartup(startup)}
                                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                        title="Delete startup (Admin only)"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <PaginationBar
                      page={overviewPage}
                      totalPages={totalOverviewPages}
                      totalItems={topStartups.length}
                      onPageChange={setOverviewPage}
                      activeColor="indigo"
                      label="startups"
                    />
                  </>
                ) : (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400 mb-3"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    <p className="text-gray-600">No startups found for the selected filters</p>
                  </div>
                )}
              </div>
            </div>

            {/* Charts Grid Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Industry Distribution */}
              <div id="chart-industry-distribution" className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
                <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 mr-3"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                        Industry Distribution
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">Startup count across {industries.length} industries • Total: <span className="font-bold text-indigo-700">{industryData.reduce((sum, ind) => sum + ind.value, 0)}</span> startups</p>
                    </div>
                    <ChartExportButton
                      chartId="chart-industry-distribution"
                      chartTitle="Industry Distribution"
                      buttonSize="xs"
                      data={industryData}
                      columns={[
                        { header: "Industry", dataKey: "name" },
                        { header: "Startups", dataKey: "value" },
                        { header: "Share %", dataKey: "value", format: (val) => { const t = industryData.reduce((s, i) => s + i.value, 0); return t > 0 ? `${((val / t) * 100).toFixed(1)}%` : "0%"; } },
                      ]}
                      summaryText={`${industryData.length} sectors with ${industryData.reduce((s, i) => s + i.value, 0)} total startups`}
                      activeFilters={{ industry: selectedIndustry, govReg: selectedGovReg, trl: selectedTrlStage, metric: rankingMetric }}
                    />
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  {loading ? (
                    <div className="flex items-center justify-center flex-1">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : industryData.length > 0 ? (
                    <div className="flex flex-col flex-1">
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                            <Pie
                              data={industryData}
                              cx="50%"
                              cy="45%"
                              innerRadius={45}
                              outerRadius={72}
                              paddingAngle={3}
                              dataKey="value"
                              animationBegin={0}
                              animationDuration={800}
                              animationEasing="ease-out"
                            >
                              {industryData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                  opacity={selectedChartIndustry === null || selectedChartIndustry === entry.name ? 1 : 0.3}
                                  className="cursor-pointer transition-opacity duration-200 hover:opacity-100"
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#fff',
                                border: '2px solid #4f46e5',
                                borderRadius: '12px',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
                                padding: '12px 16px',
                                fontSize: '13px',
                                fontWeight: '600'
                              }}
                              formatter={(value) => [
                                `${value} startups`,
                                'Count'
                              ]}
                              labelFormatter={(label) => `${label}`}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-5 pt-5 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-bold text-gray-900">Industries Breakdown</h4>
                          {selectedChartIndustry && (
                            <button
                              onClick={() => setSelectedChartIndustry(null)}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors bg-indigo-50"
                            >
                              ✕ Clear Filter
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-56 overflow-y-auto">
                          {industryData.map((entry, index) => {
                            const isSelected = selectedChartIndustry === entry.name;
                            const percentage = ((entry.value / industryData.reduce((sum, ind) => sum + ind.value, 0)) * 100).toFixed(1);
                            return (
                              <div
                                key={index}
                                onClick={() => setSelectedChartIndustry(isSelected ? null : entry.name)}
                                onMouseEnter={() => setHoveredIndustry(entry.name)}
                                onMouseLeave={() => setHoveredIndustry(null)}
                                className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 shadow-sm hover:shadow-md ${isSelected
                                  ? 'bg-indigo-50 border-indigo-500 shadow-md'
                                  : hoveredIndustry === entry.name
                                    ? 'bg-gray-50 border-gray-300 shadow-sm'
                                    : 'bg-white border-gray-200 hover:border-indigo-300'
                                  }`}
                              >
                                <div className="flex items-start gap-2 mb-2">
                                  <span className="text-2xl flex-shrink-0" title={entry.name}>{getIndustryIcon(entry.name)}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-900 line-clamp-2">{entry.name}</p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-300"
                                      style={{
                                        width: `${percentage}%`,
                                        backgroundColor: entry.color
                                      }}
                                    ></div>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-600">{percentage}%</span>
                                    <span className="text-xs font-bold text-gray-900 bg-gray-100 rounded px-2 py-1">{entry.value}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center flex-1">
                      <p className="text-gray-600">No industry data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Funding Stages */}
              <div id="chart-funding-stages" className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col ">
                <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600 mr-3"><path d="M6 9c0-1 1-2 2-2s2 1 2 2M18 9c0-1-1-2-2-2s-2 1-2 2M6 15c0 1 1 2 2 2s2-1 2-2M18 15c0 1-1 2-2 2s-2-1-2-2"></path><path d="M12 3v3m0 12v3M3 12h3m12 0h3"></path></svg>
                        Funding Stages
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">Funding distribution • Total: <span className="font-bold text-purple-700">{fundingData.reduce((sum, stage) => sum + stage.value, 0)}</span> startups</p>
                    </div>
                    <ChartExportButton
                      chartId="chart-funding-stages"
                      chartTitle="Funding Stages Distribution"
                      buttonSize="xs"
                      data={fundingData}
                      columns={[
                        { header: "Stage", dataKey: "name" },
                        { header: "Startups", dataKey: "value" },
                        { header: "Share %", dataKey: "value", format: (val) => { const t = fundingData.reduce((s, i) => s + i.value, 0); return t > 0 ? `${((val / t) * 100).toFixed(1)}%` : "0%"; } },
                      ]}
                      summaryText="Startup distribution across funding lifecycle stages"
                      activeFilters={{ industry: selectedIndustry, govReg: selectedGovReg, trl: selectedTrlStage, metric: rankingMetric }}
                    />
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  {dashboardLoading ? (
                    <div className="flex items-center justify-center flex-1">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                  ) : fundingData.length > 0 ? (
                    <div className="flex flex-col flex-1">
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                            <Pie
                              data={fundingData}
                              cx="50%"
                              cy="45%"
                              outerRadius={72}
                              dataKey="value"
                              animationBegin={0}
                              animationDuration={800}
                              animationEasing="ease-out"
                            >
                              {fundingData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                  opacity={selectedFundingStage === null || selectedFundingStage === entry.name ? 1 : 0.3}
                                  className="cursor-pointer transition-opacity duration-200 hover:opacity-100"
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#fff',
                                border: '2px solid #7c3aed',
                                borderRadius: '12px',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
                                padding: '12px 16px',
                                fontSize: '13px',
                                fontWeight: '600'
                              }}
                              formatter={(value) => [
                                `${value} startups`,
                                'Count'
                              ]}
                              labelFormatter={(label) => `${label}`}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-5 pt-5 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-bold text-gray-900">Funding Stages Breakdown</h4>
                          {selectedFundingStage && (
                            <button
                              onClick={() => setSelectedFundingStage(null)}
                              className="text-xs font-semibold text-purple-600 hover:text-purple-700 hover:bg-purple-100 px-3 py-1.5 rounded-md transition-colors bg-purple-50"
                            >
                              ✕ Clear Filter
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto">
                          {fundingData.map((entry, index) => {
                            const isSelected = selectedFundingStage === entry.name;
                            const percentage = ((entry.value / fundingData.reduce((sum, stage) => sum + stage.value, 0)) * 100).toFixed(1);
                            const description = getFundingStageDescription(entry.name);
                            return (
                              <div
                                key={index}
                                onClick={() => setSelectedFundingStage(isSelected ? null : entry.name)}
                                onMouseEnter={() => setHoveredFundingStage(entry.name)}
                                onMouseLeave={() => setHoveredFundingStage(null)}
                                className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 shadow-sm hover:shadow-md ${isSelected
                                  ? 'bg-purple-50 border-purple-500 shadow-md'
                                  : hoveredFundingStage === entry.name
                                    ? 'bg-gray-50 border-gray-300 shadow-sm'
                                    : 'bg-white border-gray-200 hover:border-purple-300'
                                  }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="text-sm font-bold text-gray-900">{entry.name}</h5>
                                  <span className={`text-xs font-bold text-white rounded-full px-3 py-1 transition-colors ${isSelected
                                    ? 'bg-purple-600'
                                    : 'bg-purple-500 group-hover:bg-purple-600'
                                    }`}>{percentage}%</span>
                                </div>
                                {description && (
                                  <p className="text-xs text-gray-600 mb-3 italic">{description}</p>
                                )}
                                <div className="space-y-2">
                                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-300"
                                      style={{
                                        width: `${percentage}%`,
                                        backgroundColor: COLORS[index % COLORS.length]
                                      }}
                                    ></div>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-600">Startups</span>
                                    <span className="text-sm font-bold text-gray-900 bg-gray-100 rounded px-2 py-1">{entry.value}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center flex-1 flex-col">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300 mb-2"><circle cx="12" cy="12" r="10"></circle></svg>
                      <p className="text-gray-600 font-medium">No funding data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Growth Trends */}
            <div id="chart-growth-trends" className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
              <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 mr-3"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                      Growth Trends by Industry
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Year-over-year growth analysis across all industries</p>
                  </div>
                  <ChartExportButton
                    chartId="chart-growth-trends"
                    chartTitle="Growth Trends by Industry"
                    buttonSize="xs"
                    data={growthData}
                    columns={[
                      { header: "Period", dataKey: "name" },
                    ]}
                    summaryText="Year-over-year startup growth trends by industry sector"
                    activeFilters={{ industry: selectedIndustry, govReg: selectedGovReg, trl: selectedTrlStage, metric: rankingMetric }}
                  />
                </div>
              </div>
              <div className="p-6">
                <div className="h-72">
                  {dashboardLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : growthData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={growthData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="name"
                          stroke="#9ca3af"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis
                          stroke="#9ca3af"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Legend
                          wrapperStyle={{ paddingTop: '20px' }}
                        />
                        {growthData.length > 0 &&
                          Object.keys(growthData[0])
                            .filter((key) => key !== "name")
                            .map((industry, index) => (
                              <Bar
                                key={industry}
                                dataKey={industry}
                                fill={COLORS[index % COLORS.length]}
                                radius={[4, 4, 0, 0]}
                                isAnimationActive={true}
                              />
                            ))}
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-600">No growth data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "active" && role === "ROLE_ADMIN" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className="border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 mr-2.5" />
                      Active Ecosystem Businesses & Researches
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Currently active startups, microenterprises, and research initiatives with verified activity within the past 90 days.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                      {activeBusinesses.length} Active Ventures
                    </span>
                  </div>
                </div>
              </div>

              {/* Informational Guidance Notice */}
              <div className="p-4 mx-6 mt-5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950">
                  <span className="font-bold">90-Day Inactivity Rule:</span> Ventures maintain active status by updating business metrics, funding, traction, or registration details. If a venture exceeds 90 days without any activity updates, it is flagged as inactive and automatically removed from the public 3D map.
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="p-6 pb-2">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search active businesses by name, industry, or location..."
                    value={activeSearch}
                    onChange={(e) => setActiveSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-gray-50/50 hover:bg-white"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="p-6 pt-2">
                {activeBusinesses.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No active businesses found matching the current criteria.
                  </div>
                ) : filteredActiveBusinesses.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No active businesses found matching "{activeSearch}".
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="px-3.5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Company / Venture</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Industry</th>
                            <th className="px-2.5 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">TRL Stage</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Location</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Activity Status</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contact</th>
                            <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {paginatedActiveBusinesses.map((startup) => (
                            <tr key={startup.id} className="hover:bg-emerald-50/40 transition-colors duration-150">
                              <td className="px-3.5 py-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {startup.companyLogo ? (
                                    <img src={startup.companyLogo} alt="" className="w-7 h-7 rounded-lg object-cover border border-gray-200 shrink-0" />
                                  ) : (
                                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                                      {(startup.companyName || "S").charAt(0)}
                                    </div>
                                  )}
                                  <div className="min-w-0 max-w-[180px] lg:max-w-[240px]">
                                    <p className="text-sm font-semibold text-gray-900 truncate" title={startup.companyName}>
                                      {startup.companyName}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate" title={startup.businessActivity || "Active Startup"}>
                                      {startup.businessActivity || "Active Startup"}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap">
                                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 inline-block max-w-[130px] truncate" title={startup.industry || "General"}>
                                  {startup.industry || "General"}
                                </span>
                              </td>
                              <td className="px-2.5 py-3 whitespace-nowrap text-center">
                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                  {startup.trlLevel || "TRL 1"}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-xs text-gray-600">
                                <span className="truncate block max-w-[100px]" title={startup.city || startup.locationName || "Philippines"}>
                                  {startup.city || startup.locationName || "Philippines"}
                                </span>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap">
                                <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1.5 w-fit border border-emerald-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                  <span>Active ({startup.daysSinceLastUpdate || 0}d ago)</span>
                                </span>
                              </td>
                              <td className="px-3 py-3 text-xs text-gray-600">
                                <p className="font-medium text-gray-800 truncate max-w-[130px]" title={startup.contactEmail || "No email"}>
                                  {startup.contactEmail || "No email"}
                                </p>
                                <p className="text-gray-400 truncate max-w-[130px]" title={startup.contactNumber || ""}>
                                  {startup.contactNumber || ""}
                                </p>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-center">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/startup/${startup.id}`)}
                                  className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer border border-emerald-200"
                                >
                                  View Profile
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <PaginationBar
                      page={activePage}
                      totalPages={totalActivePages}
                      totalItems={filteredActiveBusinesses.length}
                      onPageChange={setActivePage}
                      activeColor="emerald"
                      label="active ventures"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {(activeTab === "rankings" || role !== "ROLE_ADMIN") && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
              {/* Minimal Uniform Header Section */}
              <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                      <Award className="h-5 w-5 text-indigo-600 mr-2.5" />
                      Startup Rankings Leaderboard
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Comprehensive rankings by verified performance metrics and readiness levels
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-white text-indigo-700 border border-indigo-200 shadow-xs">
                      Ranked by: {rankingMetric.charAt(0).toUpperCase() + rankingMetric.slice(1)} Score
                    </span>
                  </div>
                </div>
              </div>

              {/* Table Section */}
              <div className="p-6">
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                      <p className="text-gray-600 font-medium text-lg">Loading rankings...</p>
                    </div>
                  ) : (
                    <>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                          <tr>
                            <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Rank</th>
                            <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Startup</th>
                            <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Industry</th>
                            <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              <div className="flex items-center gap-1">
                                <span>TRL</span>
                                <TooltipInfo type="TRL" size="xs" />
                              </div>
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              <div className="flex items-center gap-1">
                                <span>Govt. Reg</span>
                                <TooltipInfo type="GOV_REG" size="xs" />
                              </div>
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Overall</th>
                            <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Growth</th>
                            <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Investment</th>
                            <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Ecosystem</th>
                            <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Engagement</th>
                            {role === "ROLE_ADMIN" && (
                              <th className="px-5 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {rankedStartups.map((startup, index) => {
                            const rawTrl = String(startup.trlLevel || "");
                            const trlNum = parseInt(rawTrl.match(/\d/)?.[0] || "4", 10);
                            const isBir = startup.registrationAgency === "BIR";

                            return (
                              <tr key={startup.id} className="hover:bg-indigo-50/60 transition-colors duration-150">
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
                                      <span className="text-white font-bold text-sm">
                                        {currentPage * itemsPerPage + index + 1}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <div className="text-sm font-semibold text-gray-900">
                                    {startup.companyName}
                                  </div>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                    {startup.industry}
                                  </span>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <span className={`px-2.5 py-1 inline-flex items-center text-xs font-bold rounded-lg border ${trlNum >= 7
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : trlNum >= 4
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    }`}>
                                    TRL {trlNum}
                                  </span>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  {isBir ? (
                                    <span className="px-2.5 py-1 inline-flex items-center gap-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      Government Certified
                                    </span>
                                  ) : startup.isGovernmentRegistered || startup.registrationAgency ? (
                                    <span className="px-2.5 py-1 inline-flex items-center gap-1 text-xs font-semibold rounded-lg bg-gray-100 text-gray-800 border border-gray-200">
                                      <CheckCircle2 className="w-3 h-3 text-gray-600" />
                                      {startup.registrationAgency || "Registered"}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                      Unregistered
                                    </span>
                                  )}
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <span className="text-sm font-semibold text-gray-900 bg-indigo-50 px-2.5 py-1 rounded-lg">
                                    {startup.overallScore}
                                  </span>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <span className="text-sm font-semibold text-gray-900 bg-blue-50 px-2.5 py-1 rounded-lg">
                                    {startup.growthScore}
                                  </span>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <span className="text-sm font-semibold text-gray-900 bg-purple-50 px-2.5 py-1 rounded-lg">
                                    {startup.investmentScore}
                                  </span>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <span className="text-sm font-semibold text-gray-900 bg-pink-50 px-2.5 py-1 rounded-lg">
                                    {startup.ecosystemScore}
                                  </span>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <span className="text-sm font-semibold text-gray-900 bg-amber-50 px-2.5 py-1 rounded-lg">
                                    {startup.engagementScore}
                                  </span>
                                </td>
                                {role === "ROLE_ADMIN" && (
                                  <td className="px-5 py-4 whitespace-nowrap text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => navigate(`/startup/${startup.id}`)}
                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                        title="View startup details"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setDeleteConfirmStartup(startup)}
                                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                        title="Delete startup (Admin only)"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div className="mt-6">
                        <PaginationControls />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && role === "ROLE_ADMIN" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Startup Growth & Averaging Chart */}
            <div id="chart-monthly-growth" className="bg-white p-6 rounded-lg shadow lg:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-lg font-semibold text-blue-900">
                      Monthly Startup Growth & Growth Averaging
                    </h2>
                    <TooltipInfo type="CHART_MONTHLY_GROWTH" size="xs" />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    New startup registrations per month, cumulative ecosystem trajectory, and monthly growth averaging
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 self-start sm:self-auto">
                  Growth Momentum
                </span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyGrowthData} margin={{ top: 10, right: 30, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#475569" }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: "#10b981" }} unit="%" />
                    <Tooltip
                      formatter={(val, name) => {
                        if (name === "avgGrowthScore") return [`${val}%`, "Avg Growth Score"];
                        if (name === "totalStartups") return [`${val}`, "Cumulative Total"];
                        return [`${val}`, "New Startups"];
                      }}
                      contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.92)", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "12px", fontSize: "12px" }} />
                    <Line yAxisId="left" type="monotone" dataKey="newStartups" stroke="#3b82f6" strokeWidth={2.5} name="New Startups" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line yAxisId="left" type="monotone" dataKey="totalStartups" stroke="#6366f1" strokeWidth={2.5} name="Cumulative Total" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line yAxisId="right" type="monotone" dataKey="avgGrowthScore" stroke="#10b981" strokeWidth={2.5} strokeDasharray="4 4" name="Average Growth Score (%)" dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div id="chart-geo-distribution" className="bg-white p-6 rounded-lg shadow flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      <h2 className="text-lg font-semibold text-blue-900">
                        Geographical Distribution
                      </h2>
                      <TooltipInfo type="CHART_GEOGRAPHICAL" size="xs" />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {sortedLocationData.length} active cities across {totalGeoStartups} startups
                    </p>
                  </div>

                  {/* Toggle View Mode & Expand Controls */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <ChartExportButton
                      chartId="chart-geo-distribution"
                      chartTitle="Geographical Distribution"
                      buttonSize="xs"
                      data={sortedLocationData}
                      columns={[
                        { header: "City / Region", dataKey: "name" },
                        { header: "Startups", dataKey: "value" },
                        { header: "Share %", dataKey: "value", format: (val) => totalGeoStartups > 0 ? `${((val / totalGeoStartups) * 100).toFixed(1)}%` : "0%" },
                      ]}
                      summaryText={`${sortedLocationData.length} cities, ${totalGeoStartups} total startups mapped`}
                      activeFilters={{ industry: selectedIndustry, govReg: selectedGovReg, trl: selectedTrlStage, metric: rankingMetric }}
                    />
                    {geoViewMode === "bar" && sortedLocationData.length > 8 && (
                      <button
                        type="button"
                        onClick={() => setGeoShowAll((prev) => !prev)}
                        className="px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors cursor-pointer"
                        title={geoShowAll ? "Show Top 8 Cities" : "Show All Cities"}
                      >
                        {geoShowAll ? "Top 8" : `All (${sortedLocationData.length})`}
                      </button>
                    )}
                    <div className="inline-flex items-center p-0.5 bg-gray-100 rounded-lg border border-gray-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setGeoViewMode("bar")}
                        className={`px-2.5 py-0.5 rounded font-semibold text-xs transition-all cursor-pointer ${geoViewMode === "bar"
                          ? "bg-white text-indigo-700 shadow-2xs font-bold"
                          : "text-gray-600 hover:text-gray-900"
                          }`}
                      >
                        Ranked
                      </button>
                      <button
                        type="button"
                        onClick={() => setGeoViewMode("donut")}
                        className={`px-2.5 py-0.5 rounded font-semibold text-xs transition-all cursor-pointer ${geoViewMode === "donut"
                          ? "bg-white text-indigo-700 shadow-2xs font-bold"
                          : "text-gray-600 hover:text-gray-900"
                          }`}
                      >
                        Donut
                      </button>
                    </div>
                  </div>
                </div>

                <div className="h-72">
                  {dashboardLoading ? (
                    <div className="flex items-center justify-center h-full text-sm text-gray-500">
                      Loading location data...
                    </div>
                  ) : sortedLocationData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-sm text-gray-400">
                      No location data available
                    </div>
                  ) : geoViewMode === "bar" ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={barChartLocationData}
                        margin={{ top: 5, right: 35, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          tickLine={false}
                          axisLine={{ stroke: "#e2e8f0" }}
                          tick={{ fontSize: 11, fill: "#64748b" }}
                        />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={115}
                          tickLine={false}
                          axisLine={{ stroke: "#e2e8f0" }}
                          tick={{ fontSize: 11, fill: "#334155", fontWeight: 500 }}
                        />
                        <Tooltip
                          formatter={(val) => [
                            `${val} startup${val > 1 ? "s" : ""} (${totalGeoStartups > 0 ? ((val / totalGeoStartups) * 100).toFixed(1) : 0}%)`,
                            "Startups",
                          ]}
                          contentStyle={{
                            backgroundColor: "rgba(15, 23, 42, 0.92)",
                            borderRadius: "8px",
                            border: "none",
                            color: "#fff",
                            fontSize: "12px",
                            padding: "8px 12px",
                          }}
                          itemStyle={{ color: "#fff" }}
                        />
                        <Bar
                          dataKey="value"
                          radius={[0, 6, 6, 0]}
                          barSize={18}
                        >
                          {barChartLocationData.map((entry, index) => (
                            <Cell
                              key={`cell-bar-${index}`}
                              fill={entry.isOther ? "#94a3b8" : GEO_PALETTE[index % GEO_PALETTE.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 h-full">
                      {/* Donut Chart */}
                      <div className="w-full sm:w-1/2 h-48 sm:h-full relative flex items-center justify-center shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={donutLocationData}
                              cx="50%"
                              cy="50%"
                              innerRadius={52}
                              outerRadius={78}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {donutLocationData.map((entry, index) => (
                                <Cell
                                  key={`donut-cell-${index}`}
                                  fill={entry.isOther ? "#94a3b8" : GEO_PALETTE[index % GEO_PALETTE.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(val, name) => [
                                `${val} startup${val > 1 ? "s" : ""} (${totalGeoStartups > 0 ? ((val / totalGeoStartups) * 100).toFixed(1) : 0}%)`,
                                name,
                              ]}
                              contentStyle={{
                                backgroundColor: "rgba(15, 23, 42, 0.92)",
                                borderRadius: "8px",
                                border: "none",
                                color: "#fff",
                                fontSize: "12px",
                                padding: "8px 12px",
                              }}
                              itemStyle={{ color: "#fff" }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-xl font-black text-gray-900 leading-none">
                            {totalGeoStartups}
                          </span>
                          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">
                            Startups
                          </span>
                        </div>
                      </div>

                      {/* Clean Legend Breakdown List */}
                      <div className="w-full sm:w-1/2 overflow-y-auto max-h-56 pr-1 space-y-1.5 text-xs">
                        {donutLocationData.map((item, idx) => {
                          const pct = totalGeoStartups > 0 ? ((item.value / totalGeoStartups) * 100).toFixed(1) : 0;
                          return (
                            <div
                              key={item.name}
                              className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-gray-50/80 hover:bg-gray-100 transition-colors border border-gray-100"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{
                                    backgroundColor: item.isOther
                                      ? "#94a3b8"
                                      : GEO_PALETTE[idx % GEO_PALETTE.length],
                                  }}
                                />
                                <span className="truncate text-gray-700 font-medium" title={item.name}>
                                  {item.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                <span className="font-bold text-gray-900">{item.value}</span>
                                <span className="text-[10px] text-gray-400">({pct}%)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div id="chart-avg-industry" className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-lg font-semibold text-blue-900">
                    Average Scores by Industry
                  </h2>
                  <TooltipInfo type="CHART_AVERAGE_SCORES" size="xs" />
                </div>
                <ChartExportButton
                  chartId="chart-avg-industry"
                  chartTitle="Average Scores by Industry"
                  buttonSize="xs"
                  data={computedIndustryScores}
                  columns={[
                    { header: "Industry", dataKey: "name" },
                    { header: "Count", dataKey: "count" },
                    { header: "Overall Score", dataKey: "overallScore", format: (v) => `${v} / 100` },
                    { header: "Growth Score", dataKey: "growthScore", format: (v) => `${v} / 100` },
                    { header: "Ecosystem Score", dataKey: "ecosystemScore", format: (v) => `${v} / 100` },
                  ]}
                  summaryText="Average performance scores across all industries"
                  activeFilters={{ industry: selectedIndustry, govReg: selectedGovReg, trl: selectedTrlStage, metric: rankingMetric }}
                />
              </div>
              {computedIndustryScores.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  {dashboardLoading || topStartupsLoading ? "Loading data..." : "No industry score data available"}
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={computedIndustryScores} margin={{ top: 5, right: 15, left: -10, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: "#475569" }}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={40}
                      />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} />
                      <Tooltip
                        formatter={(val) => [`${val} / 100`, "Avg Score"]}
                        contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.92)", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }}
                      />
                      <Bar dataKey="overallScore" fill="#8884d8" radius={[4, 4, 0, 0]}>
                        {computedIndustryScores.map((entry, index) => (
                          <Cell key={`cell-ov-${index}`} fill={entry.color || "#8884d8"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div id="chart-growth-industry" className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold text-blue-900">
                    Growth Score by Industry
                  </h2>
                  <TooltipInfo type="CHART_GROWTH_SCORE" size="xs" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                    TRL Readiness Basis
                  </span>
                  <ChartExportButton
                    chartId="chart-growth-industry"
                    chartTitle="Growth Score by Industry"
                    buttonSize="xs"
                    data={computedIndustryScores}
                    columns={[
                      { header: "Industry", dataKey: "name" },
                      { header: "Count", dataKey: "count" },
                      { header: "Growth Score", dataKey: "growthScore", format: (v) => `${v} / 100` },
                    ]}
                    summaryText="Growth performance benchmark scores by industry sector"
                    activeFilters={{ industry: selectedIndustry, govReg: selectedGovReg, trl: selectedTrlStage, metric: rankingMetric }}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Based on TRL stage readiness of all {totalStartups || allBusinesses.length || 50} businesses
              </p>
              {computedIndustryScores.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  {dashboardLoading || topStartupsLoading ? "Loading data..." : "No industry score data available"}
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={computedIndustryScores} margin={{ top: 5, right: 15, left: -10, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: "#475569" }}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={40}
                      />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} />
                      <Tooltip
                        formatter={(val) => [`${val} / 100`, "Growth Score"]}
                        contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.92)", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }}
                      />
                      <Bar dataKey="growthScore" fill="#00C49F" radius={[4, 4, 0, 0]}>
                        {computedIndustryScores.map((entry, index) => (
                          <Cell key={`cell-gw-${index}`} fill={entry.color || "#00C49F"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div id="chart-ecosystem-industry" className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-lg font-semibold text-blue-900">
                    Ecosystem Score by Industry
                  </h2>
                  <TooltipInfo type="CHART_ECOSYSTEM_SCORE" size="xs" />
                </div>
                <ChartExportButton
                  chartId="chart-ecosystem-industry"
                  chartTitle="Ecosystem Score by Industry"
                  buttonSize="xs"
                  data={computedIndustryScores}
                  columns={[
                    { header: "Industry", dataKey: "name" },
                    { header: "Count", dataKey: "count" },
                    { header: "Ecosystem Score", dataKey: "ecosystemScore", format: (v) => `${v} / 100` },
                  ]}
                  summaryText="Ecosystem health scores across industry sectors"
                  activeFilters={{ industry: selectedIndustry, govReg: selectedGovReg, trl: selectedTrlStage, metric: rankingMetric }}
                />
              </div>
              {computedIndustryScores.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  {dashboardLoading || topStartupsLoading ? "Loading data..." : "No industry score data available"}
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={computedIndustryScores} margin={{ top: 5, right: 15, left: -10, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: "#475569" }}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={40}
                      />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} />
                      <Tooltip
                        formatter={(val) => [`${val} / 100`, "Ecosystem Score"]}
                        contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.92)", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }}
                      />
                      <Bar dataKey="ecosystemScore" fill="#FFBB28" radius={[4, 4, 0, 0]}>
                        {computedIndustryScores.map((entry, index) => (
                          <Cell key={`cell-eco-${index}`} fill={entry.color || "#FFBB28"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Government Registration & Compliance Distribution Chart */}
            <div id="chart-gov-compliance" className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold text-blue-900">
                    Government Certified & Compliance Status
                  </h2>
                  <TooltipInfo type="CHART_GOV_COMPLIANCE" size="xs" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Agencies
                  </span>
                  <ChartExportButton
                    chartId="chart-gov-compliance"
                    chartTitle="Government Compliance Status"
                    buttonSize="xs"
                    data={computedGovCompliance}
                    columns={[
                      { header: "Agency / Status", dataKey: "name" },
                      { header: "Startups", dataKey: "count" },
                    ]}
                    summaryText="Distribution of government registration and compliance certifications"
                    activeFilters={{ industry: selectedIndustry, govReg: selectedGovReg, trl: selectedTrlStage, metric: rankingMetric }}
                  />
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={computedGovCompliance} margin={{ top: 5, right: 15, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#475569" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip
                      formatter={(value) => [`${value} Startups`, "Count"]}
                      contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.92)", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {computedGovCompliance.map((entry, idx) => (
                        <Cell key={`gov-bar-${idx}`} fill={entry.fill || "#3b82f6"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Technology Readiness Level (TRL) Breakdown Chart */}
            <div id="chart-trl-stages" className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-blue-900">
                    Technology Readiness (TRL) Stages
                  </h2>
                  <TooltipInfo type="CHART_TRL_STAGES" size="xs" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Levels 1 - 9 · Click bar to view list
                  </span>
                  <ChartExportButton
                    chartId="chart-trl-stages"
                    chartTitle="Technology Readiness Stages"
                    buttonSize="xs"
                    data={computedTrlStages}
                    columns={[
                      { header: "TRL Stage", dataKey: "stage" },
                      { header: "Startups", dataKey: "startups" },
                    ]}
                    summaryText="Distribution of startups across TRL maturity stages (Concept → Commercial)"
                    activeFilters={{ industry: selectedIndustry, govReg: selectedGovReg, trl: selectedTrlStage, metric: rankingMetric }}
                  />
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={computedTrlStages} margin={{ top: 5, right: 15, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="stage" tick={{ fontSize: 10, fill: "#475569" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip
                      formatter={(value) => [`${value} Startups (Click to view list)`, "Ecosystem Startups"]}
                      contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.92)", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }}
                    />
                    <Bar
                      dataKey="startups"
                      radius={[6, 6, 0, 0]}
                      onClick={(entry) => setSelectedTrlModal(entry)}
                      className="cursor-pointer hover:opacity-85 transition-opacity"
                    >
                      {computedTrlStages.map((entry, idx) => (
                        <Cell key={`trl-${idx}`} fill={entry.fill || "#10b981"} className="cursor-pointer" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === "archive" && role === "ROLE_ADMIN" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className="border-b border-gray-200 bg-gradient-to-r from-amber-50 to-rose-50 px-6 py-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                      <Trash2 className="h-5 w-5 text-rose-600 mr-2.5" />
                      Inactive & Archived Ventures Directory
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Startups and research projects inactive for more than 90 days. Automatically removed from the public map and moved to the archive.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={inactivityActionLoading}
                      onClick={handleTriggerLifecycleCheck}
                      className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${inactivityActionLoading ? "animate-spin" : ""}`} />
                      <span>Run Lifecycle Check</span>
                    </button>
                    <span className="px-3 py-2 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold border border-rose-300">
                      {archivedBusinesses.length} Inactive / Archived
                    </span>
                  </div>
                </div>
              </div>

              {/* Inactivity Policy Alert Banner */}
              <div className="p-4 mx-6 mt-5 bg-rose-50/80 border border-rose-200 rounded-xl flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-950 space-y-1">
                  <p className="font-bold text-rose-900">Automatic Inactivity & Archival Lifecycle Rules:</p>
                  <p>• <span className="font-semibold">90 Days Inactive:</span> Venture is marked Inactive, hidden from the public 3D map, and an initial warning notice is dispatched.</p>
                  <p>• <span className="font-semibold">97 Days Inactive (7 days grace period):</span> Venture is permanently moved to the Archive page. Click "Send Warning Email" to issue immediate email alerts or "Reactivate" to restore it to the active ecosystem and map.</p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="p-6 pb-2">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search inactive or archived ventures by name, industry, or email..."
                    value={archiveSearch}
                    onChange={(e) => setArchiveSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all bg-gray-50/50 hover:bg-white"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="p-6 pt-2">
                {archivedBusinesses.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="font-semibold text-gray-700">No inactive or archived ventures found.</p>
                    <p className="text-xs text-gray-400 mt-1">All startups in your ecosystem have active status within 90 days.</p>
                  </div>
                ) : filteredArchivedBusinesses.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="font-semibold text-gray-700">No inactive or archived ventures found matching "{archiveSearch}".</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="px-3.5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Company</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Industry</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Inactivity Period</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Map Status</th>
                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contact & Email Notice</th>
                            <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {paginatedArchivedBusinesses.map((startup) => {
                            const days = Number(startup.daysSinceLastUpdate || 91);
                            const isArchivedPermanent = startup.isArchived || startup.activityStatus === "ARCHIVED" || days > 97;
                            return (
                              <tr key={startup.id} className="hover:bg-rose-50/30 transition-colors duration-150">
                                <td className="px-3.5 py-3">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-xs shrink-0">
                                      {(startup.companyName || "S").charAt(0)}
                                    </div>
                                    <div className="min-w-0 max-w-[180px] lg:max-w-[220px]">
                                      <p className="text-sm font-semibold text-gray-900 truncate" title={startup.companyName}>{startup.companyName}</p>
                                      <p className="text-xs text-gray-500 truncate" title={startup.city || "Philippines"}>{startup.city || "Philippines"}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap">
                                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 inline-block max-w-[130px] truncate" title={startup.industry || "General"}>
                                    {startup.industry || "General"}
                                  </span>
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap">
                                  <span className={`px-2 py-0.5 text-xs rounded-full font-bold border ${isArchivedPermanent ? "bg-rose-100 text-rose-800 border-rose-300" : "bg-amber-100 text-amber-800 border-amber-300"
                                    }`}>
                                    {days}d ({isArchivedPermanent ? "Archived" : "Warning Grace"})
                                  </span>
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap">
                                  <span className="text-xs text-rose-700 font-semibold px-2 py-0.5 rounded bg-rose-50 border border-rose-200">
                                    Hidden from Map
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-xs text-gray-600">
                                  <p className="font-medium text-gray-900 truncate max-w-[140px]" title={startup.contactEmail || "No email"}>{startup.contactEmail || "No email"}</p>
                                  <p className="text-[11px] text-gray-500 truncate max-w-[140px]">
                                    {startup.lastInactivityEmailSent
                                      ? `Notice: ${String(startup.lastInactivityEmailSent).slice(0, 10)}`
                                      : "No notice sent yet"}
                                  </p>
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      disabled={inactivityActionLoading}
                                      onClick={() => handleSendInactivityWarning(startup.id, startup.companyName)}
                                      className="px-2 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer border border-amber-200 disabled:opacity-50"
                                      title="Send warning email alert to founder"
                                    >
                                      Warn
                                    </button>
                                    <button
                                      type="button"
                                      disabled={inactivityActionLoading}
                                      onClick={() => handleReactivateStartup(startup.id, startup.companyName)}
                                      className="px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer border border-emerald-200 disabled:opacity-50"
                                      title="Reactivate and restore to public map"
                                    >
                                      Reactivate
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/startup/${startup.id}`)}
                                      className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                      title="View details"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <PaginationBar
                      page={archivePage}
                      totalPages={totalArchivedPages}
                      totalItems={filteredArchivedBusinesses.length}
                      onPageChange={setArchivePage}
                      activeColor="rose"
                      label="archived ventures"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="grid grid-cols-1 gap-6">
            {/* Available Reports Section - Enhanced with real data */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4 text-blue-900">
                Startup Ecosystem Reports
              </h2>
              {reportsLoading ? (
                <div className="text-center py-6">Loading reports...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedReports.map((report) => (
                    <div
                      key={report.id}
                      className={`border rounded-lg p-4 ${report.isCustom
                        ? "bg-indigo-50 border-indigo-200"
                        : "hover:bg-indigo-50"
                        } transition-colors duration-150`}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium mb-2 text-blue-900">
                          {report.title}
                        </h3>
                        <div className="p-2 bg-blue-100 rounded text-xs font-bold text-blue-800">
                          {report.type.toUpperCase()}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {report.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {report.date}
                        </p>
                        <button
                          className="rounded-md p-2 flex items-center text-indigo-600 text-sm font-medium hover:text-indigo-800 hover:bg-indigo-200 cursor-pointer"
                          onClick={() => downloadReport(report)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Report Builder - Enhanced with real data */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center mb-4 text-blue-900">
                <FileText className="h-6 w-6 mr-2" />
                <h2 className="text-xl font-bold">Custom Report Builder</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <select
                    className="w-full border rounded p-2 text-blue-900"
                    name="industry"
                    value={reportFormData.industry}
                    onChange={handleReportFormChange}
                  >
                    <option>All Industries</option>
                    {industries.map((industry, index) => (
                      <option key={index} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region
                  </label>
                  <select
                    className="w-full border rounded p-2 text-blue-900"
                    name="region"
                    value={reportFormData.region}
                    onChange={handleReportFormChange}
                    disabled={psgcLoading}
                  >
                    <option value="All Regions">All Regions</option>
                    {psgcLoading ? (
                      <option value="" disabled>Loading regions...</option>
                    ) : (
                      availableRegions.map((region, index) => (
                        <option key={region.code || index} value={region.name || region}>
                          {region.regionName || region.name || region}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Period
                  </label>
                  <select
                    className="w-full border rounded p-2 text-blue-900"
                    name="timePeriod"
                    value={reportFormData.timePeriod}
                    onChange={handleReportFormChange}
                  >
                    <option>2025 (YTD)</option>
                    <option>2024</option>
                    <option>2023</option>
                    <option>Last 3 Years</option>
                    <option>Last 5 Years</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <BarChart2 className="h-4 w-4 mr-1" />
                  Metrics to Include
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-black">
                  {[
                    "Growth Rate",
                    "Funding Amount",
                    "Survival Rate",
                    "Employment Data",
                    "Investment Rounds",
                    "Foreign Investment",
                    "Government Support",
                    "Mentorship Data",
                    "Public-Private Partnerships",
                  ].map((metric, index) => (
                    <div key={index} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`metric-${index}`}
                        className="mr-2"
                        checked={reportFormData.metrics.includes(metric)}
                        onChange={() => handleMetricChange(metric)}
                      />
                      <label htmlFor={`metric-${index}`} className="text-sm">
                        {metric}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                  <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                    <Zap className="h-4 w-4 mr-1" />
                    Report Preview
                  </h4>
                  <div className="text-sm text-blue-700">
                    {reportFormData.metrics.length === 0 ? (
                      <p>Select at least one metric to generate a report</p>
                    ) : (
                      <p>
                        Your custom report will include data for{" "}
                        <strong>{reportFormData.industry}</strong> in{" "}
                        <strong>{reportFormData.region}</strong> during{" "}
                        <strong>{reportFormData.timePeriod}</strong> with
                        analysis of{" "}
                        <strong>{reportFormData.metrics.length} metrics</strong>
                        .
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  className={`flex items-center px-4 py-2 rounded text-white ${reportFormData.metrics.length === 0 || reportsLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-500"
                    }`}
                  disabled={
                    reportFormData.metrics.length === 0 || reportsLoading
                  }
                  onClick={generateCustomReport}
                >
                  {reportsLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Custom Report
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4 text-blue-900">
                Report Analytics
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-md font-semibold mb-3 text-blue-900">
                    Industry Distribution in Reports
                  </h3>
                  <div className="h-64">
                    {reportsLoading ? (
                      <div className="text-center py-6">Loading data...</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={industryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {industryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-semibold mb-3 text-blue-900">
                    Growth Trends
                  </h3>
                  <div className="h-64">
                    {dashboardLoading ? (
                      <div className="text-center py-6">
                        Loading growth data...
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={growthData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          {growthData.length > 0 &&
                            Object.keys(growthData[0])
                              .filter((key) => key !== "name")
                              .slice(0, 3)
                              .map((industry, index) => (
                                <Bar
                                  key={industry}
                                  dataKey={industry}
                                  fill={COLORS[index % COLORS.length]}
                                  radius={[4, 4, 0, 0]}
                                />
                              ))}
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-md font-semibold mb-3 text-blue-900">
                  Recent Report Activity
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Report Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Generated
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Downloads
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {generatedReports.slice(0, 5).map((report) => (
                        <tr key={report.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {report.title}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {report.date}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {report.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {Math.floor(Math.random() * 50) + 1}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "review" && (
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4 text-blue-900 flex items-center justify-between">
              <div>
                Startup Review
                {location.state?.startupName && (
                  <span className="ml-2 text-base font-normal text-amber-600">
                    (Reviewing: {location.state.startupName})
                  </span>
                )}
              </div>
              <button
                onClick={refreshDashboard}
                className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-md flex items-center hover:bg-blue-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 12a9 9 0 0 0 6.7 15L13 21"></path><path d="M14 18H8"></path><path d="M17 14h-3"></path></svg>
                Refresh Data
              </button>
            </h2>

            <div className="bg-white rounded-lg shadow">
              <div className="p-5 border-b border-gray-200">
                <h3 className="text-md font-medium text-gray-800 mb-4">Filter Startups for Review</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-medium text-gray-600">Industry</label>
                    <select
                      className="border-gray-300 border rounded-md p-2 text-sm w-44 text-gray-800"
                      value={selectedIndustry}
                      onChange={(e) => setSelectedIndustry(e.target.value)}
                    >
                      <option value="All">All Industries</option>
                      {industries.map((industry, index) => (
                        <option key={index} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-medium text-gray-600">Region</label>
                    <select
                      className="border-gray-300 border rounded-md p-2 text-sm w-44 text-gray-800"
                      value={reviewSelectedRegion}
                      onChange={(e) =>
                        setReviewSelectedRegion(e.target.value)
                      }
                      disabled={psgcLoading}
                    >
                      <option value="All Regions">All Regions</option>
                      {psgcLoading ? (
                        <option value="" disabled>Loading regions...</option>
                      ) : (
                        availableRegions.map((region, index) => (
                          <option key={region.code || index} value={region.name || region}>
                            {region.regionName || region.name || region}
                          </option>
                        ))
                      )}
                    </select>
                    {psgcLoading && (
                      <div className="absolute right-10 top-2.5">
                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-medium text-gray-600">Status</label>
                    <select
                      className="border-gray-300 border rounded-md p-2 text-sm w-44 text-gray-800"
                      value={reviewFilterStatus}
                      onChange={(e) => setReviewFilterStatus(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="In Review">Pending Review</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Needs Revision</option>
                    </select>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-medium text-gray-600">Search</label>
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search startups..."
                        className="pl-9 pr-4 py-2 border border-gray-300 text-gray-800 rounded-md text-sm w-64"
                        value={reviewSearchQuery}
                        onChange={(e) => setReviewSearchQuery(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleReviewFilter();
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-end space-x-2 ml-auto">
                    <button
                      onClick={resetReviewFilters}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-100 transition-colors"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleReviewFilter}
                      disabled={reviewLoading}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm flex items-center hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
                    >
                      {reviewLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Filtering...
                        </>
                      ) : (
                        <>
                          <Filter className="h-4 w-4 mr-1" />
                          Apply Filters
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-5">
                {reviewLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mr-2"></div>
                    <p className="text-gray-600">Loading startups for review...</p>
                  </div>
                ) : (
                  <StartupReviewSection
                    startupId={selectedReviewStartupId}
                    industry={selectedIndustry}
                    region={reviewSelectedRegion}
                    status={reviewFilterStatus}
                    actorType={reviewActorFilter}
                    searchQuery={reviewSearchQuery}
                    filteredStartups={filteredStartups.length > 0 ? filteredStartups : null}
                    onRefresh={handleReviewFilter}
                  />
                )}
              </div>
            </div>

            {/* 
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Pending Reviews</h3>
                <div className="flex items-center">
                  <div className="p-2 bg-amber-100 rounded mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  </div>
                  <span className="text-xl font-semibold text-gray-800">
                    {filteredStartups.filter(s => s.reviewStatus === "pending")?.length || 0}
                  </span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Approved Startups</h3>
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                  <span className="text-xl font-semibold text-gray-800">
                    {filteredStartups.filter(s => s.reviewStatus === "approved")?.length || 0}
                  </span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Needs Revision</h3>
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                  </div>
                  <span className="text-xl font-semibold text-gray-800">
                    {filteredStartups.filter(s => s.reviewStatus === "rejected")?.length || 0}
                  </span>
                </div>
              </div>
            </div>
             */}
          </div>
        )}

        {/* Delete Confirmation Modal for Admin */}
        {deleteConfirmStartup && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-scaleUp">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center">
                Delete Startup?
              </h3>
              <p className="text-sm text-gray-600 text-center mt-2 leading-relaxed">
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold text-gray-900">
                  "{deleteConfirmStartup.companyName}"
                </span>
                ? All associated records, metrics, and engagement data will be permanently removed. This action cannot be undone.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => !isDeletingStartup && setDeleteConfirmStartup(null)}
                  disabled={isDeletingStartup}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteStartup}
                  disabled={isDeletingStartup}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-md shadow-red-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeletingStartup ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete Startup</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Technology Readiness Level (TRL) Startup List Pop-up Modal */}
        {selectedTrlModal && (
          <div
            className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn"
            onClick={() => setSelectedTrlModal(null)}
          >
            <div
              className="relative w-full max-w-xl bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-200 flex flex-col max-h-[85vh] overflow-hidden my-auto animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50">
                <div>
                  <h3 className="font-bold text-gray-900 text-base sm:text-lg flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600" />
                    <span>{selectedTrlModal.stage} Businesses & Startups</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {selectedTrlModal.startupList?.length || selectedTrlModal.count || selectedTrlModal.startups || 0} Listed
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Verified enterprises, prototypes, and research at Technology Readiness Level {selectedTrlModal.level || selectedTrlModal.stage}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTrlModal(null)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Startup List */}
              <div className="p-6 overflow-y-auto space-y-3 flex-1 divide-y divide-gray-100">
                {selectedTrlModal.startupList && selectedTrlModal.startupList.length > 0 ? (
                  selectedTrlModal.startupList.map((item, idx) => (
                    <div key={item.id || idx} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900 truncate">
                            {item.companyName}
                          </h4>
                          {item.status && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.status === "Approved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                              }`}>
                              {item.status}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-xs text-gray-500">
                          {item.industry && <span className="font-semibold text-indigo-600">{item.industry}</span>}
                          {item.city && <span>• {item.city}</span>}
                          {item.contactEmail && <span>• {item.contactEmail}</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTrlModal(null);
                          navigate(`/startup/${item.id}`);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer shrink-0 border border-indigo-200"
                      >
                        View Profile
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-gray-500 text-sm">
                    No startups currently registered at this TRL level.
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedTrlModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white p-4 border-t">
        <div className="text-center text-sm text-gray-500">
          © 2025 StartupSphere Philippines | Supporting DTI, DICT, and DOST
        </div>
      </footer>

      {/* Export Report Modal */}
      <ExportReportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        activeFilters={{
          industry: selectedIndustry !== "All" ? selectedIndustry : undefined,
          govReg: selectedGovReg !== "All" ? selectedGovReg : undefined,
          trl: selectedTrlStage !== "All" ? selectedTrlStage : undefined,
          metric: rankingMetric,
        }}
        kpis={{
          totalStartups,
          formattedFunding: formatFundingAmount(calculatedTotalFunding),
          avgScore: rankedStartups.length > 0
            ? Math.round(rankedStartups.reduce((s, r) => s + (r.overallScore || 0), 0) / rankedStartups.length)
            : 0,
          complianceRate: topStartups.length > 0
            ? Math.round(
                (topStartups.filter(s =>
                  Boolean(s.isGovernmentRegistered) ||
                  (s.registrationAgency && !["Unregistered", ""].includes(s.registrationAgency))
                ).length / topStartups.length) * 100
              )
            : 0,
        }}
        geoData={sortedLocationData}
        industryScores={computedIndustryScores}
        govCompliance={computedGovCompliance}
        trlStages={computedTrlStages}
        topStartups={topStartups}
        chartContainerIds={{
          geo: "chart-geo-distribution",
          avgIndustry: "chart-avg-industry",
          growthIndustry: "chart-growth-industry",
          govReg: "chart-gov-compliance",
          trl: "chart-trl-stages",
        }}
      />
    </div>
  );
}
