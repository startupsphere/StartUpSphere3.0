import { getBackendUrl } from "../config/apiConfig";
import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  BarChart,
  Bar,
  Line,
  AreaChart,
  Area,
  ComposedChart,
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
  Clock,
  AlertTriangle,
  Archive,
  Mail,
  EyeOff,
  RefreshCw,
  Building2,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import TooltipInfo from "../components/TooltipInfo";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ToastContainer, toast } from "react-toastify";
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
  const [rankingSearchQuery, setRankingSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0); // Changed to 0-based for API
  const itemsPerPage = 10;
  const [totalPagesState, setTotalPagesState] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
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

  // Cache for startup locations to avoid repeated fetching
  const [startupLocationsCache, setStartupLocationsCache] = useState(null);
  const [industriesCache, setIndustriesCache] = useState(null);
  const [topStartupsCache, setTopStartupsCache] = useState(null);

  // New state for dashboard analytics data
  const [growthData, setGrowthData] = useState([]);
  const [fundingData, setFundingData] = useState([]);
  const [locationData, setLocationData] = useState([]);
  const [monthlyGrowthData, setMonthlyGrowthData] = useState([]);
  const [backendTrlStages, setBackendTrlStages] = useState([]);
  const [backendGovCompliance, setBackendGovCompliance] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [growthTimeframe, setGrowthTimeframe] = useState("6M"); // "6M" | "12M" | "ALL"
  const [allEcosystemStartups, setAllEcosystemStartups] = useState([]);

  // New state for chart filtering and interaction
  const [selectedChartIndustry, setSelectedChartIndustry] = useState(null);
  const [selectedFundingStage, setSelectedFundingStage] = useState(null);
  const [hoveredIndustry, setHoveredIndustry] = useState(null);
  const [hoveredFundingStage, setHoveredFundingStage] = useState(null);

  // New states for Reports tab
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
  const [availableRegions, setAvailableRegions] = useState([]);

  // Add these new state variables at the top of your component with other state declarations
  const [psgcRegions, setPsgcRegions] = useState([]);
  const [psgcLoading, setPsgcLoading] = useState(false);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  const [role, setRole] = useState(null);
  const [deleteConfirmStartup, setDeleteConfirmStartup] = useState(null);
  const [isDeletingStartup, setIsDeletingStartup] = useState(false);

  // Activity Directory States (Active, Inactive, Archive lifecycle)
  const [activityList, setActivityList] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activitySearch, setActivitySearch] = useState("");
  const [activityIndustry, setActivityIndustry] = useState("All");
  const [activityPage, setActivityPage] = useState(0);
  const [activityTotalPages, setActivityTotalPages] = useState(0);
  const [activityTotalElements, setActivityTotalElements] = useState(0);
  const [activitySummary, setActivitySummary] = useState({
    activeCount: 0,
    inactiveCount: 0,
    archivedCount: 0,
    totalApproved: 0,
  });
  const [sendingEmailId, setSendingEmailId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [manualCheckLoading, setManualCheckLoading] = useState(false);

  const fetchActivitySummary = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${getBackendUrl()}/startups/activity-directory?category=all&page=0&size=1`, {
        headers,
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.summary) {
          setActivitySummary(data.summary);
        }
      }
    } catch (e) {
      console.error("Error loading activity summary", e);
    }
  };

  const fetchActivityDirectory = async () => {
    if (!["active", "inactive", "archive"].includes(activeTab)) return;
    setActivityLoading(true);
    try {
      const categoryParam =
        activeTab === "active"
          ? "ACTIVE"
          : activeTab === "inactive"
            ? "INACTIVE"
            : "ARCHIVED";
      const params = new URLSearchParams({
        category: categoryParam,
        page: activityPage,
        size: itemsPerPage,
      });
      if (activitySearch.trim()) {
        params.append("search", activitySearch.trim());
      }
      if (activityIndustry && activityIndustry !== "All") {
        params.append("industry", activityIndustry);
      }

      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(
        `${getBackendUrl()}/startups/activity-directory?${params.toString()}`,
        { headers, credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch activity directory");
      const data = await res.json();
      setActivityList(data.content || []);
      setActivityTotalPages(data.totalPages || 0);
      setActivityTotalElements(data.totalElements || 0);
      if (data.summary) {
        setActivitySummary(data.summary);
      }
    } catch (err) {
      console.error("Error fetching activity directory:", err);
      toast.error("Failed to load businesses directory");
    } finally {
      setActivityLoading(false);
    }
  };

  const handleSendInactivityReminder = async (startup) => {
    setSendingEmailId(startup.id);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(
        `${getBackendUrl()}/startups/${startup.id}/send-inactivity-reminder`,
        {
          method: "POST",
          headers,
          credentials: "include",
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Inactivity notice emailed to ${startup.companyName}!`);
        fetchActivityDirectory();
        fetchActivitySummary();
      } else {
        toast.error(data.message || "Failed to send notice email.");
      }
    } catch (e) {
      toast.error("Network error sending notice email.");
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleArchiveBusiness = async (startup) => {
    if (
      !window.confirm(
        `Are you sure you want to move "${startup.companyName}" to Archive? This business will be hidden from the public map.`
      )
    ) {
      return;
    }
    setActionLoadingId(startup.id);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(
        `${getBackendUrl()}/startups/${startup.id}/archive`,
        {
          method: "POST",
          headers,
          credentials: "include",
        }
      );
      if (res.ok) {
        toast.success(
          `"${startup.companyName}" moved to Archive and hidden from the map.`
        );
        fetchActivityDirectory();
        fetchActivitySummary();
      } else {
        toast.error("Failed to archive startup.");
      }
    } catch (e) {
      toast.error("Error archiving startup.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReactivateBusiness = async (startup) => {
    setActionLoadingId(startup.id);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(
        `${getBackendUrl()}/startups/${startup.id}/reactivate`,
        {
          method: "POST",
          headers,
          credentials: "include",
        }
      );
      if (res.ok) {
        toast.success(
          `"${startup.companyName}" reactivated successfully! Restored to the interactive map.`
        );
        fetchActivityDirectory();
        fetchActivitySummary();
      } else {
        toast.error("Failed to reactivate startup.");
      }
    } catch (e) {
      toast.error("Error reactivating startup.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRunLifecycleCheck = async () => {
    setManualCheckLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(
        `${getBackendUrl()}/startups/check-inactivity-lifecycle`,
        {
          method: "POST",
          headers,
          credentials: "include",
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Inactivity lifecycle check completed.");
        fetchActivityDirectory();
        fetchActivitySummary();
      } else {
        toast.error("Failed to execute lifecycle check.");
      }
    } catch (e) {
      toast.error("Error running lifecycle check.");
    } finally {
      setManualCheckLoading(false);
    }
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "N/A";
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  useEffect(() => {
    fetchActivitySummary();
  }, []);

  useEffect(() => {
    if (["active", "inactive", "archive"].includes(activeTab)) {
      fetchActivityDirectory();
    }
  }, [activeTab, activityPage, activityIndustry]);

  useEffect(() => {
    if (!["active", "inactive", "archive"].includes(activeTab)) return;
    const timer = setTimeout(() => {
      fetchActivityDirectory();
    }, 350);
    return () => clearTimeout(timer);
  }, [activitySearch]);

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
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard analytics");
        }

        const data = await response.json();
        setGrowthData(data.growthData);
        setFundingData(data.fundingData);
        setLocationData(data.locationData);
        if (data.monthlyGrowth) {
          setMonthlyGrowthData(data.monthlyGrowth);
        }
        if (data.trlStages) {
          setBackendTrlStages(data.trlStages);
        }
        if (data.govCompliance) {
          setBackendGovCompliance(data.govCompliance);
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

    const fetchAllStartupsForAnalytics = async () => {
      try {
        const response = await fetch(
          `${getBackendUrl()}/startups?page=0&size=1000&sortBy=companyName&sortDir=ASC`,
          { credentials: "include" }
        );
        if (response.ok) {
          const data = await response.json();
          const items = data.content || (Array.isArray(data) ? data : []);
          setAllEcosystemStartups(items);
          setTotalStartups(data.totalElements || items.length);
        }
      } catch (err) {
        console.error("Failed to fetch all startups for analytics:", err);
      }
    };

    fetchDashboardAnalytics();
    fetchAllStartupsForAnalytics();
    fetchRole();
  }, [selectedIndustry, selectedGovReg, selectedTrlStage, refreshTrigger]);

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
            credentials: "include",
          }
        );
        if (!response.ok) {
          // Fallback to /api/rankings/top if needed
          response = await fetch(
            `${getBackendUrl()}/api/rankings/top?${params.toString()}`,
            {
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
          // Get overall score from various possible field names
          const overallScore = startup.overallScore ?? startup.score ?? 0;
          const growthRate = startup.growthScore ?? startup.growthRate ?? 0;

          return {
            ...startup,
            overallScore: Number(overallScore),
            growthScore: Number(growthRate)
          };
        });

        // Validate that we have startup data
        if (!normalizedStartups || normalizedStartups.length === 0) {
          console.warn("No startups returned from API for industry:", selectedIndustry);
        }

        setTopStartups(normalizedStartups);
        setAllEcosystemStartups((prev) => (prev.length > 0 ? prev : normalizedStartups));
        setTopStartupsError(null);

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

      // Scroll to top when page changes for better UX
      window.scrollTo({ top: 0, behavior: 'smooth' });

      try {
        // Get rankings with pagination
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
        if (rankingSearchQuery && rankingSearchQuery.trim()) {
          params.append("search", rankingSearchQuery.trim());
        }

        const url = `${getBackendUrl()}/api/rankings?${params.toString()}`;

        // Parallel fetch: rankings + location cache (only if not cached)
        const fetchPromises = [fetch(url, { credentials: "include" })];

        // Only fetch locations if not already cached
        if (!startupLocationsCache) {
          fetchPromises.push(
            fetch(
              `${getBackendUrl()}/startups?page=0&size=1000&sortBy=companyName&sortDir=ASC`,
              { credentials: "include" }
            )
          );
        }

        const responses = await Promise.all(fetchPromises);

        if (!responses[0].ok) {
          throw new Error("Failed to fetch rankings");
        }

        const data = await responses[0].json();
        if (data.totalFunding !== undefined && data.totalFunding !== null) {
          setEcosystemTotalFunding(Number(data.totalFunding));
        }

        // Cache locations if fetched
        if (responses[1]) {
          if (responses[1].ok) {
            const locationsData = await responses[1].json();
            const startUpList = locationsData.content || [];
            if (startUpList.length > 0) {
              setAllEcosystemStartups(startUpList);
            }
            const locationsMap = {};
            let fundingFromAll = 0;
            startUpList.forEach(startup => {
              locationsMap[startup.id] = startup.city || "Unknown";
              fundingFromAll += Number(startup.totalStartupFundingReceived || startup.totalFunding || 0);
            });
            setStartupLocationsCache(locationsMap);
            setTotalStartups(locationsData.totalElements || 0);
            if (fundingFromAll > 0) {
              setEcosystemTotalFunding(prev => Math.max(prev, fundingFromAll));
            }

            // Cache available regions
            const uniqueCities = [...new Set(Object.values(locationsMap))].filter(Boolean);
            setAvailableRegions(uniqueCities);
          }
        }

        // Extract rankings from paginated response
        const rankings = data.content || [];

        // Process startups with city information using cache
        const processedStartups = rankings.map((startup) => {
          return {
            ...startup,
            locationName: startupLocationsCache ? startupLocationsCache[startup.id] || "Unknown" : "Unknown",
          };
        });

        setRankedStartups(processedStartups);

        // Update pagination state from API response
        setTotalPagesState(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);

        // Update industries only if we're fetching all industries AND not cached
        if (selectedIndustry === "All" && selectedGovReg === "All" && selectedTrlStage === "All" && !industriesCache) {
          // Fetch all rankings to get complete industry list (only once)
          const allRankingsResponse = await fetch(
            `${getBackendUrl()}/api/rankings?page=0&size=1000&metric=${rankingMetric}`,
            { credentials: "include" }
          );

          if (allRankingsResponse.ok) {
            const allRankingsData = await allRankingsResponse.json();
            const allRankings = allRankingsData.content || [];

            const uniqueIndustries = [
              ...new Set(allRankings.map((startup) => startup.industry)),
            ].filter(Boolean);

            const industryBreakdown = uniqueIndustries.map((industry, index) => {
              const count = allRankings.filter(
                (startup) => startup.industry === industry
              ).length;
              return {
                name: industry,
                value: count,
                color: COLORS[index % COLORS.length],
              };
            });

            setIndustries(uniqueIndustries);
            setIndustryData(industryBreakdown);
            setIndustriesCache(true); // Mark as cached

            // Also cache all startups from this data to avoid separate API call
            const allRankedStartups = allRankings
              .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
            setTopStartups(allRankedStartups);
            setTopStartupsCache({
              industry: "All",
              govReg: "All",
              trl: "All",
              metric: rankingMetric,
              data: allRankedStartups
            });
          }
        } else if (industriesCache && industries.length === 0) {
          // If cache flag is set but industries array is empty, refetch
          setIndustriesCache(null);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchRankedStartups();
  }, [selectedIndustry, selectedGovReg, selectedTrlStage, rankingMetric, currentPage, rankingSearchQuery, refreshTrigger]);

  useEffect(() => {
    if (activeTab === "reports") {
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

  const downloadReport = (report) => {
    try {
      const doc = new jsPDF();

      // Add header with logo and title
      doc.setFillColor(29, 53, 87); // Dark blue color
      doc.rect(0, 0, 210, 40, "F");

      // Add logo
      doc.addImage(loginLogo, "PNG", 20, 10, 50, 25);

      // Add title with custom font
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text(report.title, 80, 25);

      // Add subtitle
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("StartupSphere Philippines", 80, 35);

      // Reset text color for content
      doc.setTextColor(0, 0, 0);

      // Add generation date with styling
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 50);

      // Add description with better formatting
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      const splitDescription = doc.splitTextToSize(report.description, 170);
      doc.text(splitDescription, 20, 60);

      // Add a decorative line
      doc.setDrawColor(29, 53, 87);
      doc.setLineWidth(0.5);
      doc.line(
        20,
        70 + splitDescription.length * 7,
        190,
        70 + splitDescription.length * 7
      );

      // Add summary statistics with better styling
      const summaryStartY = 80 + splitDescription.length * 7;
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Summary Statistics", 20, summaryStartY);

      // Add statistics in a styled box
      doc.setFillColor(240, 240, 240);
      doc.rect(20, summaryStartY + 5, 170, 40, "F");

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Total Startups: ${totalStartups || 0}`, 25, summaryStartY + 15);

      const avgScore =
        rankedStartups && rankedStartups.length > 0
          ? (
            rankedStartups.reduce(
              (sum, s) => sum + (s.overallScore || 0),
              0
            ) / rankedStartups.length
          ).toFixed(2)
          : "0.00";
      doc.text(`Average Score: ${avgScore}`, 25, summaryStartY + 25);

      const totalFundingVal = calculatedTotalFunding;
      doc.text(`Total Funding: ₱${formatFundingAmount(totalFundingVal)}`, 25, summaryStartY + 35);

      // Add industry breakdown with better styling
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Industry Breakdown", 20, summaryStartY + 55);

      const industryTableData = (industryData || []).map((industry) => [
        industry.name || "Unknown",
        (industry.value || 0).toString(),
        totalStartups
          ? (((industry.value || 0) / totalStartups) * 100).toFixed(1) + "%"
          : "0%",
      ]);

      autoTable(doc, {
        startY: summaryStartY + 60,
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

      // Add geographical distribution with better styling
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Geographical Distribution", 20, doc.lastAutoTable.finalY + 20);

      const geoTableData = (locationData || []).map((item) => [
        item.name || "Unknown",
        (item.value || 0).toString(),
        totalStartups
          ? (((item.value || 0) / totalStartups) * 100).toFixed(1) + "%"
          : "0%",
      ]);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 25,
        head: [["Region", "Count", "Percentage"]],
        body: geoTableData,
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

      // Add top startups with better styling
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Top Performing Startups", 20, doc.lastAutoTable.finalY + 20);

      const startupTableData = (topStartups || []).map((startup) => [
        startup.companyName || "Unknown",
        startup.industry || "Unknown",
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
          2: { cellWidth: 20 },
          3: { cellWidth: 20 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 },
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
      const fileName = `${report.title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]
        }.pdf`;
      doc.save(fileName);
      toast.success("Report downloaded successfully!");
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

      // Show a toast notification to indicate which startup is being reviewed
      if (location.state?.startupName) {
        toast.info(`Reviewing startup: ${location.state.startupName}`);
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

  // Update the PaginationControls component for 0-based server-side pagination
  const PaginationControls = () => {
    const isFirstPage = currentPage === 0;
    const isLastPage = currentPage === totalPagesState - 1 || totalPagesState === 0;

    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Showing {totalElements === 0 ? 0 : currentPage * itemsPerPage + 1} to {Math.min((currentPage + 1) * itemsPerPage, totalElements)} of {totalElements} results
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(0)}
            disabled={isFirstPage}
            className={`p-2 rounded ${isFirstPage
              ? "text-gray-400 cursor-not-allowed"
              : "text-blue-600 hover:bg-blue-50"
              }`}
            title="First page"
          >
            <ChevronLeft size={16} className="ml-[-14px]" />
          </button>

          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={isFirstPage}
            className={`px-3 py-1 rounded text-sm ${isFirstPage
              ? "text-gray-400 cursor-not-allowed"
              : "text-blue-600 hover:bg-blue-50"
              }`}
          >
            Previous
          </button>

          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, totalPagesState) }, (_, i) => {
              let pageNum;
              if (totalPagesState <= 5) {
                pageNum = i;
              } else if (currentPage <= 2) {
                pageNum = i;
              } else if (currentPage >= totalPagesState - 3) {
                pageNum = totalPagesState - 5 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={i}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 flex items-center justify-center rounded ${currentPage === pageNum
                    ? "bg-indigo-600 text-white"
                    : "text-blue-600 hover:bg-blue-50"
                    }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={isLastPage}
            className={`px-3 py-1 rounded text-sm ${isLastPage
              ? "text-gray-400 cursor-not-allowed"
              : "text-blue-600 hover:bg-blue-50"
              }`}
          >
            Next
          </button>

          <button
            onClick={() => setCurrentPage(totalPagesState - 1)}
            disabled={isLastPage}
            className={`p-2 rounded ${isLastPage
              ? "text-gray-400 cursor-not-allowed"
              : "text-blue-600 hover:bg-blue-50"
              }`}
            title="Last page"
          >
            <ChevronRight size={16} className="ml-[-14px]" />
          </button>
        </div>
      </div>
    );
  };

  const ActivityPaginationControls = () => {
    const isFirstPage = activityPage === 0;
    const isLastPage = activityPage >= activityTotalPages - 1 || activityTotalPages === 0;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
        <div className="text-sm text-gray-600">
          Showing{" "}
          <span className="font-semibold text-gray-900">
            {activityTotalElements === 0 ? 0 : activityPage * itemsPerPage + 1}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-gray-900">
            {Math.min((activityPage + 1) * itemsPerPage, activityTotalElements)}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-gray-900">
            {activityTotalElements}
          </span>{" "}
          records
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActivityPage(0)}
            disabled={isFirstPage}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${isFirstPage
                ? "text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed"
                : "text-gray-700 bg-white border-gray-300 hover:bg-gray-50 cursor-pointer"
              }`}
          >
            First
          </button>
          <button
            onClick={() => setActivityPage((p) => Math.max(0, p - 1))}
            disabled={isFirstPage}
            className={`p-1.5 rounded-lg border transition-colors ${isFirstPage
                ? "text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed"
                : "text-gray-700 bg-white border-gray-300 hover:bg-gray-50 cursor-pointer"
              }`}
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-lg">
            Page {activityTotalPages === 0 ? 0 : activityPage + 1} of{" "}
            {Math.max(1, activityTotalPages)}
          </span>

          <button
            onClick={() =>
              setActivityPage((p) => Math.min(activityTotalPages - 1, p + 1))
            }
            disabled={isLastPage}
            className={`p-1.5 rounded-lg border transition-colors ${isLastPage
                ? "text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed"
                : "text-gray-700 bg-white border-gray-300 hover:bg-gray-50 cursor-pointer"
              }`}
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActivityPage(Math.max(0, activityTotalPages - 1))}
            disabled={isLastPage}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${isLastPage
                ? "text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed"
                : "text-gray-700 bg-white border-gray-300 hover:bg-gray-50 cursor-pointer"
              }`}
          >
            Last
          </button>
        </div>
      </div>
    );
  };

  // Add these new state variables for review filtering
  const [reviewFilterStatus, setReviewFilterStatus] = useState("all");
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
      if (reportFormData.region !== "All Regions") {
        // Find selected region in PSGC data
        const selectedRegionData = psgcRegions.find(
          r => r.name === reportFormData.region || r.regionName === reportFormData.region
        );

        if (selectedRegionData) {
          queryParams.append("regionCode", selectedRegionData.code);
          queryParams.append("region", selectedRegionData.name);
        } else {
          queryParams.append("region", reportFormData.region);
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
    setReportFormData(prev => ({ ...prev, region: "All Regions" }));
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

  // Call this function when the component mounts or the activeTab changes to "review"
  useEffect(() => {
    if (activeTab === "review") {
      fetchPsgcRegions();
    }
  }, [activeTab]);

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

  const calculatedTotalFunding = useMemo(() => {
    if (ecosystemTotalFunding > 0) return ecosystemTotalFunding;
    return rankedStartups.reduce((sum, startup) => {
      const funding =
        startup.totalStartupFundingReceived ||
        startup.totalFunding ||
        startup.metrics?.totalFunding ||
        (typeof startup.metrics === "string"
          ? JSON.parse(startup.metrics)?.totalFunding
          : 0) ||
        0;
      return sum + Number(funding);
    }, 0);
  }, [ecosystemTotalFunding, rankedStartups]);

  // Shared tooltip style across all analytics charts ensuring hover text is pure black
  const chartTooltipProps = {
    contentStyle: {
      backgroundColor: "#ffffff",
      color: "#000000",
      borderRadius: "10px",
      border: "1px solid #cbd5e1",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      padding: "8px 12px",
    },
    itemStyle: {
      color: "#000000",
      fontWeight: 600,
      fontSize: "12px",
    },
    labelStyle: {
      color: "#000000",
      fontWeight: 700,
      fontSize: "13px",
      marginBottom: "4px",
    },
  };

  // Helper to parse dates across foundedDate, registrationDate, createdAt, and lastUpdated
  const parseStartupDate = (s) => {
    if (!s) return null;
    const candidates = [s.foundedDate, s.registrationDate, s.createdAt, s.lastUpdated];
    for (const raw of candidates) {
      if (!raw || raw === "N/A") continue;
      if (raw instanceof Date && !isNaN(raw.getTime())) return raw;
      const str = String(raw).trim();
      if (!str) continue;
      // Standard ISO / Date parse
      const dt = new Date(str);
      if (!isNaN(dt.getTime())) {
        return dt;
      }
      // Month-name patterns e.g. "Jul 4, 2026", "May 26, 2026"
      const mMatch = str.match(/([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
      if (mMatch) {
        const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        const mIdx = monthNames.findIndex((m) => mMatch[1].toLowerCase().startsWith(m));
        if (mIdx !== -1) {
          return new Date(parseInt(mMatch[3], 10), mIdx, parseInt(mMatch[2], 10));
        }
      }
      // Year only: e.g. "2024"
      if (/^\d{4}$/.test(str)) {
        return new Date(parseInt(str, 10), 0, 1);
      }
    }
    return null;
  };

  // Monthly startup growth dataset tracking actual startups from past months
  const computedMonthlyGrowth = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();

    // Select richest pool of startups available
    const pool = (allEcosystemStartups && allEcosystemStartups.length > 0)
      ? allEcosystemStartups
      : ((topStartups && topStartups.length > 0) ? topStartups : rankedStartups);

    // Dynamic month span based on growthTimeframe
    let span = 6;
    if (growthTimeframe === "12M") span = 12;
    if (growthTimeframe === "ALL") span = 24;

    const result = [];
    for (let i = span - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = months[d.getMonth()];
      const y = d.getFullYear();
      const m = d.getMonth();

      // Startups founded or joined in this specific month
      const addedThisMonth = pool.filter((s) => {
        const dt = parseStartupDate(s);
        if (!dt) return false;
        return dt.getFullYear() === y && dt.getMonth() === m;
      });

      // Cumulative startups founded on or before this month
      // Startups without parseable date are included in baseline so total ventures match
      const cumulativeCount = pool.filter((s) => {
        const dt = parseStartupDate(s);
        if (!dt) return true;
        return dt.getFullYear() < y || (dt.getFullYear() === y && dt.getMonth() <= m);
      }).length;

      result.push({
        month: mName,
        monthYear: `${mName} ${y}`,
        newStartups: addedThisMonth.length,
        totalStartups: cumulativeCount,
        newStartupNames: addedThisMonth.map((s) => s.companyName || s.name).filter(Boolean),
      });
    }

    return result;
  }, [allEcosystemStartups, topStartups, rankedStartups, growthTimeframe]);

  // Master pool representing all listed businesses and startups in the ecosystem
  const allListedBusinesses = useMemo(() => {
    if (allEcosystemStartups && allEcosystemStartups.length > 0) {
      return allEcosystemStartups;
    }
    if (topStartups && topStartups.length > 0) {
      return topStartups;
    }
    return rankedStartups;
  }, [allEcosystemStartups, topStartups, rankedStartups]);

  // Geographical distribution listing all cities with business counts
  const computedLocationData = useMemo(() => {
    if (locationData && locationData.length > 0) {
      return locationData;
    }
    const locMap = {};
    allListedBusinesses.forEach((s) => {
      const city = (s.city || s.location || "Other").trim();
      if (!city || city === "Unknown" || city === "N/A") {
        locMap["Other"] = (locMap["Other"] || 0) + 1;
      } else {
        locMap[city] = (locMap[city] || 0) + 1;
      }
    });
    return Object.entries(locMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [locationData, allListedBusinesses]);

  // Helper to get TRL level number (1 - 9)
  const getStartupTrlLevel = (s) => {
    if (!s || !s.trlLevel) return 0;
    const match = String(s.trlLevel).match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  // Compute growth score directly from TRL readiness level (TRL 1-9 normalized to 11-100 pts)
  const getStartupGrowthScore = (s) => {
    if (!s) return 0;
    if (s.growthScore !== undefined && s.growthScore !== null && Number(s.growthScore) > 0) {
      return Number(s.growthScore);
    }
    const lvl = getStartupTrlLevel(s);
    if (lvl > 0) {
      return Math.round((Math.min(Math.max(lvl, 1), 9) / 9) * 100);
    }
    return 0;
  };

  // Average, Growth, and Ecosystem scores across all listed businesses by industry
  const industryMetricsData = useMemo(() => {
    return industries.map((industry) => {
      const startups = allListedBusinesses.filter((s) => s.industry === industry);
      const count = startups.length;
      if (count === 0) {
        return {
          name: industry,
          count: 0,
          score: 0,
          growthScore: 0,
          avgTrl: 0,
          ecosystemScore: 0,
        };
      }

      // 1. Growth Score based on TRL readiness (per business)
      const growthScores = startups.map((s) => getStartupGrowthScore(s));
      const trlLevels = startups.map((s) => getStartupTrlLevel(s)).filter((lvl) => lvl > 0);
      const avgGrowth = Math.round(
        growthScores.reduce((sum, score) => sum + score, 0) / count
      );
      const avgTrl = trlLevels.length > 0
        ? Number((trlLevels.reduce((sum, lvl) => sum + lvl, 0) / trlLevels.length).toFixed(1))
        : 0;

      // 2. Ecosystem Score based on PPP partnerships, mentors, and investors
      const ecosystemScores = startups.map((s) => {
        if (s.ecosystemScore !== undefined && s.ecosystemScore !== null && Number(s.ecosystemScore) > 0) {
          return Number(s.ecosystemScore);
        }
        const ppp = Number(s.publicPrivatePartnershipsInvolvingStartups || s.partnerships || 0);
        const mentors = Number(s.numberOfMentorsOrAdvisorsInvolved || s.mentors || 0);
        const investors = Number(s.numberOfInvestors || s.investors || 0);
        const raw = (ppp * 3) + (mentors * 2) + (investors * 2);
        return Math.min(100, Math.round(raw > 0 ? raw * 5 : 25));
      });
      const avgEcosystem = Math.round(
        ecosystemScores.reduce((sum, score) => sum + score, 0) / count
      );

      // 3. Investment Score based on funding received
      const investmentScores = startups.map((s) => {
        if (s.investmentScore !== undefined && s.investmentScore !== null && Number(s.investmentScore) > 0) {
          return Number(s.investmentScore);
        }
        const funding = Number(s.totalStartupFundingReceived || s.totalFunding || 0);
        if (funding <= 0) return 15;
        return Math.min(100, Math.round((Math.log10(funding + 1) / Math.log10(10000000 + 1)) * 100));
      });

      // 4. Overall Score composite
      const avgOverall = Math.round(
        startups.reduce((sum, s, idx) => {
          if (s.overallScore !== undefined && s.overallScore !== null && Number(s.overallScore) > 0) {
            return sum + Number(s.overallScore);
          }
          if (s.score !== undefined && s.score !== null && Number(s.score) > 0) {
            return sum + Number(s.score);
          }
          const g = growthScores[idx] || 0;
          const inv = investmentScores[idx] || 0;
          const eco = ecosystemScores[idx] || 0;
          return sum + Math.round((g * 0.4) + (inv * 0.3) + (eco * 0.3));
        }, 0) / count
      );

      return {
        name: industry,
        count: count,
        score: avgOverall,
        growthScore: avgGrowth,
        avgTrl: avgTrl,
        ecosystemScore: avgEcosystem,
      };
    });
  }, [allListedBusinesses, industries]);

  // Government registered & compliance / government funded dataset across all businesses
  const govComplianceData = useMemo(() => {
    const pool = allListedBusinesses;
    const registered = pool.filter(
      (s) =>
        s.isGovernmentRegistered === true ||
        (s.registrationAgency && s.registrationAgency.trim().length > 0 && s.registrationAgency !== "Unregistered")
    ).length;

    const funded = pool.filter(
      (s) =>
        Number(s.amountOfGovernmentGrantsOrSubsidiesReceived || 0) > 0 ||
        Boolean(s.governmentSupport)
    ).length;

    const sec = pool.filter((s) => s.registrationAgency === "SEC").length;
    const dti = pool.filter((s) => s.registrationAgency === "DTI").length;
    const bir = pool.filter((s) => s.registrationAgency === "BIR").length;
    const otherAgc = pool.filter(
      (s) => s.registrationAgency && !["BIR", "SEC", "DTI", "Unregistered"].includes(s.registrationAgency)
    ).length;

    const unregistered = pool.filter(
      (s) =>
        !s.isGovernmentRegistered &&
        (!s.registrationAgency || s.registrationAgency === "Unregistered") &&
        Number(s.amountOfGovernmentGrantsOrSubsidiesReceived || 0) === 0
    ).length;

    return [
      { name: "Gov. Registered", count: registered, fill: "#10b981" },
      { name: "Gov. Funded", count: funded, fill: "#06b6d4" },
      { name: "SEC (Corp)", count: sec, fill: "#3b82f6" },
      { name: "DTI (Trade)", count: dti, fill: "#6366f1" },
      { name: "BIR (Certified)", count: bir, fill: "#8b5cf6" },
      { name: "Other Agc.", count: otherAgc, fill: "#ec4899" },
      { name: "Unregistered", count: unregistered, fill: "#f59e0b" },
    ];
  }, [allListedBusinesses]);

  // Technology Readiness Stages dataset across ALL listed businesses (TRL 1 through TRL 9)
  const trlReadinessStagesData = useMemo(() => {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => {
      const matching = allListedBusinesses.filter((s) => {
        const raw = String(s.trlLevel || "");
        const match = raw.match(/\d+/);
        return match ? parseInt(match[0], 10) === lvl : false;
      });

      let color = "#10b981"; // Concept (TRL 1-3)
      if (lvl >= 4 && lvl <= 6) color = "#f59e0b"; // Prototype (TRL 4-6)
      if (lvl >= 7) color = "#ef4444"; // Commercial (TRL 7-9)

      return {
        stage: `TRL ${lvl}`,
        level: lvl,
        count: matching.length,
        fill: color,
        startups: matching.map((s) => s.companyName || s.name).filter(Boolean),
      };
    });
  }, [allListedBusinesses]);

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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
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

        {/* Consolidated Ecosystem Executive Filter Toolbar (For Rankings & Analytics) */}
        {(activeTab === "rankings" || activeTab === "analytics") && (
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
              {(selectedIndustry !== "All" || selectedGovReg !== "All" || selectedTrlStage !== "All" || rankingMetric !== "overall" || rankingSearchQuery) && (
                <button
                  onClick={() => {
                    setSelectedIndustry("All");
                    setSelectedGovReg("All");
                    setSelectedTrlStage("All");
                    setRankingMetric("overall");
                    setRankingSearchQuery("");
                    setCurrentPage(0);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer border border-rose-200"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              )}
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
                  {selectedGovReg === "BIR" && (
                    <TooltipInfo type="BIR" size="xs" />
                  )}
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
        )}

        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-6 sm:space-x-8 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => setActiveTab("rankings")}
              className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer whitespace-nowrap transition-colors ${activeTab === "rankings"
                  ? "border-indigo-500 text-indigo-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              Rankings
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer whitespace-nowrap transition-colors ${activeTab === "analytics"
                  ? "border-indigo-500 text-indigo-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              Analytics
            </button>

            {/* Active Businesses Tab */}
            <button
              onClick={() => {
                setActiveTab("active");
                setActivityPage(0);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer whitespace-nowrap flex items-center gap-2 transition-colors ${activeTab === "active"
                  ? "border-emerald-500 text-emerald-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${activeTab === "active" ? "bg-emerald-500 animate-pulse" : "bg-emerald-400"
                  }`}
              ></span>
              <span>Active Businesses</span>
              {activitySummary.activeCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                  {activitySummary.activeCount}
                </span>
              )}
            </button>

            {/* Inactive Businesses Tab */}
            <button
              onClick={() => {
                setActiveTab("inactive");
                setActivityPage(0);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer whitespace-nowrap flex items-center gap-2 transition-colors ${activeTab === "inactive"
                  ? "border-amber-500 text-amber-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${activeTab === "inactive" ? "bg-amber-500 animate-pulse" : "bg-amber-400"
                  }`}
              ></span>
              <span>Inactive Businesses</span>
              {activitySummary.inactiveCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 font-semibold">
                  {activitySummary.inactiveCount}
                </span>
              )}
            </button>

            {/* Archive Tab */}
            <button
              onClick={() => {
                setActiveTab("archive");
                setActivityPage(0);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer whitespace-nowrap flex items-center gap-2 transition-colors ${activeTab === "archive"
                  ? "border-rose-500 text-rose-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${activeTab === "archive" ? "bg-rose-500 animate-pulse" : "bg-rose-400"
                  }`}
              ></span>
              <span>Archive</span>
              {activitySummary.archivedCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-rose-100 text-rose-700 font-semibold">
                  {activitySummary.archivedCount}
                </span>
              )}
            </button>

            {role === "ROLE_ADMIN" && (
              <button
                onClick={() => setActiveTab("review")}
                className={`py-4 px-1 border-b-2 font-medium text-sm cursor-pointer whitespace-nowrap transition-colors ${activeTab === "review"
                    ? "border-indigo-500 text-indigo-600 font-semibold"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                Startup Review
              </button>
            )}
          </nav>
        </div>

        {activeTab === "rankings" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
              {/* Minimal Uniform Header Section */}
              <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                      <Award className="h-5 w-5 text-indigo-600 mr-2.5" />
                      Startup Rankings Leaderboard
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Comprehensive rankings by verified performance metrics and readiness levels
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    {/* Search Bar for specific business in rankings */}
                    <div className="relative min-w-[260px] sm:min-w-[300px]">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={rankingSearchQuery}
                        onChange={(e) => {
                          setRankingSearchQuery(e.target.value);
                          setCurrentPage(0);
                        }}
                        placeholder="Search business name or industry..."
                        className="w-full pl-10 pr-9 py-2 text-xs md:text-sm text-black placeholder:text-gray-400 font-medium bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                      />
                      {rankingSearchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setRankingSearchQuery("");
                            setCurrentPage(0);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                          title="Clear search"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <span className="inline-flex items-center text-xs font-semibold px-3 py-2 rounded-xl bg-white text-indigo-700 border border-indigo-200 shadow-xs whitespace-nowrap">
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
                  ) : rankedStartups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3.5 text-indigo-500 border border-indigo-100">
                        <Search className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">
                        {rankingSearchQuery ? `No business found matching "${rankingSearchQuery}"` : "No startups found"}
                      </h3>
                      <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4 leading-relaxed">
                        {rankingSearchQuery
                          ? "Try searching with a different keyword, business name, or clear the search to view all rankings."
                          : "No registered businesses match the current filter criteria."}
                      </p>
                      {rankingSearchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setRankingSearchQuery("");
                            setCurrentPage(0);
                          }}
                          className="px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer border border-indigo-200"
                        >
                          Clear Search
                        </button>
                      )}
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
                                    <div className="flex-shrink-0 h-8 w-8 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center">
                                      <span className="text-black font-bold text-sm">
                                        {startup.rank || (currentPage * itemsPerPage + index + 1)}
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
                                      BIR Registered
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

        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Monthly Startup Growth Chart */}
            <div className="col-span-1 lg:col-span-2 bg-white p-6 rounded-lg shadow border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-blue-900">
                        Monthly Startup Growth
                      </h2>
                      <TooltipInfo type="CHART_MONTHLY_GROWTH" size="xs" />
                    </div>
                    <p className="text-xs text-gray-500">
                      Tracking new startup additions per month and cumulative ecosystem trajectory
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                  {/* Timeframe selector: 6 Months, 12 Months, All Time */}
                  <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setGrowthTimeframe("6M")}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${growthTimeframe === "6M"
                          ? "bg-white text-blue-700 shadow-xs font-bold"
                          : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                      Past 6M
                    </button>
                    <button
                      type="button"
                      onClick={() => setGrowthTimeframe("12M")}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${growthTimeframe === "12M"
                          ? "bg-white text-blue-700 shadow-xs font-bold"
                          : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                      Past 12M
                    </button>
                    <button
                      type="button"
                      onClick={() => setGrowthTimeframe("ALL")}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${growthTimeframe === "ALL"
                          ? "bg-white text-blue-700 shadow-xs font-bold"
                          : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                      All Time (2Y)
                    </button>
                  </div>

                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Growth Momentum
                  </span>
                </div>
              </div>

              {/* Dynamic stats banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <div>
                  <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Ecosystem Total</div>
                  <div className="text-lg font-bold text-gray-900">
                    {computedMonthlyGrowth[computedMonthlyGrowth.length - 1]?.totalStartups || 0}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">New in Selected Period</div>
                  <div className="text-lg font-bold text-blue-600">
                    +{computedMonthlyGrowth.reduce((acc, curr) => acc + (curr.newStartups || 0), 0)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Latest Month Added</div>
                  <div className="text-lg font-bold text-emerald-600">
                    +{computedMonthlyGrowth[computedMonthlyGrowth.length - 1]?.newStartups || 0}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Active Window</div>
                  <div className="text-lg font-bold text-indigo-600">
                    {growthTimeframe === "6M" ? "Past 6 Mos." : (growthTimeframe === "12M" ? "Past 12 Mos." : "24 Mos.")}
                  </div>
                </div>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={computedMonthlyGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="month"
                      stroke="#4b5563"
                      tick={{ fill: "#111827", fontSize: 12, fontWeight: 500 }}
                    />
                    <YAxis
                      stroke="#4b5563"
                      tick={{ fill: "#111827", fontSize: 12, fontWeight: 500 }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null;
                        const dataItem = payload[0]?.payload || {};
                        const names = dataItem.newStartupNames || [];
                        return (
                          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xl text-black">
                            <div className="font-bold text-sm text-black mb-1.5 border-b border-gray-100 pb-1">
                              {dataItem.monthYear || label}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-semibold text-black mb-1">
                              <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 inline-block"></span>
                              <span>New Registrations:</span>
                              <span className="font-bold text-blue-600">{dataItem.newStartups || 0}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-semibold text-black">
                              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
                              <span>Cumulative Total:</span>
                              <span className="font-bold text-indigo-600">{dataItem.totalStartups || 0} Startups</span>
                            </div>
                            {names.length > 0 && (
                              <div className="mt-2 pt-1.5 border-t border-gray-100 text-[11px] text-gray-800">
                                <span className="font-bold text-black">New ventures: </span>
                                <span>{names.slice(0, 3).join(", ")}{names.length > 3 ? ` +${names.length - 3} more` : ""}</span>
                              </div>
                            )}
                          </div>
                        );
                      }}
                    />
                    <Legend wrapperStyle={{ color: "#000000", fontWeight: 600, paddingTop: "8px" }} />
                    <Bar
                      dataKey="newStartups"
                      name="New Startups"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalStartups"
                      name="Cumulative Total"
                      stroke="#6366f1"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#6366f1" }}
                      activeDot={{ r: 6 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Geographical Distribution */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-blue-900">
                          Geographical Distribution
                        </h2>
                        <TooltipInfo type="CHART_GEOGRAPHICAL" size="xs" />
                      </div>
                      <p className="text-xs text-gray-500">
                        Tracks all listed startups & businesses across locations
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {computedLocationData.reduce((acc, curr) => acc + curr.value, 0)} Total
                  </span>
                </div>
                <div className="h-60">
                  {dashboardLoading ? (
                    <div className="text-center py-6 text-gray-500">
                      Loading location data...
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={computedLocationData}
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          dataKey="value"
                          label={({ name, value }) => `${value}`}
                        >
                          {computedLocationData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip {...chartTooltipProps} formatter={(val) => [`${val} Businesses / Startups`, "Count"]} />
                        <Legend wrapperStyle={{ color: "#000000", fontWeight: 600, fontSize: "11px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Explicit number breakdown listing all startups and businesses per location */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    Location Directory ({computedLocationData.length} Areas)
                  </span>
                  <span className="text-xs font-bold text-blue-700">
                    {computedLocationData.reduce((acc, curr) => acc + curr.value, 0)} Total Businesses
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                  {computedLocationData.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-50/80 border border-gray-100 hover:bg-gray-100/70 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="text-xs font-medium text-gray-800 truncate" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-gray-900 ml-1.5 shrink-0">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Average Scores by Industry */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-blue-900">
                        Average Scores by Industry
                      </h2>
                      <TooltipInfo type="CHART_AVERAGE_SCORES" size="xs" />
                    </div>
                    <p className="text-xs text-gray-500">
                      Evaluated across all {allListedBusinesses.length} listed businesses
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200">
                  Performance
                </span>
              </div>
              {loading && allListedBusinesses.length === 0 ? (
                <div className="text-center py-6 text-gray-500">Loading data...</div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={industryMetricsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        stroke="#4b5563"
                        tick={{ fill: "#111827", fontSize: 11 }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        stroke="#4b5563"
                        tick={{ fill: "#111827", fontSize: 11 }}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload || !payload.length) return null;
                          const item = payload[0]?.payload || {};
                          return (
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-md text-black">
                              <div className="font-bold text-xs mb-1 text-black">{label}</div>
                              <div className="text-xs text-black">
                                Avg Score: <span className="font-bold text-purple-600">{item.score} pts</span>
                              </div>
                              <div className="text-[11px] text-gray-600 mt-0.5">
                                Tracked Businesses: <span className="font-semibold text-black">{item.count}</span>
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="score" fill="#8884d8" radius={[4, 4, 0, 0]}>
                        {industryMetricsData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* 4. Growth Score by Industry */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-blue-900">
                        Growth Score by Industry
                      </h2>
                      <TooltipInfo type="CHART_GROWTH_SCORE" size="xs" />
                    </div>
                    <p className="text-xs text-gray-500">
                      Based on TRL stage readiness of all {allListedBusinesses.length} businesses
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  TRL Readiness Basis
                </span>
              </div>
              {loading && allListedBusinesses.length === 0 ? (
                <div className="text-center py-6 text-gray-500">Loading data...</div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={industryMetricsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        stroke="#4b5563"
                        tick={{ fill: "#111827", fontSize: 11 }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        stroke="#4b5563"
                        tick={{ fill: "#111827", fontSize: 11 }}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload || !payload.length) return null;
                          const item = payload[0]?.payload || {};
                          return (
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-md text-black">
                              <div className="font-bold text-xs mb-1 text-black">{label}</div>
                              <div className="text-xs text-black">
                                Growth Score: <span className="font-bold text-teal-600">{item.growthScore} pts</span>
                              </div>
                              <div className="text-[11px] text-gray-600 mt-0.5">
                                Tracked Businesses: <span className="font-semibold text-black">{item.count}</span>
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="growthScore" fill="#00C49F" radius={[4, 4, 0, 0]}>
                        {industryMetricsData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* 5. Ecosystem Score by Industry */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-blue-900">
                        Ecosystem Score by Industry
                      </h2>
                      <TooltipInfo type="CHART_ECOSYSTEM_SCORE" size="xs" />
                    </div>
                    <p className="text-xs text-gray-500">
                      Tracks PPP partnerships & investors of all {allListedBusinesses.length} businesses
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  PPP & Investors
                </span>
              </div>
              {loading && allListedBusinesses.length === 0 ? (
                <div className="text-center py-6 text-gray-500">Loading data...</div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={industryMetricsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        stroke="#4b5563"
                        tick={{ fill: "#111827", fontSize: 11 }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        stroke="#4b5563"
                        tick={{ fill: "#111827", fontSize: 11 }}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload || !payload.length) return null;
                          const item = payload[0]?.payload || {};
                          return (
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-md text-black">
                              <div className="font-bold text-xs mb-1 text-black">{label}</div>
                              <div className="text-xs text-black">
                                Ecosystem Score: <span className="font-bold text-amber-600">{item.ecosystemScore} pts</span>
                              </div>
                              <div className="text-[11px] text-gray-600 mt-0.5">
                                Tracked Businesses: <span className="font-semibold text-black">{item.count}</span>
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="ecosystemScore" fill="#FFBB28" radius={[4, 4, 0, 0]}>
                        {industryMetricsData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* 6. Government Certified & Compliance Status Chart */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-blue-900">
                        Government Certified & Compliance Status
                      </h2>
                      <TooltipInfo type="CHART_GOV_COMPLIANCE" size="xs" />
                    </div>
                    <p className="text-xs text-gray-500">
                      Tracking compliance & grants of all {allListedBusinesses.length} businesses
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {allListedBusinesses.length} Tracked
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={govComplianceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      stroke="#4b5563"
                      tick={{ fill: "#111827", fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#4b5563"
                      tick={{ fill: "#111827", fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      {...chartTooltipProps}
                      formatter={(value) => [`${value} Startups / Researches`, "Count"]}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {govComplianceData.map((entry, idx) => (
                        <Cell key={`bar-${idx}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 7. Technology Readiness Level (TRL) Breakdown Chart */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-blue-900">
                        Technology Readiness Stages
                      </h2>
                      <TooltipInfo type="CHART_TRL_STAGES" size="xs" />
                    </div>
                    <p className="text-xs text-gray-500">
                      Tracking TRL 1 - 9 across all {allListedBusinesses.length} listed businesses
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {trlReadinessStagesData.reduce((acc, curr) => acc + curr.count, 0)} Tracked
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trlReadinessStagesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="stage"
                      stroke="#4b5563"
                      tick={{ fill: "#111827", fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#4b5563"
                      tick={{ fill: "#111827", fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null;
                        const item = payload[0]?.payload || {};
                        const names = item.startups || [];
                        return (
                          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xl text-black">
                            <div className="font-bold text-sm text-black mb-1.5 border-b border-gray-100 pb-1">
                              {label}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-semibold text-black">
                              <span>Readiness Count:</span>
                              <span className="font-bold text-indigo-600">{item.count || 0} Ventures</span>
                            </div>
                            {names.length > 0 && (
                              <div className="mt-2 pt-1.5 border-t border-gray-100 text-[11px] text-gray-800 max-w-xs">
                                <span className="font-bold text-black">Businesses: </span>
                                <span>{names.slice(0, 4).join(", ")}{names.length > 4 ? ` +${names.length - 4} more` : ""}</span>
                              </div>
                            )}
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {trlReadinessStagesData.map((entry, idx) => (
                        <Cell key={`trl-${idx}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Active Businesses Tab Content */}
        {activeTab === "active" && (
          <div className="space-y-6">
            {/* Header & Metric Banner */}
            <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border border-emerald-200 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                      <CheckCircle className="w-5 h-5" />
                    </span>
                    <h2 className="text-xl font-bold text-gray-900">
                      Active Startups & Businesses
                    </h2>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 max-w-2xl leading-relaxed">
                    Startups actively maintaining their profiles with updates to contacts, investors, government credibility, or company details within the last 90 days. All active businesses are verified and displayed on the interactive startup map.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-white/90 backdrop-blur-xs px-4 py-3 rounded-xl border border-emerald-100 shadow-xs flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Active Startups</p>
                      <p className="text-lg font-bold text-gray-900">{activitySummary.activeCount}</p>
                    </div>
                  </div>
                  <div className="bg-white/90 backdrop-blur-xs px-4 py-3 rounded-xl border border-emerald-100 shadow-xs flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Public Map</p>
                      <p className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                        Visible to All
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/90 backdrop-blur-xs px-4 py-3 rounded-xl border border-emerald-100 shadow-xs flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Inactivity Rule</p>
                      <p className="text-xs font-bold text-gray-700 mt-0.5">90-Day Window</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={activitySearch}
                  onChange={(e) => {
                    setActivitySearch(e.target.value);
                    setActivityPage(0);
                  }}
                  placeholder="Search active businesses by name, industry, or email..."
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 hover:bg-gray-100/70 focus:bg-white text-black border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium placeholder:text-gray-400"
                />
                {activitySearch && (
                  <button
                    onClick={() => {
                      setActivitySearch("");
                      setActivityPage(0);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={activityIndustry}
                  onChange={(e) => {
                    setActivityIndustry(e.target.value);
                    setActivityPage(0);
                  }}
                  className="rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold bg-gray-50 border border-gray-300 text-gray-800 outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="All">All Industries</option>
                  {industries.map((ind, i) => (
                    <option key={i} value={ind}>{ind}</option>
                  ))}
                </select>

                {(activitySearch || activityIndustry !== "All") && (
                  <button
                    onClick={() => {
                      setActivitySearch("");
                      setActivityIndustry("All");
                      setActivityPage(0);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active Table */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Business & Location
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Industry & TRL
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Last Profile Update
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Map Visibility
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Inactivity Window
                      </th>
                      <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {activityLoading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-12 text-gray-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm font-medium">Loading active businesses...</span>
                          </div>
                        </td>
                      </tr>
                    ) : activityList.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-12 text-gray-500">
                          <div className="flex flex-col items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2" />
                            <p className="text-base font-semibold text-gray-800">No active businesses found</p>
                            <p className="text-xs text-gray-500 mt-1">Try adjusting your search query or industry filter.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      activityList.map((startup) => (
                        <tr key={startup.id} className="hover:bg-emerald-50/20 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <button
                                onClick={() => navigate(`/startup/${startup.id}`)}
                                className="font-bold text-gray-900 hover:text-emerald-600 text-left cursor-pointer transition-colors"
                              >
                                {startup.companyName}
                              </button>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                <span>{startup.city ? `${startup.city}, ` : ""}{startup.province || "Philippines"}</span>
                              </div>
                              {startup.contactEmail && (
                                <p className="text-xs text-gray-400 mt-0.5">{startup.contactEmail}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              {startup.industry || "General"}
                            </span>
                            <div className="mt-1 text-xs text-gray-600 font-semibold">
                              {startup.trlLevel || "TRL Stage N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-xs font-semibold text-gray-800">
                              {formatDisplayDate(startup.lastUpdated)}
                            </p>
                            <span className="text-xs text-emerald-600 font-medium">
                              {startup.daysInactive === 0 ? "Today" : `${startup.daysInactive} days ago`}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Visible on Map</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-700 font-medium">
                              <span className="font-bold text-gray-900">{Math.max(0, 90 - startup.daysInactive)} days</span> remaining
                            </div>
                            <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-1.5 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(5, ((90 - startup.daysInactive) / 90) * 100))}%` }}
                              ></div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => navigate(`/startup/${startup.id}`)}
                                className="p-2 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="View Startup Profile"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {role === "ROLE_ADMIN" && (
                                <button
                                  onClick={() => handleArchiveBusiness(startup)}
                                  disabled={actionLoadingId === startup.id}
                                  className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                  title="Move to Archive (Admin)"
                                >
                                  <Archive className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-gray-100 px-6">
                <ActivityPaginationControls />
              </div>
            </div>
          </div>
        )}

        {/* Inactive Businesses Tab Content */}
        {activeTab === "inactive" && (
          <div className="space-y-6">
            {/* Warning Alert Banner */}
            <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/10 border-2 border-amber-300 rounded-2xl p-6 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs mt-0.5">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <span>90-Day Inactivity Warning Zone</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold">
                        Weekly Automated Notices
                      </span>
                    </h2>
                    <p className="text-sm text-gray-700 mt-2 max-w-3xl leading-relaxed">
                      Startups listed below have had <strong>no profile updates for over 90 days</strong> (such as new investors, updated contacts, government credentials, or company details). The system automatically dispatches <strong>weekly reminder emails</strong> to the registered contact.
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-amber-900 bg-amber-100/90 border border-amber-300 px-3 py-1.5 rounded-lg w-fit">
                      <Clock className="w-4 h-4 text-amber-700" />
                      <span>7-Day Grace Period: After 7 days of inactivity (97 days total), startups will be automatically moved to Archive and hidden from the map.</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                  <button
                    onClick={handleRunLifecycleCheck}
                    disabled={manualCheckLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${manualCheckLoading ? "animate-spin" : ""}`} />
                    <span>{manualCheckLoading ? "Checking Lifecycle..." : "Run Lifecycle Check Now"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Inactive Search & Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={activitySearch}
                  onChange={(e) => {
                    setActivitySearch(e.target.value);
                    setActivityPage(0);
                  }}
                  placeholder="Search inactive businesses by name, industry, or email..."
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 hover:bg-gray-100/70 focus:bg-white text-black border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium placeholder:text-gray-400"
                />
                {activitySearch && (
                  <button
                    onClick={() => {
                      setActivitySearch("");
                      setActivityPage(0);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={activityIndustry}
                  onChange={(e) => {
                    setActivityIndustry(e.target.value);
                    setActivityPage(0);
                  }}
                  className="rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold bg-gray-50 border border-gray-300 text-gray-800 outline-none cursor-pointer focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="All">All Industries</option>
                  {industries.map((ind, i) => (
                    <option key={i} value={ind}>{ind}</option>
                  ))}
                </select>

                {(activitySearch || activityIndustry !== "All") && (
                  <button
                    onClick={() => {
                      setActivitySearch("");
                      setActivityIndustry("All");
                      setActivityPage(0);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Inactive Table */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Startup & Contact
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Industry
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Inactivity Duration
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Grace Period Countdown
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Weekly Email Status
                      </th>
                      <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {activityLoading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-12 text-gray-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm font-medium">Loading inactive businesses...</span>
                          </div>
                        </td>
                      </tr>
                    ) : activityList.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-12 text-gray-500">
                          <div className="flex flex-col items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2" />
                            <p className="text-base font-semibold text-gray-800">No inactive businesses</p>
                            <p className="text-xs text-gray-500 mt-1">All startups have maintained recent updates within 90 days.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      activityList.map((startup) => (
                        <tr key={startup.id} className="hover:bg-amber-50/25 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <button
                                onClick={() => navigate(`/startup/${startup.id}`)}
                                className="font-bold text-gray-900 hover:text-amber-600 text-left cursor-pointer transition-colors"
                              >
                                {startup.companyName}
                              </button>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                <span>{startup.city ? `${startup.city}, ` : ""}{startup.province || "Philippines"}</span>
                              </div>
                              {startup.contactEmail && (
                                <a
                                  href={`mailto:${startup.contactEmail}`}
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                                >
                                  <Mail className="w-3 h-3 text-blue-500" />
                                  <span>{startup.contactEmail}</span>
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                              {startup.industry || "General"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              <span>{startup.daysInactive} days inactive</span>
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              Last update: {formatDisplayDate(startup.lastUpdated)}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {startup.daysUntilArchive > 0 ? (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-300">
                                  <Clock className="w-3.5 h-3.5 text-rose-500" />
                                  <span>{startup.daysUntilArchive} days left until Archive</span>
                                </span>
                                <p className="text-[11px] text-gray-500 mt-1">
                                  Will be hidden from map when archived
                                </p>
                              </div>
                            ) : (
                              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800">
                                Grace Expired (Pending Archive)
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {startup.lastInactivityEmailSent ? (
                              <div className="text-xs text-gray-700">
                                <p className="font-semibold text-gray-900 flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Weekly notice sent</span>
                                </p>
                                <span className="text-gray-500">
                                  {formatDisplayDate(startup.lastInactivityEmailSent)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500 italic">
                                Scheduled for next weekly run
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleSendInactivityReminder(startup)}
                                disabled={sendingEmailId === startup.id}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                title="Send weekly inactivity warning email now"
                              >
                                {sendingEmailId === startup.id ? (
                                  <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Mail className="w-3.5 h-3.5 text-amber-700" />
                                )}
                                <span>Email Notice</span>
                              </button>
                              <button
                                onClick={() => handleArchiveBusiness(startup)}
                                disabled={actionLoadingId === startup.id}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                title="Move to archive and hide from map"
                              >
                                <Archive className="w-3.5 h-3.5 text-rose-600" />
                                <span>Archive</span>
                              </button>
                              <button
                                onClick={() => navigate(`/startup/${startup.id}`)}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="View details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-gray-100 px-6">
                <ActivityPaginationControls />
              </div>
            </div>
          </div>
        )}

        {/* Archive Tab Content */}
        {activeTab === "archive" && (
          <div className="space-y-6">
            {/* Archive Notice Banner */}
            <div className="bg-gradient-to-r from-rose-500/10 via-gray-100 to-rose-500/5 border border-rose-200 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs mt-0.5">
                    <Archive className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <span>Archived Businesses</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold border border-rose-200 flex items-center gap-1">
                        <EyeOff className="w-3 h-3 text-rose-600" />
                        Hidden from Public Map
                      </span>
                    </h2>
                    <p className="text-sm text-gray-600 mt-2 max-w-3xl leading-relaxed">
                      Startups are moved to Archive after exceeding the <strong>7-day grace period following 90 days of inactivity</strong> (97+ days total without updates), or by administrative decision. <strong>Archived businesses are completely hidden from the interactive public map</strong> so users cannot encounter outdated startups.
                    </p>
                    <p className="text-xs text-rose-700 font-medium mt-2">
                      💡 To restore an archived startup and make it visible on the map again, click <strong>Reactivate</strong> below or have the founder update any business details.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-white px-4 py-3 rounded-xl border border-rose-100 shadow-xs flex items-center gap-3">
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                      <Archive className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Archived Startups</p>
                      <p className="text-lg font-bold text-gray-900">{activitySummary.archivedCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Archive Search & Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={activitySearch}
                  onChange={(e) => {
                    setActivitySearch(e.target.value);
                    setActivityPage(0);
                  }}
                  placeholder="Search archived businesses by name, industry, or email..."
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 hover:bg-gray-100/70 focus:bg-white text-black border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium placeholder:text-gray-400"
                />
                {activitySearch && (
                  <button
                    onClick={() => {
                      setActivitySearch("");
                      setActivityPage(0);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={activityIndustry}
                  onChange={(e) => {
                    setActivityIndustry(e.target.value);
                    setActivityPage(0);
                  }}
                  className="rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold bg-gray-50 border border-gray-300 text-gray-800 outline-none cursor-pointer focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                >
                  <option value="All">All Industries</option>
                  {industries.map((ind, i) => (
                    <option key={i} value={ind}>{ind}</option>
                  ))}
                </select>

                {(activitySearch || activityIndustry !== "All") && (
                  <button
                    onClick={() => {
                      setActivitySearch("");
                      setActivityIndustry("All");
                      setActivityPage(0);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Archive Table */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Startup & Contact
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Industry
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Total Inactive Days
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Public Map Status
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Archive Status
                      </th>
                      <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {activityLoading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-12 text-gray-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm font-medium">Loading archived businesses...</span>
                          </div>
                        </td>
                      </tr>
                    ) : activityList.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-12 text-gray-500">
                          <div className="flex flex-col items-center justify-center">
                            <Archive className="w-10 h-10 text-gray-400 mb-2" />
                            <p className="text-base font-semibold text-gray-800">No archived businesses found</p>
                            <p className="text-xs text-gray-500 mt-1">Archived startups will appear here once 7 days of inactivity pass.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      activityList.map((startup) => (
                        <tr key={startup.id} className="hover:bg-rose-50/20 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <button
                                onClick={() => navigate(`/startup/${startup.id}`)}
                                className="font-bold text-gray-900 hover:text-rose-600 text-left cursor-pointer transition-colors"
                              >
                                {startup.companyName}
                              </button>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                <span>{startup.city ? `${startup.city}, ` : ""}{startup.province || "Philippines"}</span>
                              </div>
                              {startup.contactEmail && (
                                <p className="text-xs text-gray-400 mt-0.5">{startup.contactEmail}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                              {startup.industry || "General"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-xs font-bold text-gray-800">
                              {startup.daysInactive} days inactive
                            </span>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Last update: {formatDisplayDate(startup.lastUpdated)}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                              <EyeOff className="w-3.5 h-3.5 text-rose-600" />
                              <span>Hidden from Map</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                              Archived
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleReactivateBusiness(startup)}
                                disabled={actionLoadingId === startup.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                                title="Reactivate business and make visible on map"
                              >
                                {actionLoadingId === startup.id ? (
                                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <RotateCcw className="w-3.5 h-3.5" />
                                )}
                                <span>Reactivate</span>
                              </button>
                              <button
                                onClick={() => navigate(`/startup/${startup.id}`)}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="View details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-gray-100 px-6">
                <ActivityPaginationControls />
              </div>
            </div>
          </div>
        )}

        {/* Startup Review Tab Content */}
        {activeTab === "review" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Startup Application Review
            </h2>
            <p className="text-gray-600 mb-6">
              Review and evaluate startup applications for incubation and funding
              eligibility.
            </p>

            <StartupReviewSection
              selectedStartupId={selectedReviewStartupId}
              onRefresh={refreshDashboard}
            />
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
      </main>

      <footer className="bg-white p-4 border-t">
        <div className="text-center text-sm text-gray-500">
          © 2025 StartupSphere Philippines | Supporting DTI, DICT, and DOST
        </div>
      </footer>

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}
