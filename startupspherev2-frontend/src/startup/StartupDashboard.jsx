import { getBackendUrl, getAuthHeaders } from "../config/apiConfig";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { FaEye, FaFacebook, FaInstagram } from "react-icons/fa";
import { BiLike } from "react-icons/bi";
import { FaBookBookmark } from "react-icons/fa6";
import {
  ArrowLeft,
  ArrowRight,
  Edit,
  Trash2,
  Save,
  X,
  ExternalLink,
  PlayCircle,
  ShieldCheck,
  CheckCircle2,
  Layers,
  TrendingUp,
  Percent,
  Building,
  Award,
  RefreshCw,
  Coins,
  Building2,
  Wallet,
  FileSpreadsheet,
  PieChart,
  Sparkles,
  MapPin,
  FileText,
  Download,
  Calendar,
  BarChart2,
  Zap,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import loginLogo from "/StartUpSphere_loginLogo.png";
import FundingBreakdownModal from "../modals/FundingBreakdownModal";
import StartupCategoryDiversity from "../components/StartupCategoryDiversity";
import { fetchStartupSocialMetrics } from "../services/socialEngagementService";
import TooltipInfo from "../components/TooltipInfo";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
} from "chart.js";
import { Doughnut, Line, Bar } from "react-chartjs-2";
import Card from "../components/Card";
import CardContent from "../components/CardContent";
import { useNavigate } from "react-router-dom";
import Verification from "../modals/DashboardVerification";
import { toast } from "react-toastify";
import Alert from "@mui/material/Alert";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement
);

export default function StartupDashboard({ openAddMethodModal }) {
  const [startupIds, setStartupIds] = useState([]);
  const [startups, setStartups] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [selectedStartup, setSelectedStartup] = useState("all");
  const [logoUrls, setLogoUrls] = useState({});
  const [syncingSocialId, setSyncingSocialId] = useState(null);
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);

  // User Venture Reports state
  const USER_REPORT_METRICS = [
    "Views & Reach",
    "Likes & Interest",
    "Bookmarks & Saves",
    "Funding & Capital",
    "Social Engagement",
    "Government Compliance & TRL",
    "Venture Portfolio Details",
    "Ecosystem Benchmarks (IDI / SI / EBS / EGS)",
  ];
  const [reportTimePeriod, setReportTimePeriod] = useState("2025 (YTD)");
  const [selectedReportMetrics, setSelectedReportMetrics] = useState(USER_REPORT_METRICS);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [generatedUserReports, setGeneratedUserReports] = useState([]);

  // Scoped strictly to the user / business found only on the user dashboard
  const userTotalFunding = useMemo(() => {
    if (!startups || startups.length === 0) return 0;
    if (selectedStartup !== "all") {
      const target = startups.find((s) => String(s.id) === String(selectedStartup));
      if (!target) return 0;
      return (
        Number(target.totalStartupFundingReceived || target.paidUpCapital || 0) +
        Number(target.amountOfGovernmentGrantsOrSubsidiesReceived || 0)
      );
    }
    return startups.reduce(
      (acc, s) =>
        acc +
        Number(s.totalStartupFundingReceived || s.paidUpCapital || 0) +
        Number(s.amountOfGovernmentGrantsOrSubsidiesReceived || 0),
      0
    );
  }, [startups, selectedStartup]);

  // Grand total funding of all startups owned by this user
  const allStartupsTotalFunding = useMemo(() => {
    if (!startups || startups.length === 0) return 0;
    return startups.reduce(
      (acc, s) =>
        acc +
        Number(s.totalStartupFundingReceived || s.paidUpCapital || 0) +
        Number(s.amountOfGovernmentGrantsOrSubsidiesReceived || 0),
      0
    );
  }, [startups]);

  const formatUserFunding = (val) => {
    const num = Number(val) || 0;
    if (num >= 1_000_000_000) return `₱${(num / 1_000_000_000).toFixed(2)}B`;
    if (num >= 1_000_000) return `₱${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `₱${(num / 1_000).toFixed(0)}K`;
    return `₱${num.toLocaleString()}`;
  };

  const userCategoriesCount = useMemo(() => {
    if (!startups || startups.length === 0) return 0;
    const uniqueCats = new Set(startups.map((s) => s.industry?.trim()).filter(Boolean));
    return uniqueCats.size;
  }, [startups]);

  const [metrics, setMetrics] = useState({
    views: 0,
    likes: 0,
    bookmarks: 0,
  });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [globalMetrics, setGlobalMetrics] = useState({
    idi: 0,
    si: 0,
    ebs: 0,
    egs: 0
  });

  const fetchGlobalMetrics = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/metrics/dashboard`, {
        headers: getAuthHeaders(),
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setGlobalMetrics(data);
      }
    } catch (error) {
      console.error("Failed to fetch global metrics", error);
    }
  };

  useEffect(() => {
    fetchGlobalMetrics();
  }, []);

  const [isAddMethodModalOpen, setIsAddMethodModalOpen] = useState(false);

  const handleAddStartupClick = () => {
    setIsAddMethodModalOpen(true);
  };

  // State for editing
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  // State for verification modal
  const [verificationModal, setVerificationModal] = useState(false);
  const [selectedStartupId, setSelectedStartupId] = useState(null);
  const [selectedContactEmail, setSelectedContactEmail] = useState(null);

  // State for delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    startupId: null,
    startupName: "",
    isDeleting: false,
    error: null,
  });

  // State for delete draft confirmation modal
  const [deleteDraftModal, setDeleteDraftModal] = useState({
    isOpen: false,
    draftId: null,
    draftName: "",
    isDeleting: false,
    error: null,
  });

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const [donutData, setDonutData] = useState({
    labels: ["Likes", "Bookmarks", "Views"],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b"],
        borderWidth: 0,
      },
    ],
  });

  const fetchCompanyLogo = async (startupId) => {
    // Skip if already fetching or fetched
    if (logoUrls[startupId] || logoUrls[startupId] === null) {
      return;
    }

    try {
      const response = await fetch(
        `${getBackendUrl()}/startups/${startupId}/photo`,
        {
          headers: getAuthHeaders(),
          credentials: "include",
          // Add cache control for faster subsequent loads
          cache: "force-cache",
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setLogoUrls((prev) => ({
          ...prev,
          [startupId]: imageUrl,
        }));
      } else {
        // Mark as failed to avoid refetching
        setLogoUrls((prev) => ({
          ...prev,
          [startupId]: null,
        }));
      }
    } catch (error) {
      console.error(`Error fetching logo for startup ${startupId}:`, error);
      // Mark as failed to avoid refetching
      setLogoUrls((prev) => ({
        ...prev,
        [startupId]: null,
      }));
    }
  };

  const fetchDrafts = async () => {
    try {
      const res = await fetch(
        `${getBackendUrl()}/startups/my-drafts`,
        {
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      // If no draft → 204 or error
      if (res.status === 204 || !res.ok) {
        setDrafts([]); // ← Important: clear drafts
        return;
      }

      const rawDraft = await res.json();

      // Backend returns the draft object directly with all fields
      // For backwards compatibility, check if formData is stringified
      let draftData;
      if (rawDraft.formData) {
        // Old format: { formData: "...", selectedTab: "..." }
        try {
          draftData =
            typeof rawDraft.formData === "string"
              ? JSON.parse(rawDraft.formData)
              : rawDraft.formData;

          if (typeof draftData === "string") {
            draftData = JSON.parse(draftData);
          }
        } catch (e) {
          console.warn("Failed to parse draft formData, using raw", e);
          draftData = {};
        }
      } else {
        // New format: direct draft object with all fields
        draftData = rawDraft;
      }

      const draftObject = {
        id: rawDraft.id || draftData.id, // Use the actual draft ID from backend
        companyName: draftData.companyName || "Untitled Draft",
        industry: draftData.industry || "Not specified",
        locationName: draftData.locationName || "No location",
        contactEmail: draftData.contactEmail || "",
        foundedDate: draftData.foundedDate || null,
        selectedTab: rawDraft.selectedTab || "Company Information",
        isDraft: true,
      };

      console.log("Draft fetched from backend:", draftObject);

      // Only add draft if it has a valid ID
      if (
        draftObject.id &&
        draftObject.id !== "undefined" &&
        draftObject.id !== "null"
      ) {
        // CURRENT: Only one draft allowed → replace array
        setDrafts([draftObject]);
      } else {
        console.warn("Draft has no valid ID, skipping:", draftObject);
        setDrafts([]);
      }

      // FUTURE: When backend supports multiple drafts → just change this line to:
      // setDrafts(prev => [...prev, draftObject]);
    } catch (err) {
      console.error("Error fetching draft:", err);
      setDrafts([]);
    }
  };

  const displayList = useMemo(() => {
    const filteredStartups = startups.filter((s) =>
      [s.companyName, s.industry, s.locationName].some((field) =>
        field?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );

    // Always show published startups first, then all drafts at the bottom
    return [...filteredStartups, ...drafts];
  }, [startups, drafts, searchQuery]);

  const [rawEngagement, setRawEngagement] = useState({
    views: {},
    bookmarks: {},
    likes: {},
    funding: {},
  });
  const [selectedEngagementMonths, setSelectedEngagementMonths] = useState(months);
  const [selectedMetrics, setSelectedMetrics] = useState({
    views: true,
    bookmarks: true,
    likes: true,
    funding: true,
  });
  const [leftChartTab, setLeftChartTab] = useState("growth");

  const monthShortMap = useMemo(() => ({
    January: "Jan",
    February: "Feb",
    March: "Mar",
    April: "Apr",
    May: "May",
    June: "Jun",
    July: "Jul",
    August: "Aug",
    September: "Sep",
    October: "Oct",
    November: "Nov",
    December: "Dec",
  }), []);

  const handleSelectAllMonths = () => setSelectedEngagementMonths([...months]);
  const handleSelectQ1 = () => setSelectedEngagementMonths(["January", "February", "March"]);
  const handleSelectQ2 = () => setSelectedEngagementMonths(["April", "May", "June"]);
  const handleSelectQ3 = () => setSelectedEngagementMonths(["July", "August", "September"]);
  const handleSelectQ4 = () => setSelectedEngagementMonths(["October", "November", "December"]);
  const handleSelectH1 = () => setSelectedEngagementMonths(["January", "February", "March", "April", "May", "June"]);
  const handleSelectH2 = () => setSelectedEngagementMonths(["July", "August", "September", "October", "November", "December"]);
  const handleToggleMonth = (m) => {
    setSelectedEngagementMonths((prev) => {
      if (prev.includes(m)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== m);
      } else {
        return [...prev, m];
      }
    });
  };

  const handleToggleMetric = (metricKey) => {
    setSelectedMetrics((prev) => {
      const activeCount = Object.values(prev).filter(Boolean).length;
      if (prev[metricKey] && activeCount === 1) return prev;
      return { ...prev, [metricKey]: !prev[metricKey] };
    });
  };
  const handleSelectAllMetrics = () => {
    setSelectedMetrics({ views: true, bookmarks: true, likes: true, funding: true });
  };

  // Grouped Column Chart Data for Monthly Engagement and Funding
  const groupedChartData = useMemo(() => {
    const activeMonths = months.filter((m) => selectedEngagementMonths.includes(m));
    const labels = activeMonths.map((m) => monthShortMap[m] || m);
    const datasets = [];

    if (selectedMetrics.views) {
      datasets.push({
        label: "Views",
        data: activeMonths.map((m) => Number(rawEngagement.views?.[m] || 0)),
        backgroundColor: "#f59e0b",
        hoverBackgroundColor: "#d97706",
        borderRadius: 4,
        barPercentage: 0.8,
        categoryPercentage: 0.8,
        yAxisID: "y",
      });
    }

    if (selectedMetrics.bookmarks) {
      datasets.push({
        label: "Bookmarks",
        data: activeMonths.map((m) => Number(rawEngagement.bookmarks?.[m] || 0)),
        backgroundColor: "#10b981",
        hoverBackgroundColor: "#059669",
        borderRadius: 4,
        barPercentage: 0.8,
        categoryPercentage: 0.8,
        yAxisID: "y",
      });
    }

    if (selectedMetrics.likes) {
      datasets.push({
        label: "Likes",
        data: activeMonths.map((m) => Number(rawEngagement.likes?.[m] || 0)),
        backgroundColor: "#3b82f6",
        hoverBackgroundColor: "#2563eb",
        borderRadius: 4,
        barPercentage: 0.8,
        categoryPercentage: 0.8,
        yAxisID: "y",
      });
    }

    if (selectedMetrics.funding) {
      datasets.push({
        label: "Funding",
        data: activeMonths.map((m) => Number(rawEngagement.funding?.[m] || 0)),
        backgroundColor: "#6366f1",
        hoverBackgroundColor: "#4f46e5",
        borderRadius: 4,
        barPercentage: 0.8,
        categoryPercentage: 0.8,
        yAxisID: "y1",
      });
    }

    return { labels, datasets };
  }, [rawEngagement, selectedEngagementMonths, selectedMetrics, months, monthShortMap]);

  // Options for Grouped Column Chart with Dual Y-Axis (Engagement Counts vs Funding in PHP)
  const groupedChartOptions = useMemo(() => ({
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          padding: 8,
          font: {
            size: 11,
            weight: "600",
          },
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        padding: 10,
        cornerRadius: 6,
        titleFont: {
          size: 12,
          weight: "bold",
        },
        bodyFont: {
          size: 11,
        },
        callbacks: {
          label: (context) => {
            if (context.dataset.label === "Funding") {
              return ` Funding: ₱${Number(context.parsed.y || 0).toLocaleString()}`;
            }
            return ` ${context.dataset.label}: ${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 10, weight: "600" },
          color: "#475569",
        },
      },
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: {
          display: true,
          text: "Engagement Count",
          font: { size: 10, weight: "600" },
          color: "#64748b",
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          font: { size: 10 },
          color: "#64748b",
          precision: 0,
        },
        beginAtZero: true,
      },
      y1: {
        type: "linear",
        display: Boolean(selectedMetrics.funding),
        position: "right",
        title: {
          display: true,
          text: "Funding (PHP)",
          font: { size: 10, weight: "600" },
          color: "#6366f1",
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: { size: 10 },
          color: "#6366f1",
          callback: (value) => {
            if (value >= 1000000) return `₱${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `₱${(value / 1000).toFixed(0)}k`;
            return `₱${value}`;
          },
        },
        beginAtZero: true,
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
  }), [selectedMetrics.funding]);

  // Growth Rate Bar Chart Data
  const growthRateData = useMemo(() => {
    if (selectedStartup !== "all") {
      const target = startups.find((s) => s.id === selectedStartup);
      if (target) {
        const rate = Number(target.averageStartupGrowthRate ?? target.growthScore ?? 0);
        return {
          labels: [target.companyName || "Selected", "Ecosystem Avg"],
          datasets: [
            {
              label: "Growth Rate (%)",
              data: [rate, 15],
              backgroundColor: ["#6366f1", "#cbd5e1"],
              hoverBackgroundColor: ["#4f46e5", "#94a3b8"],
              borderRadius: 6,
              barPercentage: 0.5,
            },
          ],
        };
      }
    }

    if (startups && startups.length > 0) {
      const displayed = startups.slice(0, 8);
      const labels = displayed.map((s) => s.companyName || "Startup");
      const data = displayed.map((s) => {
        const val = s.averageStartupGrowthRate ?? s.growthScore;
        return val !== null && val !== undefined ? Number(val) : 10;
      });
      return {
        labels,
        datasets: [
          {
            label: "Growth Rate (%)",
            data,
            backgroundColor: "#6366f1",
            hoverBackgroundColor: "#4f46e5",
            borderRadius: 6,
            barPercentage: 0.6,
          },
        ],
      };
    }

    return {
      labels: ["Target", "Baseline"],
      datasets: [
        {
          label: "Growth Rate (%)",
          data: [20, 10],
          backgroundColor: ["#6366f1", "#cbd5e1"],
          borderRadius: 6,
          barPercentage: 0.5,
        },
      ],
    };
  }, [startups, selectedStartup]);

  const growthRateOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        padding: 8,
        cornerRadius: 6,
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.parsed.y}%`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10, weight: "600" }, maxRotation: 20 },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        ticks: {
          font: { size: 10 },
          callback: (value) => `${value}%`,
        },
      },
    },
  }), []);

  const [engagementData, setEngagementData] = useState({
    labels: months,
    datasets: [
      {
        label: "Likes",
        data: Array(12).fill(0),
        borderColor: "#3b82f6",
        fill: false,
      },
      {
        label: "Bookmarks",
        data: Array(12).fill(0),
        borderColor: "#10b981",
        fill: false,
      },
      {
        label: "Views",
        data: Array(12).fill(0),
        borderColor: "#f59e0b",
        fill: false,
      },
    ],
  });

  const handleDeleteClick = (startup) => {
    setDeleteModal({
      isOpen: true,
      startupId: startup.id,
      startupName: startup.companyName || "this startup",
      isDeleting: false,
      error: null,
    });
  };

  const handleDeleteDraftClick = (draftId, draftName) => {
    console.log(
      "Attempting to delete draft with ID:",
      draftId,
      "Name:",
      draftName
    );
    setDeleteDraftModal({
      isOpen: true,
      draftId: draftId,
      draftName: draftName || "Untitled Draft",
      isDeleting: false,
      error: null,
    });
  };

  const handleDeleteDraft = async () => {
    const draftId = deleteDraftModal.draftId;
    setDeleteDraftModal({ ...deleteDraftModal, isDeleting: true, error: null });

    try {
      const response = await fetch(
        `${getBackendUrl()}/startups/draft/${draftId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete draft");
      }

      toast.success("Draft deleted successfully!");

      // Remove the draft from the state - using String() to ensure type consistency
      setDrafts((prevDrafts) =>
        prevDrafts.filter((draft) => String(draft.id) !== String(draftId))
      );

      // Close modal
      setDeleteDraftModal({
        isOpen: false,
        draftId: null,
        draftName: "",
        isDeleting: false,
        error: null,
      });
    } catch (error) {
      console.error("Error deleting draft:", error);
      setDeleteDraftModal({
        ...deleteDraftModal,
        isDeleting: false,
        error: error.message || "Failed to delete draft. Please try again.",
      });
    }

    fetchStartups();
  };

  const confirmDeleteStartup = async () => {
    const id = deleteModal.startupId;
    setDeleteModal({ ...deleteModal, isDeleting: true, error: null });

    try {
      const response = await fetch(
        `${getBackendUrl()}/startups/${id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`Error deleting startup: ${response.status}`);
      }

      const updatedStartups = startups.filter((startup) => startup.id !== id);
      setStartups(updatedStartups);

      const updatedIds = startupIds.filter((startupId) => startupId !== id);
      setStartupIds(updatedIds);

      setActionSuccess("Startup deleted successfully");
      setTimeout(() => setActionSuccess(null), 3000);

      if (selectedStartup === id) {
        setSelectedStartup("all");
        await recalculateAllMetrics(updatedIds, updatedStartups);
      } else if (selectedStartup === "all") {
        await recalculateAllMetrics(updatedIds, updatedStartups);
      } else {
        await recalculateAllMetrics(updatedIds, updatedStartups);
      }

      // Close the modal after successful deletion
      setDeleteModal({
        isOpen: false,
        startupId: null,
        startupName: "",
        isDeleting: false,
        error: null,
      });
    } catch (error) {
      console.error("Error deleting startup:", error);
      setDeleteModal({
        ...deleteModal,
        isDeleting: false,
        error: error.message || "Failed to delete startup. Please try again.",
      });
    }
  };

  const recalculateAllMetrics = async (ids, updatedStartupsArray) => {
    if (!ids || ids.length === 0) {
      setMetrics({ views: 0, likes: 0, bookmarks: 0 });
      setDonutData({
        labels: ["No Data"],
        datasets: [
          {
            data: [1],
            backgroundColor: ["#cccccc"],
            borderWidth: 0,
          },
        ],
      });
      setRawEngagement({
        views: {},
        bookmarks: {},
        likes: {},
        funding: {},
      });
      setEngagementData({
        labels: months,
        datasets: [
          {
            label: "Views",
            data: Array(12).fill(0),
            borderColor: "#f59e0b",
            fill: false,
          },
          {
            label: "Bookmarks",
            data: Array(12).fill(0),
            borderColor: "#10b981",
            fill: false,
          },
          {
            label: "Likes",
            data: Array(12).fill(0),
            borderColor: "#3b82f6",
            fill: false,
          },
        ],
      });
      return;
    }

    try {
      const totalMetrics = await fetchTotalMetrics(ids);

      if (totalMetrics) {
        const colors = updatedStartupsArray.map(
          (_, index) =>
            `hsl(${(index * 360) / updatedStartupsArray.length}, 70%, 50%)`
        );

        const startupMetrics = updatedStartupsArray.map((startup) => {
          return startup.likes || 1;
        });

        setDonutData({
          labels: updatedStartupsArray.map((startup) => startup.companyName),
          datasets: [
            {
              data: startupMetrics,
              backgroundColor: colors,
              borderWidth: 0,
            },
          ],
        });
      }

      await fetchAllStartupsEngagementData();
    } catch (error) {
      console.error("Error recalculating metrics after deletion:", error);
    }
  };

  const handleNavigateToUpdate = (startup) => {
    navigate(`/update-startup/${startup.id}`, { state: { startup } });
  };

  const fetchStartupIds = async () => {
    try {
      setError(null);
      const response = await fetch(
        `${getBackendUrl()}/startups/my-startups`,
        {
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          setError("Your session has expired or you are unauthorized. Please sign in again.");
          setStartupIds([]);
          return [];
        }
        throw new Error(`Error fetching startup IDs: ${response.status}`);
      }

      const data = await response.json();
      console.log("Startup IDs fetched successfully: ", data);

      if (Array.isArray(data)) {
        setStartupIds(data);
        return data;
      } else {
        console.error("Expected array of startup IDs but got:", data);
        setStartupIds([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching startup IDs:", error);
      setError("Failed to load startup IDs. Please try again later.");
      setStartupIds([]);
      return [];
    }
  };

  const fetchStartups = async () => {
    try {
      setError(null);
      const response = await fetch(
        `${getBackendUrl()}/startups/my-startups/details`,
        {
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          setError("Your session has expired or you are unauthorized. Please sign in again.");
          setStartups([]);
          return [];
        }
        throw new Error(`Error fetching startups: ${response.status}`);
      }

      const data = await response.json();
      console.log("Startups fetched successfully: ", data);

      if (Array.isArray(data)) {
        const unique = Array.from(new Map(data.map((s) => [s.id, s])).values());
        setStartups(unique);

        // Auto-sync social metrics in background for startups with links that haven't fetched yet
        unique.forEach((s) => {
          if (
            (s.facebook || s.instagram) &&
            ((!s.facebookFollowers && !s.facebookLikes) || !s.instagramFollowers)
          ) {
            fetchStartupSocialMetrics(s)
              .then((res) => {
                let updatedFbFollowers = s.facebookFollowers || 0;
                let updatedFbLikes = s.facebookLikes || 0;
                let updatedIgFollowers = s.instagramFollowers || 0;
                let changed = false;

                if (res.facebook && res.facebook.success) {
                  if (res.facebook.followers) {
                    updatedFbFollowers = res.facebook.followers;
                    changed = true;
                  }
                  if (res.facebook.likes) {
                    updatedFbLikes = res.facebook.likes;
                    changed = true;
                  }
                }

                if (res.instagram && res.instagram.success && res.instagram.followers) {
                  updatedIgFollowers = res.instagram.followers;
                  changed = true;
                }

                if (changed) {
                  setStartups((prev) =>
                    prev.map((item) =>
                      item.id === s.id
                        ? {
                            ...item,
                            facebookFollowers: updatedFbFollowers,
                            facebookLikes: updatedFbLikes,
                            instagramFollowers: updatedIgFollowers,
                          }
                        : item
                    )
                  );
                }
              })
              .catch(() => {});
          }
        });

        return unique;
      } else {
        console.error("Expected array of startups but got:", data);
        setStartups([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching startups:", error);
      setError("Failed to load startup details. Please try again later.");
      setStartups([]);
      return [];
    }
  };

  const handleSyncSocial = async (startupToSync) => {
    if (!startupToSync) return;
    if (!startupToSync.facebook && !startupToSync.instagram) {
      toast.info("Please add a Facebook or Instagram link in the startup profile first.");
      return;
    }

    setSyncingSocialId(startupToSync.id);
    try {
      let syncedData = null;
      try {
        const syncRes = await fetch(`${getBackendUrl()}/api/social/sync/${startupToSync.id}`, {
          method: "POST",
          headers: getAuthHeaders(),
        });
        if (syncRes.ok) {
          const body = await syncRes.json();
          if (body && body.success) {
            syncedData = body;
          }
        }
      } catch (beErr) {
        console.debug("Backend sync endpoint error, falling back to client proxy:", beErr);
      }

      let updatedFbFollowers = startupToSync.facebookFollowers || 0;
      let updatedFbLikes = startupToSync.facebookLikes || 0;
      let updatedIgFollowers = startupToSync.instagramFollowers || 0;
      let successCount = 0;

      if (syncedData) {
        if (syncedData.facebookFollowers != null) updatedFbFollowers = syncedData.facebookFollowers;
        if (syncedData.facebookLikes != null) updatedFbLikes = syncedData.facebookLikes;
        if (syncedData.instagramFollowers != null) updatedIgFollowers = syncedData.instagramFollowers;
        successCount++;
      } else {
        const res = await fetchStartupSocialMetrics(startupToSync);
        if (res.facebook && res.facebook.success) {
          if (res.facebook.followers != null) updatedFbFollowers = res.facebook.followers;
          if (res.facebook.likes != null) updatedFbLikes = res.facebook.likes;
          successCount++;
        }

        if (res.instagram && res.instagram.success) {
          if (res.instagram.followers != null) updatedIgFollowers = res.instagram.followers;
          successCount++;
        }

        // Persist to backend database
        try {
          await fetch(`${getBackendUrl()}/startups/${startupToSync.id}`, {
            method: "PUT",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...startupToSync,
              facebookFollowers: updatedFbFollowers,
              facebookLikes: updatedFbLikes,
              instagramFollowers: updatedIgFollowers,
            }),
          });
        } catch (saveErr) {
          console.warn("Could not persist social metrics to backend:", saveErr);
        }
      }

      setStartups((prev) =>
        prev.map((s) =>
          s.id === startupToSync.id
            ? {
                ...s,
                facebookFollowers: updatedFbFollowers,
                facebookLikes: updatedFbLikes,
                instagramFollowers: updatedIgFollowers,
              }
            : s
        )
      );

      if (successCount > 0) {
        toast.success("Social engagement metrics synced live!");
      } else {
        toast.warning("Could not reach social page or no public followers found.");
      }
    } catch (err) {
      console.error("Error syncing social metrics:", err);
      toast.error("Failed to sync social metrics. Please try again.");
    } finally {
      setSyncingSocialId(null);
    }
  };

  const fetchTotalMetrics = async (ids) => {
    if (!ids || ids.length === 0) {
      console.log("No startup IDs to fetch metrics for");
      setMetrics({ views: 0, likes: 0, bookmarks: 0 });
      return;
    }

    try {
      setError(null);
      let totalLikes = 0;
      let totalBookmarks = 0;
      let totalViews = 0;

      const promises = [];

      for (const id of ids) {
        promises.push(
          fetch(
            `${getBackendUrl()}/api/likes/count/startup/${id}`,
            {
              headers: getAuthHeaders(),
              credentials: "include",
            }
          )
            .then((response) => {
              if (response.ok) return response.json();
              return 0;
            })
            .then((data) => {
              totalLikes += data;
            })
            .catch((err) => {
              console.error(`Error fetching likes for startup ${id}:`, err);
            })
        );
      }

      for (const id of ids) {
        promises.push(
          fetch(
            `${
              getBackendUrl()
            }/api/bookmarks/count/startup/${id}`,
            {
              headers: getAuthHeaders(),
              credentials: "include",
            }
          )
            .then((response) => {
              if (response.ok) return response.json();
              return 0;
            })
            .then((data) => {
              totalBookmarks += data;
            })
            .catch((err) => {
              console.error(`Error fetching bookmarks for startup ${id}:`, err);
            })
        );
      }

      for (const id of ids) {
        promises.push(
          fetch(
            `${getBackendUrl()}/startups/${id}/view-count`,
            {
              headers: getAuthHeaders(),
              credentials: "include",
            }
          )
            .then((response) => {
              if (response.ok) return response.json();
              return 0;
            })
            .then((data) => {
              totalViews += data;
            })
            .catch((err) => {
              console.error(`Error fetching views for startup ${id}:`, err);
            })
        );
      }

      await Promise.all(promises);

      const newMetrics = {
        likes: totalLikes,
        bookmarks: totalBookmarks,
        views: totalViews,
      };

      setMetrics(newMetrics);

      console.log("Total metrics:", newMetrics);

      updateDonutChart("all", totalLikes, totalBookmarks, totalViews);

      return newMetrics;
    } catch (error) {
      console.error("Error fetching total metrics:", error);
      setError("Failed to load metrics. Please try again later.");
      return null;
    }
  };

  const handleChange = async (e) => {
    const selectedId = e.target.value;
    setSelectedStartup(selectedId);
    setLoading(true);

    try {
      setError(null);
      if (selectedId === "all") {
        await fetchAllStartupsData();
      } else {
        await fetchSingleStartupData(selectedId);
      }
    } catch (error) {
      console.error("Error handling startup selection change:", error);
      setError("Failed to load selected startup data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStartupsData = async () => {
    try {
      setError(null);
      setLoading(true);

      let ids = startupIds;
      if (ids.length === 0) {
        ids = await fetchStartupIds();
      }

      const startupsData = await fetchStartups();

      // Fetch all logos in parallel for faster loading
      const logoPromises = startupsData.map((startup) =>
        fetchCompanyLogo(startup.id)
      );
      Promise.all(logoPromises).catch((err) => {
        console.error("Error fetching some logos:", err);
      });

      const totalMetrics = await fetchTotalMetrics(ids);

      if (totalMetrics) {
        updateDonutChart(
          "all",
          totalMetrics.likes,
          totalMetrics.bookmarks,
          totalMetrics.views
        );
      }

      await fetchAllStartupsEngagementData();

      await fetchStartupMetrics();
    } catch (error) {
      console.error("Error fetching all startups data:", error);
      setError("Failed to load startup metrics.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStartupMetrics = async () => {
    if (startups.length === 0) {
      console.log("No startups to fetch metrics for");
      return;
    }

    try {
      setError(null);
      const updatedStartups = [...startups];

      await Promise.all(
        updatedStartups.map(async (startup, index) => {
          try {
            const [likesResponse, bookmarksResponse, viewsResponse] =
              await Promise.all([
                fetch(
                  `${
                    getBackendUrl()
                  }/api/likes/count/startup/${startup.id}`,
                  {
                    headers: getAuthHeaders(),
                    credentials: "include",
                  }
                ),
                fetch(
                  `${
                    getBackendUrl()
                  }/api/bookmarks/count/startup/${startup.id}`,
                  {
                    headers: getAuthHeaders(),
                    credentials: "include",
                  }
                ),
                fetch(
                  `${getBackendUrl()}/startups/${
                    startup.id
                  }/view-count`,
                  {
                    headers: getAuthHeaders(),
                    credentials: "include",
                  }
                ),
              ]);

            const likesData = likesResponse.ok ? await likesResponse.json() : 0;
            const bookmarksData = bookmarksResponse.ok
              ? await bookmarksResponse.json()
              : 0;
            const viewsData = viewsResponse.ok ? await viewsResponse.json() : 0;

            updatedStartups[index] = {
              ...startup,
              likes: likesData,
              bookmarks: bookmarksData,
              views: viewsData,
            };
          } catch (error) {
            console.error(
              `Error fetching metrics for startup ${startup.id}:`,
              error
            );
            updatedStartups[index] = {
              ...startup,
              error: true,
            };
          }
        })
      );

      setStartups(updatedStartups);
    } catch (error) {
      console.error("Error fetching individual startup metrics:", error);
    }
  };

  const fetchSingleStartupData = async (startupId) => {
    try {
      setError(null);
      const [viewsResponse, likesResponse, bookmarksResponse] =
        await Promise.all([
          fetch(
            `${
              getBackendUrl()
            }/startups/${startupId}/view-count`,
            {
              headers: getAuthHeaders(),
              credentials: "include",
            }
          ),
          fetch(
            `${
              getBackendUrl()
            }/api/likes/count/startup/${startupId}`,
            {
              headers: getAuthHeaders(),
              credentials: "include",
            }
          ),
          fetch(
            `${
              getBackendUrl()
            }/api/bookmarks/count/startup/${startupId}`,
            {
              headers: getAuthHeaders(),
              credentials: "include",
            }
          ),
        ]);

      const viewsData = viewsResponse.ok ? await viewsResponse.json() : 0;
      const likesData = likesResponse.ok ? await likesResponse.json() : 0;
      const bookmarksData = bookmarksResponse.ok
        ? await bookmarksResponse.json()
        : 0;

      setMetrics({
        views: viewsData,
        likes: likesData,
        bookmarks: bookmarksData,
      });

      const selectedStartupObj = startups.find((s) => s.id === startupId);
      if (selectedStartupObj) {
        updateDonutChart(startupId, likesData, bookmarksData, viewsData);
      }

      await fetchSingleStartupEngagementData(startupId);
    } catch (error) {
      console.error(`Error fetching data for startup ID ${startupId}:`, error);
      setError("Failed to load startup data.");
    }
  };

  const updateDonutChart = (
    startupId,
    likesValue,
    bookmarksValue,
    viewsValue
  ) => {
    if (startupId === "all") {
      if (startups.length === 0) {
        setDonutData({
          labels: ["No Data"],
          datasets: [
            {
              data: [1],
              backgroundColor: ["#cccccc"],
              borderWidth: 0,
            },
          ],
        });
        return;
      }

      const colors = startups.map(
        (_, index) => `hsl(${(index * 360) / startups.length}, 70%, 50%)`
      );

      const startupMetrics = startups.map((startup) => {
        const startupLikes = startup.likes !== undefined ? startup.likes : 1;
        return Math.max(startupLikes, 1);
      });

      setDonutData({
        labels: startups.map((startup) => startup.companyName),
        datasets: [
          {
            data: startupMetrics,
            backgroundColor: colors,
            borderWidth: 0,
          },
        ],
      });
    } else {
      setDonutData({
        labels: ["Likes", "Bookmarks", "Views"],
        datasets: [
          {
            data: [likesValue, bookmarksValue, viewsValue],
            backgroundColor: ["#3b82f6", "#10b981", "#f59e0b"],
            borderWidth: 0,
          },
        ],
      });
    }
  };

  const fetchAllStartupsEngagementData = async () => {
    try {
      setError(null);
      const [viewsResponse, bookmarksResponse, likesResponse, investmentsResponse] =
        await Promise.all([
          fetch(
            `${
              getBackendUrl()
            }/api/views/grouped-by-month/logged-in-user-startups`,
            {
              headers: getAuthHeaders(),
              credentials: "include",
            }
          ),
          fetch(
            `${
              getBackendUrl()
            }/api/bookmarks/grouped-by-month/logged-in-user-startups`,
            {
              headers: getAuthHeaders(),
              credentials: "include",
            }
          ),
          fetch(
            `${
              getBackendUrl()
            }/api/likes/grouped-by-month/logged-in-user-startups`,
            {
              headers: getAuthHeaders(),
              credentials: "include",
            }
          ),
          fetch(
            `${
              getBackendUrl()
            }/api/investments/received`,
            {
              headers: getAuthHeaders(),
              credentials: "include",
            }
          ),
        ]);

      const viewsData = viewsResponse.ok ? await viewsResponse.json() : {};
      const bookmarksData = bookmarksResponse.ok
        ? await bookmarksResponse.json()
        : {};
      const likesData = likesResponse.ok ? await likesResponse.json() : {};

      // Compute actual funding received per month across all user's startups
      const fundingByMonth = {};
      months.forEach((m) => {
        fundingByMonth[m] = 0;
      });

      if (investmentsResponse.ok) {
        const invJson = await investmentsResponse.json();
        const investments = invJson.data || [];
        investments.forEach((deal) => {
          if (deal.stage === "CLOSED_DEAL" || deal.fundDisbursed === true) {
            const dateStr = deal.updatedAt || deal.createdAt;
            if (dateStr) {
              const d = new Date(dateStr);
              if (!isNaN(d.getTime())) {
                const monthName = months[d.getMonth()];
                if (monthName) {
                  const cleaned = String(deal.amountRange || deal.message || "0").replace(/[^0-9.]/g, "");
                  const parsedAmt = parseFloat(cleaned);
                  if (!isNaN(parsedAmt) && parsedAmt > 0) {
                    fundingByMonth[monthName] = (fundingByMonth[monthName] || 0) + parsedAmt;
                  }
                }
              }
            }
          }
        });
      }

      console.log("All startups engagement & funding data:", {
        views: viewsData,
        bookmarks: bookmarksData,
        likes: likesData,
        funding: fundingByMonth,
      });

      updateEngagementChart(viewsData, bookmarksData, likesData, fundingByMonth);
    } catch (error) {
      console.error("Error fetching engagement data for all startups:", error);
    }
  };

  const fetchSingleStartupEngagementData = async (startupId) => {
    try {
      setError(null);
      const [viewsResponse, bookmarksResponse, likesResponse, investmentsResponse] =
        await Promise.all([
          fetch(
            `${
              getBackendUrl()
            }/api/views/count-by-month/${startupId}`,
            {
              headers: getAuthHeaders(),
              credentials: "include",
            }
          ),
          fetch(
            `${
              getBackendUrl()
            }/api/bookmarks/grouped-by-month/startup/${startupId}`,
            {
              headers: getAuthHeaders(),
              credentials: "include",
            }
          ),
          fetch(
            `${
              getBackendUrl()
            }/api/likes/grouped-by-month/startup/${startupId}`,
            {
              headers: getAuthHeaders(),
              credentials: "include",
            }
          ),
          fetch(
            `${
              getBackendUrl()
            }/api/investments/received`,
            {
              headers: getAuthHeaders(),
              credentials: "include",
            }
          ),
        ]);

      const viewsData = viewsResponse.ok ? await viewsResponse.json() : {};
      const bookmarksData = bookmarksResponse.ok
        ? await bookmarksResponse.json()
        : {};
      const likesData = likesResponse.ok ? await likesResponse.json() : {};

      const fundingByMonth = {};
      months.forEach((m) => {
        fundingByMonth[m] = 0;
      });

      if (investmentsResponse.ok) {
        const invJson = await investmentsResponse.json();
        const investments = invJson.data || [];
        investments.forEach((deal) => {
          if (
            deal.startup &&
            String(deal.startup.id) === String(startupId) &&
            (deal.stage === "CLOSED_DEAL" || deal.fundDisbursed === true)
          ) {
            const dateStr = deal.updatedAt || deal.createdAt;
            if (dateStr) {
              const d = new Date(dateStr);
              if (!isNaN(d.getTime())) {
                const monthName = months[d.getMonth()];
                if (monthName) {
                  const cleaned = String(deal.amountRange || deal.message || "0").replace(/[^0-9.]/g, "");
                  const parsedAmt = parseFloat(cleaned);
                  if (!isNaN(parsedAmt) && parsedAmt > 0) {
                    fundingByMonth[monthName] = (fundingByMonth[monthName] || 0) + parsedAmt;
                  }
                }
              }
            }
          }
        });
      }

      console.log("Single startup engagement & funding data:", {
        views: viewsData,
        bookmarks: bookmarksData,
        likes: likesData,
        funding: fundingByMonth,
      });

      updateEngagementChart(viewsData, bookmarksData, likesData, fundingByMonth);
    } catch (error) {
      console.error(
        `Error fetching engagement data for startup ID ${startupId}:`,
        error
      );
    }
  };

  const updateEngagementChart = (viewsData, bookmarksData, likesData, fundingData = {}) => {
    const normalizedViewsData = typeof viewsData === "object" ? viewsData : {};
    const normalizedBookmarksData =
      typeof bookmarksData === "object" ? bookmarksData : {};
    const normalizedLikesData = typeof likesData === "object" ? likesData : {};
    const normalizedFundingData = typeof fundingData === "object" ? fundingData : {};

    setRawEngagement({
      views: normalizedViewsData,
      bookmarks: normalizedBookmarksData,
      likes: normalizedLikesData,
      funding: normalizedFundingData,
    });

    const viewsValues = months.map((month) => normalizedViewsData[month] || 0);
    const bookmarksValues = months.map(
      (month) => normalizedBookmarksData[month] || 0
    );
    const likesValues = months.map((month) => normalizedLikesData[month] || 0);
    const fundingValues = months.map((month) => normalizedFundingData[month] || 0);

    setEngagementData({
      labels: months,
      datasets: [
        {
          label: "Views",
          data: viewsValues,
          borderColor: "#f59e0b",
          fill: false,
          tension: 0.1,
        },
        {
          label: "Bookmarks",
          data: bookmarksValues,
          borderColor: "#10b981",
          fill: false,
          tension: 0.1,
        },
        {
          label: "Likes",
          data: likesValues,
          borderColor: "#3b82f6",
          fill: false,
          tension: 0.1,
        },
        {
          label: "Funding",
          data: fundingValues,
          borderColor: "#6366f1",
          fill: false,
          tension: 0.1,
        },
      ],
    });
  };

  const handleEditStartup = (startup) => {
    setEditingId(startup.id);
    setEditFormData({
      companyName: startup.companyName || "",
      industry: startup.industry || "",
      foundedDate: startup.foundedDate
        ? new Date(startup.foundedDate).toISOString().split("T")[0]
        : "",
      contactEmail: startup.contactEmail || "",
      phoneNumber: startup.phoneNumber || "",
      website: startup.website || "",
      locationName: startup.locationName || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  const handleUpdateStartup = async (id) => {
    setSubmitting(true);
    try {
      const response = await fetch(
        `${getBackendUrl()}/startups/${id}`,
        {
          method: "PUT",
          headers: getAuthHeaders({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify(editFormData),
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`Error updating startup: ${response.status}`);
      }

      const updatedStartups = startups.map((startup) =>
        startup.id === id ? { ...startup, ...editFormData } : startup
      );
      setStartups(updatedStartups);

      setActionSuccess("Startup updated successfully");
      setTimeout(() => setActionSuccess(null), 3000);

      setEditingId(null);
      setEditFormData({});
    } catch (error) {
      console.error("Error updating startup:", error);
      setError("Failed to update startup. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleReportMetric = (metric) => {
    setSelectedReportMetrics((prev) =>
      prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric]
    );
  };

  const generateUserMetricsReport = async ({
    title = "Venture Metrics Report",
    description,
    metricsToInclude = selectedReportMetrics,
  } = {}) => {
    if (!metricsToInclude || metricsToInclude.length === 0) {
      toast.warning("Please select at least one metric to generate a report.");
      return;
    }

    const scopedStartups =
      selectedStartup === "all"
        ? startups
        : startups.filter((s) => String(s.id) === String(selectedStartup));

    if (!scopedStartups || scopedStartups.length === 0) {
      toast.warning("No venture data available to generate a report.");
      return;
    }

    setIsGeneratingReport(true);
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const scopeLabel =
        selectedStartup === "all"
          ? `All Portfolio Startups (${scopedStartups.length})`
          : scopedStartups[0]?.companyName || "Selected Venture";

      // Branded Header
      doc.setFillColor(29, 53, 87);
      doc.rect(0, 0, 210, 40, "F");
      try {
        doc.addImage(loginLogo, "PNG", 14, 8, 42, 22);
      } catch (e) {
        // Ignore logo load issues
      }
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(title, 62, 20);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("StartupSphere Philippines • User Venture & Metrics Report", 62, 29);

      // Meta box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 46, 182, 24, 2, 2, "FD");
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.text(`Scope: ${scopeLabel}`, 18, 53);
      doc.setFont("helvetica", "normal");
      doc.text(`Time Period: ${reportTimePeriod}`, 18, 59);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 140, 53);
      const summaryDesc =
        description ||
        `Metrics included: ${metricsToInclude.length} selected (${metricsToInclude.slice(0, 3).join(", ")}${metricsToInclude.length > 3 ? "..." : ""})`;
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(doc.splitTextToSize(summaryDesc, 174), 18, 65);

      let currentY = 76;

      // KPI Summary Row
      const kpis = [
        { label: "TOTAL VIEWS", value: String(metrics.views || 0), bg: [254, 243, 199], text: [180, 83, 9] },
        { label: "TOTAL LIKES", value: String(metrics.likes || 0), bg: [239, 246, 255], text: [29, 78, 216] },
        { label: "BOOKMARKS", value: String(metrics.bookmarks || 0), bg: [236, 253, 245], text: [4, 120, 87] },
        {
          label: "TOTAL FUNDING",
          value: `PHP ${Number(userTotalFunding || 0).toLocaleString()}`,
          bg: [238, 242, 255],
          text: [67, 56, 202],
        },
      ];
      const boxW = 43;
      kpis.forEach((kpi, idx) => {
        const x = 14 + idx * (boxW + 3.3);
        doc.setFillColor(...kpi.bg);
        doc.roundedRect(x, currentY, boxW, 18, 2, 2, "F");
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...kpi.text);
        doc.text(kpi.label, x + 3, currentY + 6);
        doc.setFontSize(11);
        doc.text(kpi.value, x + 3, currentY + 14);
      });
      currentY += 25;

      const ensureSpace = (needed = 40) => {
        if (currentY + needed > 275) {
          doc.addPage();
          currentY = 18;
        }
      };

      // 1. Engagement & Reach
      if (
        metricsToInclude.includes("Views & Reach") ||
        metricsToInclude.includes("Likes & Interest") ||
        metricsToInclude.includes("Bookmarks & Saves")
      ) {
        ensureSpace(45);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("Engagement & Reach Metrics", 14, currentY);

        const engRows = [];
        if (metricsToInclude.includes("Views & Reach")) {
          engRows.push(["Total Profile Views", String(metrics.views || 0), "Platform visibility & reach"]);
        }
        if (metricsToInclude.includes("Likes & Interest")) {
          const likeRate = metrics.views > 0 ? `${((metrics.likes / metrics.views) * 100).toFixed(1)}%` : "0.0%";
          engRows.push(["Total Likes", String(metrics.likes || 0), `Like-to-view rate: ${likeRate}`]);
        }
        if (metricsToInclude.includes("Bookmarks & Saves")) {
          const saveRate = metrics.views > 0 ? `${((metrics.bookmarks / metrics.views) * 100).toFixed(1)}%` : "0.0%";
          engRows.push(["Total Bookmarks", String(metrics.bookmarks || 0), `Bookmark-to-view rate: ${saveRate}`]);
        }

        autoTable(doc, {
          startY: currentY + 3,
          head: [["Metric", "Value", "Insight"]],
          body: engRows,
          theme: "grid",
          headStyles: { fillColor: [29, 53, 87], textColor: [255, 255, 255], fontSize: 8.5 },
          styles: { fontSize: 8, cellPadding: 2.5 },
          margin: { left: 14, right: 14 },
        });
        currentY = doc.lastAutoTable.finalY + 8;
      }

      // 2. Funding & Capital
      if (metricsToInclude.includes("Funding & Capital")) {
        ensureSpace(45);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("Funding & Capital Breakdown", 14, currentY);

        const fundingRows = scopedStartups.map((s) => {
          const base = Number(s.totalStartupFundingReceived || s.paidUpCapital || 0);
          const grants = Number(s.amountOfGovernmentGrantsOrSubsidiesReceived || 0);
          return [
            s.companyName || "Unnamed Venture",
            s.fundingStage || "N/A",
            `PHP ${base.toLocaleString()}`,
            `PHP ${grants.toLocaleString()}`,
            `PHP ${(base + grants).toLocaleString()}`,
          ];
        });

        autoTable(doc, {
          startY: currentY + 3,
          head: [["Venture", "Stage", "Capital / Funding", "Gov. Grants", "Total Funding"]],
          body: fundingRows,
          theme: "grid",
          headStyles: { fillColor: [29, 53, 87], textColor: [255, 255, 255], fontSize: 8.5 },
          styles: { fontSize: 8, cellPadding: 2.5 },
          margin: { left: 14, right: 14 },
        });
        currentY = doc.lastAutoTable.finalY + 8;
      }

      // 3. Social Engagement
      if (metricsToInclude.includes("Social Engagement")) {
        ensureSpace(45);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("Social Media Engagement", 14, currentY);

        const socialRows = scopedStartups.map((s) => [
          s.companyName || "Unnamed Venture",
          String(s.facebookFollowers || 0),
          String(s.facebookLikes || 0),
          String(s.instagramFollowers || 0),
        ]);

        autoTable(doc, {
          startY: currentY + 3,
          head: [["Venture", "Facebook Followers", "Facebook Likes", "Instagram Followers"]],
          body: socialRows,
          theme: "grid",
          headStyles: { fillColor: [29, 53, 87], textColor: [255, 255, 255], fontSize: 8.5 },
          styles: { fontSize: 8, cellPadding: 2.5 },
          margin: { left: 14, right: 14 },
        });
        currentY = doc.lastAutoTable.finalY + 8;
      }

      // 4. Government Compliance & TRL
      if (metricsToInclude.includes("Government Compliance & TRL")) {
        ensureSpace(45);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("Government Compliance & TRL Readiness", 14, currentY);

        const complianceRows = scopedStartups.map((s) => [
          s.companyName || "Unnamed Venture",
          s.isGovernmentRegistered ? "Yes" : "No",
          s.registrationAgency || (s.isGovernmentRegistered ? "Registered" : "N/A"),
          s.trlLevel || "N/A",
          s.status || "Pending",
        ]);

        autoTable(doc, {
          startY: currentY + 3,
          head: [["Venture", "Gov. Registered", "Agency", "TRL Level", "Review Status"]],
          body: complianceRows,
          theme: "grid",
          headStyles: { fillColor: [29, 53, 87], textColor: [255, 255, 255], fontSize: 8.5 },
          styles: { fontSize: 8, cellPadding: 2.5 },
          margin: { left: 14, right: 14 },
        });
        currentY = doc.lastAutoTable.finalY + 8;
      }

      // 5. Venture Portfolio Details
      if (metricsToInclude.includes("Venture Portfolio Details")) {
        ensureSpace(45);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("Venture Portfolio Directory", 14, currentY);

        const detailRows = scopedStartups.map((s) => [
          s.companyName || "Unnamed Venture",
          s.industry || "General",
          s.city || s.locationName || "N/A",
          String(s.numberOfEmployees || 0),
          String(s.foundedYear || "N/A"),
        ]);

        autoTable(doc, {
          startY: currentY + 3,
          head: [["Venture", "Industry", "Location", "Employees", "Founded"]],
          body: detailRows,
          theme: "grid",
          headStyles: { fillColor: [29, 53, 87], textColor: [255, 255, 255], fontSize: 8.5 },
          styles: { fontSize: 8, cellPadding: 2.5 },
          margin: { left: 14, right: 14 },
        });
        currentY = doc.lastAutoTable.finalY + 8;
      }

      // 6. Ecosystem Benchmarks
      if (metricsToInclude.includes("Ecosystem Benchmarks (IDI / SI / EBS / EGS)")) {
        ensureSpace(45);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("Ecosystem Benchmarks", 14, currentY);

        autoTable(doc, {
          startY: currentY + 3,
          head: [["Index", "Score", "Description"]],
          body: [
            ["Innovation Density Index (IDI)", String(globalMetrics.idi || 0), "Regional innovation concentration"],
            ["Startup Index (SI)", String(globalMetrics.si || 0), "Overall startup ecosystem activity"],
            ["Ecosystem Business Score (EBS)", String(globalMetrics.ebs || 0), "Business viability & support"],
            ["Ecosystem Growth Score (EGS)", String(globalMetrics.egs || 0), "Growth momentum across ventures"],
          ],
          theme: "grid",
          headStyles: { fillColor: [29, 53, 87], textColor: [255, 255, 255], fontSize: 8.5 },
          styles: { fontSize: 8, cellPadding: 2.5 },
          margin: { left: 14, right: 14 },
        });
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 116, 139);
        doc.text(
          `Page ${i} of ${pageCount} | StartupSphere Philippines`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      }

      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const dateStr = new Date().toISOString().split("T")[0];
      doc.save(`${slug}-${dateStr}.pdf`);

      setGeneratedUserReports((prev) => [
        {
          id: Date.now(),
          title,
          scope: scopeLabel,
          metricsCount: metricsToInclude.length,
          date: new Date().toLocaleDateString(),
        },
        ...prev,
      ]);
      toast.success(`${title} downloaded successfully!`);
    } catch (err) {
      console.error("Error generating user report:", err);
      toast.error("Failed to generate report. Please try again.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleFilterClick = (filter) => {
    setActiveFilter(filter);

    if (filter === "Likes") {
      setSelectedMetrics({ likes: true, bookmarks: false, views: false });
    } else if (filter === "Bookmarks") {
      setSelectedMetrics({ likes: false, bookmarks: true, views: false });
    } else if (filter === "Views") {
      setSelectedMetrics({ likes: false, bookmarks: false, views: true });
    } else if (filter === "All") {
      setSelectedMetrics({ likes: true, bookmarks: true, views: true });
    }

    if (selectedStartup === "all") {
      fetchAllStartupsData();
    } else {
      fetchSingleStartupData(selectedStartup);
    }
  };

  const centerTextPlugin = {
    id: "centerText",
    beforeDraw(chart) {
      const { width, height, ctx } = chart;
      ctx.save();

      let text, subText;
      if (selectedStartup === "all") {
        text = "All Startups";
        subText = `${startups.length} Companies`;
      } else {
        const selectedStartupObj = startups.find(
          (s) => s.id === selectedStartup
        );
        text = selectedStartupObj?.companyName || "Startup";
        subText = selectedStartupObj?.industry || "";
      }

      const mainFontSize = Math.min(width, height) * 0.1;
      const subFontSize = mainFontSize * 0.5;

      const centerX = width / 2;
      const centerY = height / 2;

      ctx.font = `bold ${mainFontSize}px sans-serif`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillStyle = "#3b82f6";

      if (text.length > 10) {
        const words = text.split(" ");
        let line = "";
        let lines = [];

        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + " ";
          if (testLine.length > 10 && i > 0) {
            lines.push(line);
            line = words[i] + " ";
          } else {
            line = testLine;
          }
        }
        lines.push(line);

        const totalHeight = lines.length * mainFontSize * 1.2;
        let startY = centerY - totalHeight / 2 + mainFontSize / 2;

        lines.forEach((line, index) => {
          ctx.fillText(
            line.trim(),
            centerX,
            startY + index * mainFontSize * 1.2
          );
        });

        if (subText) {
          ctx.font = `${subFontSize}px sans-serif`;
          ctx.fillStyle = "#64748b";
          ctx.fillText(subText, centerX, startY + totalHeight + subFontSize);
        }
      } else {
        ctx.fillText(text, centerX, centerY - (subText ? subFontSize : 0));

        if (subText) {
          ctx.font = `${subFontSize}px sans-serif`;
          ctx.fillStyle = "#64748b";
          ctx.fillText(subText, centerX, centerY + mainFontSize * 0.7);
        }
      }

      ctx.restore();
    },
  };

  const handleVerifyNow = (id, email) => {
    if (!id || !email) {
      toast.error("Cannot verify: Missing startup ID or email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Cannot verify: Invalid email format.");
      return;
    }
    setSelectedStartupId(id);
    setSelectedContactEmail(email);
    setVerificationModal(true);
  };

  const handleVerifySuccess = (verifiedStartupId) => {
    // Update the startups array to set emailVerified to true for the verified startup
    const updatedStartups = startups.map((startup) =>
      startup.id === verifiedStartupId
        ? { ...startup, emailVerified: true }
        : startup
    );
    setStartups(updatedStartups);

    // Show success notification
    setActionSuccess("Email verified successfully");
    setTimeout(() => setActionSuccess(null), 3000);

    // Recalculate metrics if necessary (similar to delete functionality)
    if (selectedStartup === "all" || selectedStartup === verifiedStartupId) {
      recalculateAllMetrics(startupIds, updatedStartups);
    }
  };

  const handleSendCode = async (id, email) => {
    try {
      const response = await fetch(
        `${getBackendUrl()}/startups/send-verification-email`,
        {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ startupId: id, email }),
          credentials: "include",
        }
      );
      if (response.ok) toast.success("Verification code sent to your email!");
      else toast.error("Failed to send verification code.");
    } catch (error) {
      console.error("Error sending code:", error);
      toast.error("Error sending verification code.");
    }
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      setLoading(true);
      try {
        // Run all three in parallel
        const [ids, startupsData] = await Promise.all([
          fetchStartupIds(),
          fetchStartups(),
          fetchDrafts(), // ← This loads your draft
        ]);

        // After startups are loaded, fetch all logos in parallel for faster loading
        if (startupsData && startupsData.length > 0) {
          const logoPromises = startupsData.map((startup) =>
            fetchCompanyLogo(startup.id)
          );
          Promise.all(logoPromises).catch((err) => {
            console.error("Error fetching some logos:", err);
          });
        }

        // Fetch metrics
        if (ids && ids.length > 0) {
          await fetchTotalMetrics(ids);
          await fetchAllStartupsEngagementData();
        }
      } catch (err) {
        console.error("Failed to initialize dashboard:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();

    // Cleanup function to revoke object URLs and prevent memory leaks
    return () => {
      Object.values(logoUrls).forEach((url) => {
        if (url && typeof url === "string" && url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []); // ← Only runs once on mount

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-10 overflow-x-hidden">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5 sm:gap-5 min-w-0">
              <button
                onClick={() => navigate("/")}
                className="group flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all duration-200 shrink-0"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                  Startup Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden lg:block">
                  Manage your startup portfolio
                </p>
              </div>
            </div>
            <button
              onClick={openAddMethodModal}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 shrink-0 cursor-pointer"
              disabled={loading}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="hidden sm:inline">Add Startup</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5">
        {/* Enhanced Alert Messages */}
        {error && (
          <div className="mb-6">
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-red-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-red-900 text-sm">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {actionSuccess && (
          <div className="mb-6">
            <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-green-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-green-900 text-sm">Success</p>
                <p className="text-sm text-green-700 mt-1">{actionSuccess}</p>
              </div>
              <button
                onClick={() => setActionSuccess(null)}
                className="text-green-400 hover:text-green-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Consolidated Portfolio Filter & Focus Toolbar */}
        <div className="mb-3.5">
          <div className="bg-white rounded-xl shadow-xs border border-gray-200/90 px-3.5 py-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Focus Startup Selector */}
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 shrink-0">
                <Building className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Focus Startup:</span>
              <div className="relative min-w-[200px] sm:min-w-[260px] flex-1 sm:flex-initial">
                <select
                  id="dashboard-startup-select"
                  value={selectedStartup}
                  onChange={handleChange}
                  className="w-full text-gray-900 text-xs sm:text-sm font-bold bg-gray-50 hover:bg-gray-100/80 rounded-lg px-3 py-1.5 pr-8 border border-gray-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer transition-all"
                  disabled={loading}
                >
                  <option value="all">All Portfolio Startups ({startups.length})</option>
                  {Array.from(new Map(startups.map((st) => [st.id, st])).values()).map((st) => (
                    <option value={st.id} key={st.id}>
                      {st.companyName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* View Metric Filters - Segmented Control */}
            <div className="inline-flex items-center p-1 bg-gray-100/90 rounded-xl border border-gray-200/60 gap-1 self-start md:self-auto overflow-x-auto max-w-full">
              {["All", "Likes", "Bookmarks", "Views", "Metrics", "Reports"].map((filter) => (
                <button
                  key={filter}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                    activeFilter === filter
                      ? "bg-white text-indigo-700 shadow-xs font-bold border border-gray-200/50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                  }`}
                  onClick={() => handleFilterClick(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeFilter === "Metrics" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* IDI Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all flex flex-col h-64">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-gray-800">Innovation Density (IDI)</h3>
                  <TooltipInfo type="IDI" size="xs" />
                </div>
                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Regional</span>
              </div>
              <div className="flex-1 w-full relative">
                <Bar
                  data={{
                    labels: ['IDI'],
                    datasets: [{
                      label: 'Value',
                      data: [globalMetrics.idi],
                      backgroundColor: '#4f46e5',
                      borderRadius: 6
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { beginAtZero: true, grid: { display: false } },
                      x: { display: false, grid: { display: false } }
                    }
                  }}
                />
              </div>
              <p className="text-2xl font-bold text-center text-indigo-600 mt-2">{globalMetrics.idi}</p>
            </div>

            {/* SI Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all flex flex-col h-64">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-gray-800">Support Index (SI)</h3>
                  <TooltipInfo type="SI" size="xs" />
                </div>
                <span className="text-[10px] font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">Enablers</span>
              </div>
              <div className="flex-1 w-full relative">
                <Bar
                  data={{
                    labels: ['SI'],
                    datasets: [{
                      label: 'Value',
                      data: [globalMetrics.si],
                      backgroundColor: '#0ea5e9',
                      borderRadius: 6
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { beginAtZero: true, grid: { display: false } },
                      x: { display: false, grid: { display: false } }
                    }
                  }}
                />
              </div>
              <p className="text-2xl font-bold text-center text-sky-500 mt-2">{globalMetrics.si}</p>
            </div>

            {/* EBS Chart (Gauge) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all flex flex-col h-64">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-gray-800">Ecosystem Balance (EBS)</h3>
                  <TooltipInfo type="EBS" size="xs" />
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Scale 0-10</span>
              </div>
              <div className="flex-1 w-full relative flex items-center justify-center pt-8">
                <Doughnut
                  data={{
                    labels: ['Score', 'Remaining'],
                    datasets: [{
                      data: [globalMetrics.ebs, Math.max(0, 10 - globalMetrics.ebs)],
                      backgroundColor: ['#10b981', '#f3f4f6'],
                      borderWidth: 0
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    circumference: 180,
                    rotation: -90,
                    cutout: '75%',
                    plugins: { legend: { display: false }, tooltip: { filter: (item) => item.dataIndex === 0 } }
                  }}
                />
                <div className="absolute inset-0 flex items-end justify-center pb-6">
                  <p className="text-3xl font-bold text-emerald-500">{globalMetrics.ebs}</p>
                </div>
              </div>
            </div>

            {/* EGS Chart (Gauge) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all flex flex-col h-64">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-gray-800">Growth Gap (EGS)</h3>
                  <TooltipInfo type="EGS" size="xs" />
                </div>
                <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Scale 0-10</span>
              </div>
              <div className="flex-1 w-full relative flex items-center justify-center pt-8">
                <Doughnut
                  data={{
                    labels: ['Score', 'Remaining'],
                    datasets: [{
                      data: [globalMetrics.egs, Math.max(0, 10 - globalMetrics.egs)],
                      backgroundColor: ['#f59e0b', '#f3f4f6'],
                      borderWidth: 0
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    circumference: 180,
                    rotation: -90,
                    cutout: '75%',
                    plugins: { legend: { display: false }, tooltip: { filter: (item) => item.dataIndex === 0 } }
                  }}
                />
                <div className="absolute inset-0 flex items-end justify-center pb-6">
                  <p className="text-3xl font-bold text-amber-500">{globalMetrics.egs}</p>
                </div>
              </div>
            </div>
          </div>
        ) : activeFilter === "Reports" ? (
          <div className="space-y-6 mb-8">
            {/* Quick Metric Reports */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    Venture Metric Reports
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Generate PDF reports scoped to{" "}
                    <span className="font-semibold text-gray-700">
                      {selectedStartup === "all"
                        ? `All Portfolio Startups (${startups.length})`
                        : startups.find((s) => String(s.id) === String(selectedStartup))?.companyName || "Selected Venture"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    title: "Portfolio Performance Report",
                    description: "Complete overview of views, likes, bookmarks, funding, and venture details.",
                    metricsToInclude: USER_REPORT_METRICS,
                  },
                  {
                    title: "Engagement & Social Reach Report",
                    description: "Detailed breakdown of profile views, likes, bookmarks, and Facebook/Instagram reach.",
                    metricsToInclude: ["Views & Reach", "Likes & Interest", "Bookmarks & Saves", "Social Engagement"],
                  },
                  {
                    title: "Funding & Readiness Report",
                    description: "Capital breakdown, government grants, TRL readiness, and ecosystem benchmarks.",
                    metricsToInclude: [
                      "Funding & Capital",
                      "Government Compliance & TRL",
                      "Ecosystem Benchmarks (IDI / SI / EBS / EGS)",
                    ],
                  },
                ].map((preset) => (
                  <div
                    key={preset.title}
                    className="border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-sm text-gray-900">{preset.title}</h3>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-100 text-indigo-700">
                          PDF
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-4">{preset.description}</p>
                    </div>
                    <button
                      type="button"
                      disabled={isGeneratingReport || startups.length === 0}
                      onClick={() => generateUserMetricsReport(preset)}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download PDF
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Metrics Report Builder */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-gray-900">Custom Metrics Report Builder</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Venture Scope
                  </label>
                  <div className="px-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg">
                    {selectedStartup === "all"
                      ? `All Portfolio Startups (${startups.length})`
                      : startups.find((s) => String(s.id) === String(selectedStartup))?.companyName || "Selected Venture"}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Time Period
                  </label>
                  <select
                    value={reportTimePeriod}
                    onChange={(e) => setReportTimePeriod(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="2025 (YTD)">2025 (YTD)</option>
                    <option value="Last 6 Months">Last 6 Months</option>
                    <option value="Last 12 Months">Last 12 Months</option>
                    <option value="All Time">All Time</option>
                  </select>
                </div>
              </div>

              <div className="mb-5">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-gray-700">Metrics to Include</span>
                  <div className="flex items-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedReportMetrics(USER_REPORT_METRICS)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedReportMetrics([])}
                      className="text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {USER_REPORT_METRICS.map((metric) => (
                    <label
                      key={metric}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer text-xs text-gray-800"
                    >
                      <input
                        type="checkbox"
                        checked={selectedReportMetrics.includes(metric)}
                        onChange={() => toggleReportMetric(metric)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{metric}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3.5 mb-5 flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-800">
                  {selectedReportMetrics.length === 0 ? (
                    "Select at least one metric to generate your custom report."
                  ) : (
                    <>
                      Your custom PDF will include <strong>{selectedReportMetrics.length} metrics</strong> for{" "}
                      <strong>
                        {selectedStartup === "all"
                          ? `All Portfolio Startups (${startups.length})`
                          : startups.find((s) => String(s.id) === String(selectedStartup))?.companyName || "Selected Venture"}
                      </strong>{" "}
                      covering <strong>{reportTimePeriod}</strong>.
                    </>
                  )}
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={isGeneratingReport || selectedReportMetrics.length === 0 || startups.length === 0}
                  onClick={() =>
                    generateUserMetricsReport({
                      title: "Custom Venture Metrics Report",
                      metricsToInclude: selectedReportMetrics,
                    })
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <FileText className="w-4 h-4" />
                  {isGeneratingReport ? "Generating..." : "Generate & Download PDF"}
                </button>
              </div>
            </div>

            {generatedUserReports.length > 0 && (
              <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Recent Downloads (This Session)</h3>
                <div className="divide-y divide-gray-100">
                  {generatedUserReports.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-gray-900">{item.title}</span>
                        <span className="text-gray-500 ml-2">• {item.scope}</span>
                      </div>
                      <span className="text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {item.metricsCount} metrics • {item.date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Primary Engagement Metric Cards with Social Engagement */}
            {(() => {
              const activeStartup = selectedStartup === "all" ? null : startups.find(s => s.id === selectedStartup);
              const fbFollowers = activeStartup 
                ? (activeStartup.facebookFollowers || 0)
                : startups.reduce((acc, s) => acc + (s.facebookFollowers || 0), 0);
              const fbLikes = activeStartup 
                ? (activeStartup.facebookLikes || 0)
                : startups.reduce((acc, s) => acc + (s.facebookLikes || 0), 0);
              const igFollowers = activeStartup 
                ? (activeStartup.instagramFollowers || 0)
                : startups.reduce((acc, s) => acc + (s.instagramFollowers || 0), 0);
              const fbUrl = activeStartup ? activeStartup.facebook : null;
              const igUrl = activeStartup ? activeStartup.instagram : null;
              const fbCount = startups.filter(s => s.facebook).length;
              const igCount = startups.filter(s => s.instagram).length;

              return (
                <div className="mb-3.5">
                  {/* Core User Portfolio & Funding Highlights */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 mb-3">
                    {/* Total Funding Card - Found only on User Dashboard */}
                    <div className="bg-gradient-to-br from-white via-emerald-50/25 to-teal-50/40 rounded-xl shadow-xs border border-emerald-200/90 p-3.5 hover:shadow-sm hover:border-emerald-300 transition-all flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 border border-emerald-200">
                            <Coins className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider block">
                              {startups.length > 1
                                ? `Total Funding of All Startups (${startups.length})`
                                : "Total Venture Funding"}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                              {selectedStartup === "all"
                                ? `Portfolio Total (${startups.length} ${startups.length === 1 ? "Startup" : "Startups"})`
                                : (activeStartup?.companyName || "Selected Venture")}
                            </span>
                          </div>
                        </div>

                        {/* Pop Up Button Breakdown */}
                        <button
                          type="button"
                          onClick={() => setIsFundingModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/90 hover:bg-emerald-200/90 border border-emerald-300 rounded-lg transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                          title="Open funding breakdown popup"
                        >
                          <Coins className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Funding Breakdown</span>
                        </button>
                      </div>

                      <div className="my-1">
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                            {loading ? (
                              <span className="inline-block w-24 h-8 bg-gray-200 rounded animate-pulse"></span>
                            ) : (
                              formatUserFunding(
                                startups.length > 1 && selectedStartup === "all"
                                  ? allStartupsTotalFunding
                                  : userTotalFunding
                              )
                            )}
                          </p>
                          <span className="text-xs text-emerald-700 font-bold">
                            Capital Raised
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 font-medium">
                          {startups.length > 1 && selectedStartup !== "all" ? (
                            <>
                              Selected: ₱{userTotalFunding.toLocaleString()} •{" "}
                              <span className="font-bold text-emerald-800">
                                All Startups: ₱{allStartupsTotalFunding.toLocaleString()}
                              </span>
                            </>
                          ) : (
                            <>
                              Exact Amount: ₱{allStartupsTotalFunding.toLocaleString()} • Combined across all your {startups.length} startups
                            </>
                          )}
                        </p>

                        {/* If user has multiple startups, show a mini per-startup funding list */}
                        {startups.length > 1 && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-emerald-100/80">
                            {startups.map((st) => {
                              const stFund =
                                Number(st.totalStartupFundingReceived || st.paidUpCapital || 0) +
                                Number(st.amountOfGovernmentGrantsOrSubsidiesReceived || 0);
                              return (
                                <button
                                  key={st.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedStartup(String(st.id));
                                    setIsFundingModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white hover:bg-emerald-50 text-[10.5px] font-semibold text-gray-700 hover:text-emerald-800 border border-emerald-200/70 cursor-pointer transition-colors shadow-2xs"
                                  title={`Click to view breakdown for ${st.companyName}`}
                                >
                                  <Building2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span className="truncate max-w-[100px]">{st.companyName}:</span>
                                  <span className="font-bold text-emerald-700">
                                    ₱{stFund.toLocaleString()}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-emerald-100/80 flex items-center justify-between text-[10.5px] text-gray-500">
                        <span>Includes: Grants, Paid-Up & Private Equity</span>
                        <span
                          onClick={() => setIsFundingModalOpen(true)}
                          className="text-emerald-700 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          View Breakdown by Startup →
                        </span>
                      </div>
                    </div>

                    {/* Total Number of Startups for that User Card */}
                    <div className="bg-gradient-to-br from-white via-indigo-50/25 to-blue-50/40 rounded-xl shadow-xs border border-indigo-200/90 p-3.5 hover:shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 border border-indigo-200">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider block">
                              Your Startups & Ventures
                            </span>
                            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
                              {selectedStartup === "all" ? "User Portfolio" : "Single Focus"}
                            </span>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 rounded-lg border border-indigo-200">
                          {userCategoriesCount} Categor{userCategoriesCount > 1 ? "ies" : "y"}
                        </span>
                      </div>

                      <div className="my-1">
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                            {loading ? (
                              <span className="inline-block w-12 h-8 bg-gray-200 rounded animate-pulse"></span>
                            ) : (
                              startups.length
                            )}
                          </p>
                          <span className="text-xs text-gray-600 font-medium">
                            Total ventures owned by you
                          </span>
                          {drafts.length > 0 && (
                            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              +{drafts.length} draft{drafts.length > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 font-medium">
                          {selectedStartup === "all"
                            ? `Showing all ${startups.length} ventures registered to your user account`
                            : `Focusing ${activeStartup?.companyName || "selected venture"} (1 of ${startups.length})`}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-indigo-100/80 flex items-center justify-between text-[10.5px] text-gray-500">
                        <span>User-Scoped Venture Directory</span>
                        <span className="text-indigo-600 font-bold">100% Owned by Your Account</span>
                      </div>
                    </div>
                  </div>

                  {/* Deal Flow & Investor Pipeline Quick Banner */}
                  <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-emerald-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-5 h-5 text-emerald-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm sm:text-base text-white">
                            Deal Flow & Investment Inquiries Pipeline
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                            Active Pipeline
                          </span>
                        </div>
                        <p className="text-xs text-emerald-100/80 mt-0.5 max-w-2xl">
                          Track when investors express interest in your startups through initial screening, founder meetings, due diligence, and term sheet closing.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("/investments")}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 active:scale-95"
                    >
                      <span>Open Deal Flow Pipeline</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Metric Cards - 5 columns on desktop, 3 on tablet, 2 on mobile to minimize vertical scrolling */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
                    {/* Views Card */}
                    <div className={`group bg-white rounded-xl shadow-xs border p-3 hover:shadow-sm transition-all flex flex-col justify-between ${
                      activeFilter === "Views"
                        ? "border-amber-400 ring-2 ring-amber-300/80 shadow-xs"
                        : "border-gray-200/90 hover:border-amber-300"
                    }`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100/80">
                          <FaEye className="h-3.5 w-3.5 text-amber-600" />
                        </div>
                        <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded border border-amber-200/80 uppercase">
                          Views
                        </span>
                      </div>
                      <div>
                        <h3 className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                          Total Views
                        </h3>
                        <p className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                          {loading ? (
                            <span className="inline-block w-12 h-6 bg-gray-200 rounded animate-pulse"></span>
                          ) : (
                            metrics.views.toLocaleString()
                          )}
                        </p>
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium mt-1.5 pt-1.5 border-t border-gray-100 truncate">
                        Platform impressions
                      </p>
                    </div>

                    {/* Bookmarks Card */}
                    <div className={`group bg-white rounded-xl shadow-xs border p-3 hover:shadow-sm transition-all flex flex-col justify-between ${
                      activeFilter === "Bookmarks"
                        ? "border-emerald-400 ring-2 ring-emerald-300/80 shadow-xs"
                        : "border-gray-200/90 hover:border-emerald-300"
                    }`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100/80">
                          <FaBookBookmark className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded border border-emerald-200/80 uppercase">
                          Saved
                        </span>
                      </div>
                      <div>
                        <h3 className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                          Bookmarks
                        </h3>
                        <p className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                          {loading ? (
                            <span className="inline-block w-12 h-6 bg-gray-200 rounded animate-pulse"></span>
                          ) : (
                            metrics.bookmarks.toLocaleString()
                          )}
                        </p>
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium mt-1.5 pt-1.5 border-t border-gray-100 truncate">
                        Interested users
                      </p>
                    </div>

                    {/* Likes Card */}
                    <div className={`group bg-white rounded-xl shadow-xs border p-3 hover:shadow-sm transition-all flex flex-col justify-between ${
                      activeFilter === "Likes"
                        ? "border-blue-400 ring-2 ring-blue-300/80 shadow-xs"
                        : "border-gray-200/90 hover:border-blue-300"
                    }`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100/80">
                          <BiLike className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-200/80 uppercase">
                          Likes
                        </span>
                      </div>
                      <div>
                        <h3 className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                          Platform Likes
                        </h3>
                        <p className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                          {loading ? (
                            <span className="inline-block w-12 h-6 bg-gray-200 rounded animate-pulse"></span>
                          ) : (
                            metrics.likes.toLocaleString()
                          )}
                        </p>
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium mt-1.5 pt-1.5 border-t border-gray-100 truncate">
                        Endorsements
                      </p>
                    </div>

                    {/* Facebook Page Engagement Card */}
                    <div className={`group bg-white rounded-xl shadow-xs border p-3 hover:shadow-sm transition-all flex flex-col justify-between ${
                      activeFilter === "Likes"
                        ? "border-blue-300 ring-1 ring-blue-200/70 shadow-2xs"
                        : "border-gray-200/90 hover:border-blue-300"
                    }`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100/80">
                          <FaFacebook className="h-3.5 w-3.5 text-[#1877F2]" />
                        </div>
                        <div className="flex items-center gap-1">
                          {activeStartup && (activeStartup.facebook || activeStartup.instagram) && (
                            <button
                              onClick={() => handleSyncSocial(activeStartup)}
                              disabled={syncingSocialId === activeStartup.id}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] font-semibold rounded border border-blue-200 transition-colors cursor-pointer"
                              title="Sync Live Metrics from Page Link"
                            >
                              <RefreshCw className={`w-2.5 h-2.5 ${syncingSocialId === activeStartup.id ? "animate-spin text-blue-600" : ""}`} />
                              <span>{syncingSocialId === activeStartup.id ? "..." : "Sync"}</span>
                            </button>
                          )}
                          {fbUrl ? (
                            <a
                              href={fbUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-[#1877F2] text-[10px] font-semibold rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                              title="Open Facebook Page"
                            >
                              <span>Page</span>
                              <ExternalLink size={8} />
                            </a>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-medium rounded">
                              {selectedStartup === "all" ? `${fbCount} Linked` : "Optional"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5 truncate">
                          FB Followers
                        </h3>
                        <div className="flex items-baseline gap-1">
                          <p className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                            {loading ? (
                              <span className="inline-block w-12 h-6 bg-gray-200 rounded animate-pulse"></span>
                            ) : (
                              fbFollowers.toLocaleString()
                            )}
                          </p>
                          <span className="text-[10px] text-gray-400 font-medium">followers</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1.5 pt-1.5 border-t border-gray-100 truncate">
                        {fbLikes > 0
                          ? `👍 ${fbLikes.toLocaleString()} likes`
                          : fbUrl
                          ? "Page linked"
                          : "Optional"}
                      </p>
                    </div>

                    {/* Instagram Audience Card */}
                    <div className="col-span-2 sm:col-span-1 group bg-white rounded-xl shadow-xs border border-gray-200/90 p-3 hover:border-pink-300 hover:shadow-sm transition-all flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="w-7 h-7 bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                          <FaInstagram className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex items-center gap-1">
                          {activeStartup && activeStartup.instagram && (
                            <button
                              onClick={() => handleSyncSocial(activeStartup)}
                              disabled={syncingSocialId === activeStartup.id}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-pink-50 text-pink-700 hover:bg-pink-100 text-[10px] font-semibold rounded border border-pink-200 transition-colors cursor-pointer"
                              title="Sync Live Metrics from Instagram Link"
                            >
                              <RefreshCw className={`w-2.5 h-2.5 ${syncingSocialId === activeStartup.id ? "animate-spin text-pink-600" : ""}`} />
                              <span>{syncingSocialId === activeStartup.id ? "..." : "Sync"}</span>
                            </button>
                          )}
                          {igUrl ? (
                            <a
                              href={igUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-pink-50 text-pink-700 text-[10px] font-semibold rounded border border-pink-200 hover:bg-pink-100 transition-colors"
                              title="Open Instagram Profile"
                            >
                              <span>IG</span>
                              <ExternalLink size={8} />
                            </a>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-medium rounded">
                              {selectedStartup === "all" ? `${igCount} Linked` : "Optional"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5 truncate">
                          Instagram Reach
                        </h3>
                        <div className="flex items-baseline gap-1">
                          <p className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                            {loading ? (
                              <span className="inline-block w-12 h-6 bg-gray-200 rounded animate-pulse"></span>
                            ) : (
                              igFollowers.toLocaleString()
                            )}
                          </p>
                          <span className="text-[10px] text-gray-400 font-medium">followers</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1.5 pt-1.5 border-t border-gray-100 truncate">
                        {igUrl ? "Profile linked" : "Optional"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Comprehensive Details Section: TRL Roadmap, BIR Government Compliance, and Conversion Rates */}
            {(() => {
              const activeStartup = selectedStartup === "all" ? null : startups.find(s => s.id === selectedStartup);
              const activeTrl = activeStartup?.trlLevel
                ? Number(String(activeStartup.trlLevel).replace(/\D/g, "")) || 4
                : 4;
              const isGovReg = activeStartup ? !!activeStartup.isGovernmentRegistered : startups.some(s => s.isGovernmentRegistered);
              const agency = activeStartup?.registrationAgency
                ? (String(activeStartup.registrationAgency).toUpperCase().includes("BIR") ? "Government Certified" : activeStartup.registrationAgency)
                : (isGovReg ? "Government Certified" : "Registered");
              const regNumber = activeStartup?.registrationNumber || (isGovReg ? "Verified" : "Pending");
              const convRate = metrics.views > 0 ? ((metrics.bookmarks / metrics.views) * 100).toFixed(1) : "0.0";
              const likeRate = metrics.views > 0 ? ((metrics.likes / metrics.views) * 100).toFixed(1) : "0.0";

              return (
                <div className="mb-3.5">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    {/* TRL Readiness Roadmap */}
                    <div className="bg-white rounded-xl shadow-xs border border-gray-200/90 p-3 sm:p-3.5 hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-indigo-600" />
                            <h3 className="text-xs sm:text-sm font-bold text-gray-900">TRL Readiness</h3>
                            <TooltipInfo type="TRL" size="xs" />
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            TRL Level {activeTrl} of 9
                          </span>
                        </div>

                        <p className="text-[11px] text-gray-500 mb-2">
                          {activeTrl <= 3
                            ? "Phase 1: Basic Research & Concept Formulation"
                            : activeTrl <= 6
                            ? "Phase 2: Working Prototype & Field Testing"
                            : "Phase 3: Market Deployment & Commercial Scaling"}
                        </p>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200 mb-2">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-500"
                            style={{ width: `${Math.min(100, (activeTrl / 9) * 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1 text-center text-[10px] text-gray-500 pt-2 border-t border-gray-100">
                        <span className={`p-1 rounded ${activeTrl <= 3 ? "bg-emerald-50 text-emerald-800 font-bold" : "bg-gray-50"}`}>
                          1-3 Concept
                        </span>
                        <span className={`p-1 rounded ${activeTrl >= 4 && activeTrl <= 6 ? "bg-amber-50 text-amber-800 font-bold" : "bg-gray-50"}`}>
                          4-6 Prototype
                        </span>
                        <span className={`p-1 rounded ${activeTrl >= 7 ? "bg-blue-50 text-blue-800 font-bold" : "bg-gray-50"}`}>
                          7-9 Market
                        </span>
                      </div>
                    </div>

                    {/* Government Registration & Government Certified Compliance */}
                    <div className="bg-white rounded-xl shadow-xs border border-gray-200/90 p-3 sm:p-3.5 hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <h3 className="text-xs sm:text-sm font-bold text-gray-900">Government Certified Status</h3>
                            <TooltipInfo type="GOV_REG" size="xs" />
                          </div>
                          {agency === "Government Certified" && (
                            <TooltipInfo type="BIR" size="xs" />
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Registration:</span>
                            <span className={`font-semibold inline-flex items-center gap-1 ${isGovReg ? "text-emerald-700" : "text-amber-600"}`}>
                              {isGovReg ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : null}
                              {isGovReg ? "Officially Registered" : "Pending Registration"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Agency:</span>
                            <span className="font-bold text-gray-800 px-2 py-0.5 rounded bg-gray-100 border border-gray-200">
                              {agency}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Certificate / Reg ID:</span>
                            <span className="font-mono font-medium text-gray-700">
                              {regNumber}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10.5px] text-gray-500">
                        <span>Regulatory Compliance</span>
                        <span className="text-emerald-600 font-bold">Good Standing</span>
                      </div>
                    </div>

                    {/* Engagement & Conversion Insights */}
                    <div className="bg-white rounded-xl shadow-xs border border-gray-200/90 p-3 sm:p-3.5 hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            <h3 className="text-xs sm:text-sm font-bold text-gray-900">Conversion Ratios</h3>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                            Efficiency
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">View-to-Bookmark Rate:</span>
                              <span className="font-bold text-emerald-700">{convRate}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${Math.min(100, Number(convRate) * 5)}%` }}
                              ></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">Engagement Like Ratio:</span>
                              <span className="font-bold text-blue-700">{likeRate}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${Math.min(100, Number(likeRate) * 5)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10.5px] text-gray-500">
                        <span>Total Active Reach:</span>
                        <span className="font-bold text-gray-800">
                          {(metrics.views + metrics.bookmarks + metrics.likes).toLocaleString()} Interactions
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

        {/* Specified Category Diversity Matrix (Shown when user has multiple startups) */}
        <StartupCategoryDiversity
          startups={startups}
          selectedStartup={selectedStartup}
          onSelectStartup={(id) => setSelectedStartup(id)}
        />

        {/* Enhanced Charts Section */}
        <div className="mb-3.5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-3.5">
            {/* Left Card: Growth Rate Bar Chart with Distribution Donut Toggle */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200/90 p-3.5 sm:p-4 hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                    {leftChartTab === "growth" ? "Portfolio Growth Rate" : "Engagement Distribution"}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {leftChartTab === "growth"
                      ? "Annual startup growth rate (%) by venture"
                      : "Proportion across portfolio activity"}
                  </p>
                </div>
                {/* Segmented Switch */}
                <div className="inline-flex items-center p-0.5 bg-gray-100 rounded-lg border border-gray-200/70 text-[10.5px]">
                  <button
                    type="button"
                    onClick={() => setLeftChartTab("growth")}
                    className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                      leftChartTab === "growth"
                        ? "bg-white text-indigo-700 shadow-2xs font-bold"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Growth Rate (Bar)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeftChartTab("distribution")}
                    className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                      leftChartTab === "distribution"
                        ? "bg-white text-indigo-700 shadow-2xs font-bold"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Distribution (Donut)
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-52">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin"></div>
                  </div>
                </div>
              ) : leftChartTab === "growth" ? (
                <div className="w-full h-52 sm:h-56 py-1">
                  <Bar data={growthRateData} options={growthRateOptions} />
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-around gap-3 py-1">
                  <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
                    <Doughnut
                      data={donutData}
                      options={{
                        maintainAspectRatio: false,
                        responsive: true,
                        plugins: {
                          legend: {
                            display: false,
                          },
                          tooltip: {
                            enabled: true,
                            backgroundColor: "rgba(0, 0, 0, 0.8)",
                            padding: 8,
                            cornerRadius: 6,
                            callbacks: {
                              title: (tooltipItems) => donutData.labels[tooltipItems[0].dataIndex],
                              label: (context) => {
                                const label = donutData.labels[context.dataIndex];
                                const value = donutData.datasets[0].data[context.dataIndex];
                                return `${label}: ${value.toLocaleString()}`;
                              },
                            },
                          },
                        },
                        cutout: "70%",
                        animation: {
                          animateRotate: true,
                          animateScale: true,
                        },
                      }}
                      plugins={[centerTextPlugin]}
                    />
                  </div>

                  {/* Breakdown List */}
                  <div className="w-full sm:w-44 space-y-1.5">
                    <div className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-amber-50/70 border border-amber-100 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                        <span className="font-semibold text-amber-950">Views</span>
                      </div>
                      <span className="font-bold text-amber-900">{metrics.views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-blue-50/70 border border-blue-100 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                        <span className="font-semibold text-blue-950">Likes</span>
                      </div>
                      <span className="font-bold text-blue-900">{metrics.likes.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                        <span className="font-semibold text-emerald-950">Bookmarks</span>
                      </div>
                      <span className="font-bold text-emerald-900">{metrics.bookmarks.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Card: Grouped Column Chart for Monthly Engagement with Multi-Month & Metric Filters */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200/90 p-3.5 sm:p-4 hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-gray-900 mb-0.5">
                      Engagement Over Time (Grouped Columns)
                    </h2>
                    <p className="text-[11px] text-gray-500">
                      Views, bookmarks, likes, and funding per month across your ventures
                    </p>
                  </div>

                  {/* Metric Filter Controls */}
                  <div className="flex items-center gap-1 self-start sm:self-auto flex-wrap">
                    <button
                      type="button"
                      onClick={handleSelectAllMetrics}
                      className="px-2 py-0.5 text-[10px] font-bold rounded border border-gray-200 hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                      title="Show all metrics"
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleMetric("views")}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-colors cursor-pointer ${
                        selectedMetrics.views
                          ? "bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-300"
                          : "bg-gray-50 text-gray-400 border-gray-200"
                      }`}
                      title="Toggle Views column"
                    >
                      Views
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleMetric("bookmarks")}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-colors cursor-pointer ${
                        selectedMetrics.bookmarks
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-300"
                          : "bg-gray-50 text-gray-400 border-gray-200"
                      }`}
                      title="Toggle Bookmarks column"
                    >
                      Bookmarks
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleMetric("likes")}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-colors cursor-pointer ${
                        selectedMetrics.likes
                          ? "bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-300"
                          : "bg-gray-50 text-gray-400 border-gray-200"
                      }`}
                      title="Toggle Likes column"
                    >
                      Likes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleMetric("funding")}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-colors cursor-pointer ${
                        selectedMetrics.funding
                          ? "bg-indigo-50 text-indigo-700 border-indigo-300 ring-1 ring-indigo-300"
                          : "bg-gray-50 text-gray-400 border-gray-200"
                      }`}
                      title="Toggle Funding column"
                    >
                      Funding
                    </button>
                  </div>
                </div>

                {/* Multi-Month Filter Toolbar */}
                <div className="mb-2 p-1.5 bg-gray-50/90 rounded-lg border border-gray-200/70 flex flex-col gap-1 text-[10px]">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="font-semibold text-gray-600">
                      Months ({selectedEngagementMonths.length}/12):
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleSelectAllMonths}
                        className="px-1.5 py-0.5 rounded bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold cursor-pointer"
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={handleSelectQ1}
                        className="px-1.5 py-0.5 rounded bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold cursor-pointer"
                      >
                        Q1
                      </button>
                      <button
                        type="button"
                        onClick={handleSelectQ2}
                        className="px-1.5 py-0.5 rounded bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold cursor-pointer"
                      >
                        Q2
                      </button>
                      <button
                        type="button"
                        onClick={handleSelectQ3}
                        className="px-1.5 py-0.5 rounded bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold cursor-pointer"
                      >
                        Q3
                      </button>
                      <button
                        type="button"
                        onClick={handleSelectQ4}
                        className="px-1.5 py-0.5 rounded bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold cursor-pointer"
                      >
                        Q4
                      </button>
                      <button
                        type="button"
                        onClick={handleSelectH1}
                        className="px-1.5 py-0.5 rounded bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold cursor-pointer"
                      >
                        H1
                      </button>
                      <button
                        type="button"
                        onClick={handleSelectH2}
                        className="px-1.5 py-0.5 rounded bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold cursor-pointer"
                      >
                        H2
                      </button>
                    </div>
                  </div>

                  {/* Month Selection Pills (Multi-Select) */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                    {months.map((m) => {
                      const isSelected = selectedEngagementMonths.includes(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleToggleMonth(m)}
                          className={`px-1.5 py-0.5 rounded font-bold text-[9.5px] transition-all cursor-pointer whitespace-nowrap ${
                            isSelected
                              ? "bg-indigo-600 text-white shadow-2xs"
                              : "bg-white text-gray-500 hover:bg-gray-200/70 border border-gray-200/60"
                          }`}
                          title={`Click to ${isSelected ? "remove" : "include"} ${m}`}
                        >
                          {monthShortMap[m] || m}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-44 sm:h-48">
                  <Bar
                    data={groupedChartData}
                    options={groupedChartOptions}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Professional Startups Table */}
        <div className="mb-4">
          <div className="bg-white rounded-xl shadow-xs border border-gray-200/90 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/90 flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900">Your Startups</h2>
                <p className="text-[11px] text-gray-500">
                  Manage and monitor all your startup listings
                </p>
              </div>
            </div>
            <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-gray-50/75 border-b border-gray-200">
                    <th className="px-3.5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Startup Name
                    </th>
                    <th className="px-3.5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Industry
                    </th>
                    <th className="px-3.5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Founded Date
                    </th>
                    <th className="px-3.5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-3.5 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3.5 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="relative w-12 h-12 mb-4">
                            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin"></div>
                          </div>
                          <p className="text-gray-600 font-semibold text-sm">
                            Loading startups...
                          </p>
                          <p className="text-gray-400 text-xs mt-1">
                            Please wait
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : displayList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                            <svg
                              className="w-8 h-8 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                              />
                            </svg>
                          </div>
                          <p className="text-gray-900 font-semibold text-base mb-1">
                            No startups found
                          </p>
                          <p className="text-gray-500 text-sm mb-4">
                            Start by adding your first startup
                          </p>
                          <button
                            onClick={openAddMethodModal}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                          >
                            Add Your First Startup
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayList.map((item) => {
                      const isDraft = !!item.isDraft;
                      const formattedDate = item.foundedDate
                        ? new Date(item.foundedDate).toLocaleDateString()
                        : "N/A";

                      return (
                        <tr
                          key={`${isDraft ? "draft" : "startup"}-${item.id}`}
                          className={`${
                            isDraft
                              ? "bg-amber-50/70"
                              : "hover:bg-gray-50/80 cursor-pointer"
                          } transition-colors duration-150`}
                          onClick={() =>
                            !isDraft && navigate(`/startup/${item.id}`)
                          }
                        >
                          {/* Startup Name + Logo + Location */}
                          <td className="px-3.5 py-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="flex-shrink-0">
                                <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                  {logoUrls[item.id] ? (
                                    <img
                                      src={logoUrls[item.id]}
                                      alt={item.companyName}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                      decoding="async"
                                    />
                                  ) : logoUrls[item.id] === null ? (
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center">
                                      <span className="text-xs font-bold text-white">
                                        {(item.companyName ||
                                          "?")[0].toUpperCase()}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center animate-pulse">
                                      <svg
                                        className="w-5 h-5 text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="min-w-0 max-w-[170px] sm:max-w-[210px] lg:max-w-[250px]">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <p className="font-bold text-gray-900 truncate text-xs sm:text-sm" title={item.companyName}>
                                    {item.companyName || "Untitled Draft"}
                                  </p>
                                  {isDraft && (
                                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">
                                      Draft
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-500 truncate flex items-center gap-0.5" title={item.locationName}>
                                  <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                                  <span className="truncate">{item.locationName || "No location"}</span>
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Industry */}
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-full border border-blue-100 truncate max-w-[130px]" title={item.industry}>
                              {item.industry || "N/A"}
                            </span>
                          </td>

                          {/* Founded Date */}
                          <td className="px-3.5 py-3 whitespace-nowrap text-xs text-gray-600">
                            {formattedDate}
                          </td>

                          {/* Contact (Email & Phone Number combined) */}
                          <td className="px-3.5 py-3">
                            <div className="min-w-0 max-w-[150px] lg:max-w-[180px]">
                              {item.contactEmail ? (
                                <a
                                  href={`mailto:${item.contactEmail}`}
                                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline block truncate"
                                  title={item.contactEmail}
                                >
                                  {item.contactEmail}
                                </a>
                              ) : (
                                <span className="text-xs text-gray-400">No email</span>
                              )}
                              {item.phoneNumber && (
                                <span className="text-[11px] text-gray-400 block truncate" title={item.phoneNumber}>
                                  {item.phoneNumber}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-3.5 py-3 text-center whitespace-nowrap">
                            {isDraft ? (
                              <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] font-semibold rounded-md">
                                Draft
                              </span>
                            ) : item.emailVerified ? (
                              <span className="inline-flex items-center px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 text-[11px] font-semibold rounded-md">
                                <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />
                                Verified
                              </span>
                            ) : (
                              <button
                                className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVerifyNow(item.id, item.contactEmail);
                                }}
                              >
                                Verify Now
                              </button>
                            )}
                          </td>

                          {/* Actions */}
                          <td
                            className="px-3.5 py-3 text-center whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              {isDraft ? (
                                <>
                                  <button
                                    onClick={() =>
                                      navigate(
                                        `/add-startup?draftId=${item.id}`
                                      )
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer"
                                    title="Continue editing draft"
                                  >
                                    <PlayCircle size={13} /> Continue
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteDraftClick(
                                        item.id,
                                        item.companyName
                                      )
                                    }
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title="Delete draft"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleNavigateToUpdate(item)}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                    title="Edit"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(item)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title="Delete"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
          </>
        )}
        {verificationModal && (
          <Verification
            setVerificationModal={setVerificationModal}
            startupId={selectedStartupId}
            contactEmail={selectedContactEmail}
            resetForm={() => {}}
            onVerifySuccess={handleVerifySuccess}
          />
        )}
        {/* Delete Confirmation Modal */}
        {deleteModal.isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 transition-opacity z-50"
              onClick={() =>
                !deleteModal.isDeleting &&
                setDeleteModal({ ...deleteModal, isOpen: false })
              }
              aria-hidden="true"
            ></div>

            {/* Modal container */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
                {/* Modal header */}
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Trash2 className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-gray-900">
                          Delete Startup
                        </h3>
                        <button
                          onClick={() =>
                            !deleteModal.isDeleting &&
                            setDeleteModal({ ...deleteModal, isOpen: false })
                          }
                          className="text-gray-400 hover:text-gray-600"
                          disabled={deleteModal.isDeleting}
                        >
                          <X size={20} />
                        </button>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          Are you sure you want to delete{" "}
                          <span className="font-semibold text-gray-900">
                            {deleteModal.startupName}
                          </span>
                          ?
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          This action cannot be undone and all data will be
                          permanently removed.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Error message */}
                  {deleteModal.error && (
                    <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                      <div className="flex items-start gap-2">
                        <svg
                          className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <p className="text-sm text-red-700">
                          {deleteModal.error}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer with action buttons */}
                <div className="border-t border-gray-200 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                    onClick={() =>
                      setDeleteModal({ ...deleteModal, isOpen: false })
                    }
                    disabled={deleteModal.isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    onClick={confirmDeleteStartup}
                    disabled={deleteModal.isDeleting}
                  >
                    {deleteModal.isDeleting ? (
                      <>
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Delete Draft Confirmation Modal */}
        {deleteDraftModal.isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 transition-opacity z-50"
              onClick={() =>
                !deleteDraftModal.isDeleting &&
                setDeleteDraftModal({ ...deleteDraftModal, isOpen: false })
              }
              aria-hidden="true"
            ></div>

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
                {/* Modal Content */}
                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-red-100 rounded-full p-2.5 dark:bg-red-900/30">
                      <Trash2 className="h-6 w-6 text-red-600 dark:text-red-500" />
                    </div>
                    <div className="ml-4 w-full">
                      <div className="flex justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-6">
                          Delete Draft
                        </h3>
                        <button
                          onClick={() =>
                            !deleteDraftModal.isDeleting &&
                            setDeleteDraftModal({
                              ...deleteDraftModal,
                              isOpen: false,
                            })
                          }
                          className="text-gray-400 hover:text-gray-500 focus:outline-none"
                          disabled={deleteDraftModal.isDeleting}
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Are you sure you want to delete the draft{" "}
                          <span className="font-semibold text-gray-800 dark:text-white">
                            {deleteDraftModal.draftName}
                          </span>
                          ?
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          This action cannot be undone and the draft will be
                          permanently removed.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {deleteDraftModal.error && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 rounded animate-pulse">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-red-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <p className="ml-2 text-sm text-red-700 dark:text-red-400">
                          {deleteDraftModal.error}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 dark:border-gray-700"></div>

                {/* Actions */}
                <div className="px-6 py-4 sm:flex sm:flex-row-reverse">
                  {/* Delete Button */}
                  <button
                    type="button"
                    className={`w-full sm:w-auto px-4 py-2.5 rounded-lg text-white font-medium 
              ${
                deleteDraftModal.isDeleting
                  ? "bg-red-400 dark:bg-red-500/70"
                  : "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
              } 
              shadow-sm focus:ring-4 focus:ring-red-300 dark:focus:ring-red-700 focus:outline-none
              transition-all duration-200 ease-in-out sm:ml-3
              ${
                deleteDraftModal.isDeleting
                  ? "opacity-80 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
                    onClick={handleDeleteDraft}
                    disabled={deleteDraftModal.isDeleting}
                  >
                    <div className="flex items-center justify-center">
                      {deleteDraftModal.isDeleting ? (
                        <>
                          <svg
                            className="w-4 h-4 mr-2 animate-spin"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-1.5" />
                          <span>Delete Draft</span>
                        </>
                      )}
                    </div>
                  </button>

                  {/* Cancel Button */}
                  <button
                    type="button"
                    className={`mt-3 sm:mt-0 w-full sm:w-auto px-4 py-2.5 rounded-lg
              border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
              text-gray-700 dark:text-gray-200 font-medium
              hover:bg-gray-50 dark:hover:bg-gray-600
              focus:ring-4 focus:ring-indigo-100 dark:focus:ring-gray-700 focus:outline-none
              transition-all duration-200 ease-in-out
              ${
                deleteDraftModal.isDeleting
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
                    onClick={() =>
                      setDeleteDraftModal({
                        ...deleteDraftModal,
                        isOpen: false,
                      })
                    }
                    disabled={deleteDraftModal.isDeleting}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
        {/* Funding Breakdown Pop Up Modal */}
        <FundingBreakdownModal
          isOpen={isFundingModalOpen}
          onClose={() => setIsFundingModalOpen(false)}
          startups={startups}
          selectedStartupId={selectedStartup}
        />
      </div>
    </div>
  );
}
