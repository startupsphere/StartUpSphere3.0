import { getBackendUrl } from "../config/apiConfig";
import { useState, useEffect, useMemo } from "react";
import {
  Check,
  X,
  Loader,
  Eye,
  Info,
  Globe,
  Map,
  Building,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  Users,
  DollarSign,
  Award,
  Hash,
  Clock,
  Filter,
  Download,
  ArrowUpDown,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  SlidersHorizontal,
  MessageSquare,
  TrendingUp,
  GraduationCap,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";

export default function EnhancedStartupReviewSection({
  startupId,
  industry,
  region,
  status,
  actorType,
  searchQuery,
  filteredStartups: externalFilteredStartups,
  onRefresh,
}) {
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionComment, setRejectionComment] = useState("");
  const [pendingRejectionId, setPendingRejectionId] = useState(null);
  const [pendingRejectionIsInvestor, setPendingRejectionIsInvestor] = useState(false);
  const [pendingRejectionIsStandalone, setPendingRejectionIsStandalone] = useState(false);
  const [certificateUrl, setCertificateUrl] = useState(null);
  const [loadingCertificate, setLoadingCertificate] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [commonRejectionReasons, setCommonRejectionReasons] = useState([
    "Incomplete company information",
    "Business description is too vague or unclear",
    "Contact information is invalid or missing",
    "Website or social media links are not functional",
    "Business model doesn't qualify as a startup",
    "Duplicate submission",
    "Violates platform terms and conditions",
    "Contains inappropriate or misleading content",
    "Organization is no longer active",
    "Other (please specify)",
  ]);

  const [investorRejectionReasons] = useState([
    "Incomplete fund or credential details",
    "Investment thesis does not align with ecosystem guidelines",
    "Contact or representative information is invalid or unverified",
    "Institutional accreditation / registration could not be verified",
    "Fund mandate, ticket size, or target stage is unspecified",
    "Duplicate investor submission",
    "Violates platform terms and conditions",
    "Other (please specify)",
  ]);

  const [filters, setFilters] = useState({
    search: searchQuery || "",
    industry: industry !== "All" ? industry : "",
    status: status !== "all" ? status : "",
    region: region !== "All Regions" ? region : "",
    actorType: actorType || "all",
    dateRange: { start: null, end: null },
  });
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "companyName",
    direction: "asc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [uniqueIndustries, setUniqueIndustries] = useState([]);
  const [uniqueRegions, setUniqueRegions] = useState([]);
  const [uniqueStatuses, setUniqueStatuses] = useState([]);

  // API Interaction States
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState({
    success: false,
    message: "",
  });
  const [actionVisible, setActionVisible] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);

  // Update internal filters when external filters change
  useEffect(() => {
    if (searchQuery !== undefined) {
      setFilters((prev) => ({ ...prev, search: searchQuery || "" }));
    }
    if (industry !== undefined) {
      setFilters((prev) => ({
        ...prev,
        industry: industry !== "All" ? industry : "",
      }));
    }
    if (status !== undefined) {
      setFilters((prev) => ({
        ...prev,
        status: status !== "all" ? status : "",
      }));
    }
    if (region !== undefined) {
      setFilters((prev) => ({
        ...prev,
        region: region !== "All Regions" ? region : "",
      }));
    }
    if (actorType !== undefined) {
      setFilters((prev) => ({
        ...prev,
        actorType: actorType || "all",
      }));
    }
  }, [searchQuery, industry, status, region, actorType]);

  // Fetch startups data or use externally provided filtered startups
  useEffect(() => {
    if (externalFilteredStartups) {
      setStartups(externalFilteredStartups);
      setLoading(false);

      // Extract unique values for filter dropdowns from the provided data
      if (externalFilteredStartups.length > 0) {
        setUniqueIndustries([
          ...new Set(
            externalFilteredStartups.map((s) => s.industry).filter(Boolean)
          ),
        ]);
        setUniqueRegions([
          ...new Set(
            externalFilteredStartups
              .map((s) => s.city || s.region)
              .filter(Boolean)
          ),
        ]);
        setUniqueStatuses([
          ...new Set(
            externalFilteredStartups.map((s) => s.status).filter(Boolean)
          ),
        ]);
      }
    } else {
      fetchStartups();
    }
  }, [externalFilteredStartups]);

  // Effect to handle auto-opening preview when startupId is provided
  useEffect(() => {
    if (startupId && startups.length > 0) {
      const targetStartup = startups.find(
        (startup) => startup.id === parseInt(startupId)
      );
      if (targetStartup) {
        setSelectedStartup(targetStartup);
        setIsPreviewOpen(true);
        fetchRegistrationCertificate(targetStartup.id);
        // Highlight that we're reviewing this specific startup
        toast.info(`Reviewing startup: ${targetStartup.companyName}`);
      }
    }
  }, [startupId, startups]);

  // Fetch certificate and photo when preview opens
  useEffect(() => {
    if (isPreviewOpen && selectedStartup) {
      fetchRegistrationCertificate(selectedStartup.id);
      fetchStartupPhoto(selectedStartup.id);
    } else {
      // Cleanup URLs when modal closes
      if (certificateUrl) {
        URL.revokeObjectURL(certificateUrl);
        setCertificateUrl(null);
      }
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
        setPhotoUrl(null);
      }
    }
  }, [isPreviewOpen, selectedStartup]);

  // API call to fetch startups
  const fetchStartups = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters with pagination
      const queryParams = new URLSearchParams({
        page: "0",
        size: "1000",
        sortBy: "companyName",
        sortDir: "ASC"
      });

      if (filters.industry) {
        queryParams.append("industry", filters.industry);
      }

      if (filters.region) {
        queryParams.append("region", filters.region);
      }

      if (filters.status) {
        queryParams.append("status", filters.status);
      }

      if (filters.search.trim()) {
        queryParams.append("search", filters.search.trim());
      }

      if (filters.dateRange.start) {
        queryParams.append("startDate", filters.dateRange.start);
      }

      if (filters.dateRange.end) {
        queryParams.append("endDate", filters.dateRange.end);
      }

      // Fetch startups with filters
      const apiUrl = startupId
        ? `${getBackendUrl()}/startups/submitted?${queryParams.toString()}`
        : `${getBackendUrl()}/startups/review?${queryParams.toString()}`;

      const token = localStorage.getItem("token");
      const response = await fetch(apiUrl, {
        credentials: "include",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch startups: ${response.status}`);
      }

      const responseData = await response.json();

      // Extract startups from paginated response
      let data = responseData.content || responseData || [];

      // Also query submitted investors from /investors/submitted to support standalone investor records
      try {
        const invRes = await fetch(
          `${getBackendUrl()}/investors/submitted?page=0&size=100`,
          {
            credentials: "include",
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          }
        );
        if (invRes.ok) {
          const invJson = await invRes.json();
          const invList = invJson.content || invJson || [];
          if (Array.isArray(invList) && invList.length > 0) {
            const mappedInvestors = invList.map((inv) => ({
              id: inv.investorId,
              companyName:
                `${inv.firstname || ""} ${inv.lastname || ""}`.trim() ||
                inv.emailAddress ||
                "Investor",
              companyDescription:
                inv.biography || "Registered investor profile awaiting review.",
              industry: "Venture Capital & Investment",
              city: inv.locationName || "N/A",
              contactEmail: inv.emailAddress,
              phoneNumber: inv.contactInformation,
              status: inv.status || "In Review",
              role: "ROLE_INVESTOR",
              isStandaloneInvestor: true,
              viewsCount: inv.views || 0,
              createdAt: inv.createdAt,
            }));
            const existingIds = new Set(data.map((d) => d.id));
            const newInv = mappedInvestors.filter(
              (inv) => !existingIds.has(inv.id)
            );
            data = [...data, ...newInv];
          }
        }
      } catch (invErr) {
        // Fallback gracefully
      }

      // If a specific startupId is requested, filter for that startup
      if (startupId) {
        const filteredData = Array.isArray(data)
          ? data.filter((s) => s.id === parseInt(startupId))
          : [];

        setStartups(filteredData.length > 0 ? filteredData : data);

        // If we have the specific startup, auto-select it
        if (filteredData.length > 0) {
          setSelectedStartup(filteredData[0]);
          setIsPreviewOpen(true);
        }
      } else {
        setStartups(data);
      }

      // Extract unique values for filter dropdowns
      if (data.length > 0) {
        setUniqueIndustries([
          ...new Set(data.map((startup) => startup.industry).filter(Boolean)),
        ]);
        setUniqueRegions([
          ...new Set(
            data
              .map((startup) => startup.city || startup.region)
              .filter(Boolean)
          ),
        ]);
        setUniqueStatuses([
          ...new Set(data.map((startup) => startup.status).filter(Boolean)),
        ]);
      }
    } catch (err) {
      console.error("Error fetching startups:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handler for applying filters
  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to first page when filters change
    fetchStartups();
  };

  // Fetch registration certificate
  const fetchRegistrationCertificate = async (id) => {
    try {
      setLoadingCertificate(true);

      // Revoke previously created URL to avoid memory leaks
      if (certificateUrl) {
        try {
          URL.revokeObjectURL(certificateUrl);
        } catch (e) {
          // ignore revoke errors
        }
        setCertificateUrl(null);
      }

      const response = await fetch(
        `${getBackendUrl()}/startups/${id}/registration-certificate`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setCertificateUrl(url);
      } else {
        // Clear any existing URL and notify user
        setCertificateUrl(null);
        toast.error("Failed to load registration certificate");
      }
    } catch (error) {
      console.error("Error fetching certificate:", error);
      setCertificateUrl(null);
      toast.error("Error loading certificate");
    } finally {
      setLoadingCertificate(false);
    }
  };

  // Fetch startup photo
  const fetchStartupPhoto = async (id) => {
    try {
      setLoadingPhoto(true);
      const response = await fetch(
        `${getBackendUrl()}/startups/${id}/photo`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPhotoUrl(url);
      } else {
        console.log("No photo available");
        setPhotoUrl(null);
      }
    } catch (error) {
      console.error("Error fetching photo:", error);
      setPhotoUrl(null);
    } finally {
      setLoadingPhoto(false);
    }
  };

  // Helper to determine if an entity is an investor
  const isInvestorItem = (item) => {
    if (!item) return false;
    return item.role === "ROLE_INVESTOR" || item.isStandaloneInvestor === true;
  };

  // Helper to render actor badge
  const getActorBadge = (item) => {
    if (isInvestorItem(item)) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          <TrendingUp size={11} className="mr-1 text-amber-700" />
          Investor / VC
        </span>
      );
    }
    if (item.role === "ROLE_HEI") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-300">
          <GraduationCap size={11} className="mr-1 text-purple-700" />
          HEI / University
        </span>
      );
    }
    if (item.role === "ROLE_RESEARCH") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-100 text-teal-800 border border-teal-300">
          <FlaskConical size={11} className="mr-1 text-teal-700" />
          Research Lab
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-300">
        <Building size={11} className="mr-1 text-blue-700" />
        Startup
      </span>
    );
  };

  // Handler for approving a startup or investor
  const handleApprove = async (target) => {
    const startup =
      typeof target === "object"
        ? target
        : startups.find((s) => s.id === target) || {};
    const id = startup.id !== undefined ? startup.id : target;
    const isInvestor = isInvestorItem(startup);
    const successMsg = isInvestor
      ? "Investor accepted and approved successfully!"
      : "Startup approved successfully!";

    await handleStartupAction(
      id,
      "approve",
      successMsg,
      {},
      !!startup.isStandaloneInvestor,
      isInvestor
    );
  };

  // Handler for initiating startup or investor rejection
  const handleInitiateReject = (target) => {
    const startup =
      typeof target === "object"
        ? target
        : startups.find((s) => s.id === target) || {};
    const id = startup.id !== undefined ? startup.id : target;
    setPendingRejectionId(id);
    setPendingRejectionIsInvestor(isInvestorItem(startup));
    setPendingRejectionIsStandalone(!!startup.isStandaloneInvestor);
    setRejectionComment("");
    setIsRejectionModalOpen(true);
  };

  // Handler for submitting rejection with comment
  const handleReject = async () => {
    if (!rejectionComment.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    const rejectionPayload = {
      comments: rejectionComment.trim(),
    };

    const successMsg = pendingRejectionIsInvestor
      ? "Investor application rejected."
      : "Startup rejected successfully!";

    await handleStartupAction(
      pendingRejectionId,
      "reject",
      successMsg,
      rejectionPayload,
      pendingRejectionIsStandalone,
      pendingRejectionIsInvestor
    );

    setIsRejectionModalOpen(false);
    setPendingRejectionId(null);
    setPendingRejectionIsInvestor(false);
    setPendingRejectionIsStandalone(false);
    setRejectionComment("");
  };

  // Generic action handler for startup and investor operations
  const handleStartupAction = async (
    id,
    action,
    successMessage,
    additionalData = {},
    isStandaloneInvestor = false,
    isInvestor = false
  ) => {
    try {
      setIsActionLoading(true);

      const payload = { ...additionalData };
      const entityLabel = isInvestor ? "Investor" : "Startup";

      if (action === "reject" && additionalData.comments) {
        payload.comments = additionalData.comments;
        payload.remarks = `${entityLabel} ${id} rejected: ${additionalData.comments.substring(
          0,
          30
        )}${additionalData.comments.length > 30 ? "..." : ""}`;
      } else if (action === "approve") {
        payload.comments =
          additionalData.comments || `${entityLabel} application approved`;
        payload.remarks =
          additionalData.remarks || `${entityLabel} ${id} approved`;
      }

      console.log(`Sending ${action} request for ${entityLabel} with payload:`, payload);

      const token = localStorage.getItem("token");
      const requestOptions = {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      };

      const endpoint = isStandaloneInvestor
        ? `${getBackendUrl()}/investors/${id}/${action}`
        : `${getBackendUrl()}/notifications/startups/${id}/${action}`;

      const response = await fetch(endpoint, requestOptions);

      const responseText = await response.text();
      console.log(`API Response (${response.status}):`, responseText);

      if (!response.ok) {
        throw new Error(
          `Failed to ${action} ${entityLabel.toLowerCase()}: ${response.status}`
        );
      }

      // Update local state
      setStartups(startups.filter((startup) => startup.id !== id));
      setActionResult({ success: true, message: successMessage });

      // If there was an external refresh function provided, call it
      if (typeof onRefresh === "function") {
        onRefresh();
      } else {
        fetchStartups();
      }

      if (selectedStartup && selectedStartup.id === id) {
        setIsPreviewOpen(false);
        setSelectedStartup(null);
      }

      // Show toast notification
      toast.success(successMessage);
    } catch (err) {
      console.error(`Failed to ${action} startup:`, err);
      setActionResult({ success: false, message: err.message });
      toast.error(`Failed to ${action} startup: ${err.message}`);
    } finally {
      setIsActionLoading(false);
      setActionVisible(true);
      // Auto-hide notification after 3 seconds
      setTimeout(() => setActionVisible(false), 3000);
    }
  };

  // Export startups to CSV
  const exportToCSV = () => {
    const headers = [
      "Company Name",
      "Industry",
      "Founded Date",
      "Status",
      "City",
      "Country",
      "Contact Email",
      "Phone Number",
    ];

    const csvData = filteredStartups.map((startup) => [
      startup.companyName,
      startup.industry,
      formatDate(startup.foundedDate),
      startup.status,
      startup.city,
      startup.country,
      startup.contactEmail,
      startup.phoneNumber || "N/A",
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${cell || ""}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `startups-export-${new Date().toISOString().split("T")[0]
      }.csv`;
    link.click();

    toast.success("Export completed successfully");
  };

  // Status viewing hierarchy: 1 = In Review, 2 = Approved, 3 = Rejected, 4 = Others
  const getStatusHierarchyRank = (status) => {
    if (!status) return 1;
    const s = String(status).trim().toLowerCase();
    if (s.includes("review") || s === "pending") {
      return 1;
    }
    if (s === "approved") {
      return 2;
    }
    if (s === "rejected") {
      return 3;
    }
    return 4;
  };

  // Sort function for data
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      search: "",
      industry: "",
      status: "",
      region: "",
      actorType: "all",
      dateRange: { start: null, end: null },
    });
    setSortConfig({ key: "companyName", direction: "asc" });
    setCurrentPage(1);

    // Call the parent component's reset function if provided
    if (typeof onRefresh === "function") {
      onRefresh();
    } else {
      fetchStartups();
    }
  };

  // Apply filters to startups data
  const filteredStartups = useMemo(() => {
    let result = [...startups];

    // Apply actor/role filter
    if (filters.actorType && filters.actorType !== "all") {
      if (filters.actorType === "ROLE_STARTUP") {
        result = result.filter((s) => !s.role || s.role === "ROLE_STARTUP");
      } else if (filters.actorType === "ROLE_INVESTOR") {
        result = result.filter((s) => isInvestorItem(s));
      } else {
        result = result.filter((s) => s.role === filters.actorType);
      }
    }

    // Apply search filter locally (in case server filtering doesn't cover all fields)
    if (filters.search && !externalFilteredStartups) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (startup) =>
          (startup.companyName || "").toLowerCase().includes(searchLower) ||
          (startup.industry || "").toLowerCase().includes(searchLower) ||
          (startup.companyDescription || "")
            .toLowerCase()
            .includes(searchLower) ||
          (startup.city || "").toLowerCase().includes(searchLower) ||
          (startup.contactEmail || "").toLowerCase().includes(searchLower)
      );
    }

    // Apply industry filter locally (if not already filtered by server)
    if (filters.industry && !externalFilteredStartups) {
      result = result.filter(
        (startup) => startup.industry === filters.industry
      );
    }

    // Apply status filter locally (if not already filtered by server)
    if (filters.status && !externalFilteredStartups) {
      result = result.filter((startup) => startup.status === filters.status);
    }

    // Apply region filter locally (if not already filtered by server)
    if (filters.region && !externalFilteredStartups) {
      result = result.filter(
        (startup) =>
          startup.city === filters.region || startup.region === filters.region
      );
    }

    // Apply date range filter
    if (
      filters.dateRange.start &&
      filters.dateRange.end &&
      !externalFilteredStartups
    ) {
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      result = result.filter((startup) => {
        const foundedDate = new Date(startup.foundedDate);
        return foundedDate >= startDate && foundedDate <= endDate;
      });
    }

    // Apply sorting with hierarchy of viewing:
    // 1st: In Review
    // 2nd: Approved
    // 3rd: Rejected
    result.sort((a, b) => {
      const rankA = getStatusHierarchyRank(a.status);
      const rankB = getStatusHierarchyRank(b.status);

      // If user specifically clicks "status" column to sort:
      if (sortConfig.key === "status") {
        if (rankA !== rankB) {
          return sortConfig.direction === "asc"
            ? rankA - rankB
            : rankB - rankA;
        }
      } else {
        // Status hierarchy is always the primary viewing order
        if (rankA !== rankB) {
          return rankA - rankB;
        }
      }

      // Secondary sort: based on sortConfig.key (default: companyName ascending)
      const key =
        sortConfig.key && sortConfig.key !== "status"
          ? sortConfig.key
          : "companyName";
      const aRaw = a[key];
      const bRaw = b[key];
      const aVal =
        aRaw !== undefined && aRaw !== null
          ? typeof aRaw === "string"
            ? aRaw.toLowerCase()
            : aRaw
          : typeof aRaw === "number"
          ? 0
          : "";
      const bVal =
        bRaw !== undefined && bRaw !== null
          ? typeof bRaw === "string"
            ? bRaw.toLowerCase()
            : bRaw
          : typeof bRaw === "number"
          ? 0
          : "";

      if (aVal < bVal) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    return result;
  }, [startups, filters, sortConfig, externalFilteredStartups]);

  const totalPages = Math.ceil(filteredStartups.length / itemsPerPage);
  const paginatedStartups = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredStartups.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredStartups, currentPage, itemsPerPage]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderStatusBadge = (status) => {
    const statusColors = {
      "In Review": "bg-yellow-100 text-yellow-800 border-yellow-300",
      Approved: "bg-green-100 text-green-800 border-green-300",
      Rejected: "bg-red-100 text-red-800 border-red-300",
      Pending: "bg-blue-100 text-blue-800 border-blue-300",
    };

    const defaultColor = "bg-gray-100 text-gray-800 border-gray-300";
    const colorClass = statusColors[status] || defaultColor;

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${colorClass}`}
      >
        {status}
      </span>
    );
  };

  if (loading && startups.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-600">Loading startups...</span>
      </div>
    );
  }

  if (error && startups.length === 0) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-lg shadow border border-red-200">
        <div className="flex items-center mb-3">
          <AlertTriangle size={20} className="mr-2" />
          <h3 className="font-semibold">Error loading startups</h3>
        </div>
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchStartups}
          className="mt-4 flex items-center px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
        >
          <RefreshCw size={16} className="mr-2" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b bg-gray-50 flex flex-col sm:flex-row justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Review & Approvals Dashboard
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Accept or reject submissions for Startups, Investors, and Ecosystem Partners
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mt-3 sm:mt-0">
          <button
            onClick={() => setFiltersVisible(!filtersVisible)}
            className="px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded flex items-center hover:bg-blue-100 transition-colors"
          >
            <SlidersHorizontal size={16} className="mr-1" />
            {filtersVisible ? "Hide Filters" : "Show Filters"}
          </button>

          <button
            onClick={exportToCSV}
            className="px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded flex items-center hover:bg-green-100 transition-colors"
          >
            <Download size={16} className="mr-1" />
            Export CSV
          </button>

          <button
            onClick={
              typeof onRefresh === "function" ? onRefresh : fetchStartups
            }
            className="px-3 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded flex items-center hover:bg-gray-100 transition-colors"
          >
            <RefreshCw size={16} className="mr-1" />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Actor Filter Tabs */}
      <div className="px-4 py-2.5 bg-gray-50/70 border-b flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">
          Entity Filter:
        </span>
        <button
          type="button"
          onClick={() => setFilters((prev) => ({ ...prev, actorType: "all" }))}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            filters.actorType === "all"
              ? "bg-gray-900 text-white shadow-sm"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          All ({startups.length})
        </button>
        <button
          type="button"
          onClick={() =>
            setFilters((prev) => ({ ...prev, actorType: "ROLE_STARTUP" }))
          }
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            filters.actorType === "ROLE_STARTUP"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"
          }`}
        >
          <Building size={13} />
          Startups (
          {
            startups.filter(
              (s) => !s.role || s.role === "ROLE_STARTUP"
            ).length
          }
          )
        </button>
        <button
          type="button"
          onClick={() =>
            setFilters((prev) => ({ ...prev, actorType: "ROLE_INVESTOR" }))
          }
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            filters.actorType === "ROLE_INVESTOR"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 font-semibold"
          }`}
        >
          <TrendingUp size={13} />
          Investors & VCs (
          {startups.filter((s) => isInvestorItem(s)).length}
          )
        </button>
        <button
          type="button"
          onClick={() =>
            setFilters((prev) => ({ ...prev, actorType: "ROLE_HEI" }))
          }
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            filters.actorType === "ROLE_HEI"
              ? "bg-purple-600 text-white shadow-sm"
              : "bg-white text-purple-700 hover:bg-purple-50 border border-purple-200"
          }`}
        >
          <GraduationCap size={13} />
          HEIs ({startups.filter((s) => s.role === "ROLE_HEI").length})
        </button>
        <button
          type="button"
          onClick={() =>
            setFilters((prev) => ({ ...prev, actorType: "ROLE_RESEARCH" }))
          }
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            filters.actorType === "ROLE_RESEARCH"
              ? "bg-teal-600 text-white shadow-sm"
              : "bg-white text-teal-700 hover:bg-teal-50 border border-teal-200"
          }`}
        >
          <FlaskConical size={13} />
          Research ({startups.filter((s) => s.role === "ROLE_RESEARCH").length})
        </button>
      </div>

      {filtersVisible && (
        <div className="p-4 border-b bg-blue-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label
                htmlFor="actor-filter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Entity Type
              </label>
              <select
                id="actor-filter"
                value={filters.actorType}
                onChange={(e) =>
                  setFilters({ ...filters, actorType: e.target.value })
                }
                className="w-full text-black p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Entities</option>
                <option value="ROLE_STARTUP">Startups & Businesses</option>
                <option value="ROLE_INVESTOR">Investors & Venture Capitals</option>
                <option value="ROLE_HEI">HEIs / Universities</option>
                <option value="ROLE_RESEARCH">Research Labs</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="industry-filter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Industry
              </label>
              <select
                id="industry-filter"
                value={filters.industry}
                onChange={(e) =>
                  setFilters({ ...filters, industry: e.target.value })
                }
                className="w-full text-black p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Industries</option>
                {uniqueIndustries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="status-filter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status
              </label>
              <select
                id="status-filter"
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="w-full text-black p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="region-filter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Region
              </label>
              <select
                id="region-filter"
                value={filters.region}
                onChange={(e) =>
                  setFilters({ ...filters, region: e.target.value })
                }
                className="w-full text-black p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Regions</option>
                {uniqueRegions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="date-range-filter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Founded After
              </label>
              <input
                id="date-range-filter"
                type="date"
                value={filters.dateRange.start || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    dateRange: { ...filters.dateRange, start: e.target.value },
                  })
                }
                className="w-full text-black p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="date-range-end-filter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Founded Before
              </label>
              <input
                id="date-range-end-filter"
                type="date"
                value={filters.dateRange.end || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    dateRange: { ...filters.dateRange, end: e.target.value },
                  })
                }
                className="w-full text-black p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex justify-end gap-2">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                Reset Filters
              </button>

              <button
                onClick={handleApplyFilters}
                disabled={filterLoading}
                className="px-4 py-2 text-white bg-blue-600 border border-blue-700 rounded-md shadow-sm hover:bg-blue-700 flex items-center"
              >
                {filterLoading ? (
                  <>
                    <Loader size={14} className="animate-spin mr-2" />
                    Filtering...
                  </>
                ) : (
                  <>
                    <Filter size={14} className="mr-2" />
                    Apply Filters
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 flex flex-col sm:flex-row justify-between items-center border-b">
        <div className="relative w-full sm:w-96 mb-3 sm:mb-0">
          <input
            type="text"
            placeholder="Search by name, industry, description..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            onKeyPress={(e) => {
              if (e.key === "Enter") handleApplyFilters();
            }}
            className="pl-10 pr-4 py-2 text-black placeholder:text-gray-400 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 font-medium">
            Showing{" "}
            <span className="text-blue-600 font-semibold">
              {filteredStartups.length ? (currentPage - 1) * itemsPerPage + 1 : 0}
              -{Math.min(currentPage * itemsPerPage, filteredStartups.length)}
            </span>
            {" "}of{" "}
            <span className="text-blue-600 font-semibold">
              {filteredStartups.length}
            </span>
            {" "}startups
          </span>

          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
            <span className="text-sm text-gray-600 font-medium">Show:</span>
            <div className="relative">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-gray-300 rounded-lg pl-3 pr-8 py-1.5 text-sm font-semibold text-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <span className="text-sm text-gray-500">per page</span>
          </div>
        </div>
      </div>

      {actionVisible && (
        <div
          className={`transition-all duration-300 fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${actionResult.success
              ? "bg-green-100 border-l-4 border-green-500"
              : "bg-red-100 border-l-4 border-red-500"
            }`}
        >
          <div className="flex">
            <div className="flex-shrink-0">
              {actionResult.success ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <X className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="ml-3">
              <p
                className={`text-sm font-medium ${actionResult.success ? "text-green-800" : "text-red-800"
                  }`}
              >
                {actionResult.message}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setActionVisible(false)}
                className="inline-flex text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredStartups.length === 0 ? (
        <div className="p-10 text-center text-gray-500">
          <Info size={40} className="mx-auto mb-4 text-gray-400" />
          <p className="text-lg mb-2">
            No startups found matching your criteria.
          </p>
          <p className="text-sm text-gray-400">
            Try adjusting your filters or search terms.
          </p>
          {filters.search ||
            filters.industry ||
            filters.status ||
            filters.region ||
            filters.dateRange.start ||
            filters.dateRange.end ? (
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors inline-flex items-center"
            >
              <RefreshCw size={16} className="mr-2" />
              Reset All Filters
            </button>
          ) : null}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="p-3 text-left text-sm font-medium border-b w-16">
                  Photo
                </th>
                <th
                  className="p-3 text-left text-sm font-medium border-b"
                  onClick={() => handleSort("companyName")}
                >
                  <div className="flex items-center cursor-pointer group">
                    Company
                    <ArrowUpDown
                      size={14}
                      className={`ml-1 ${sortConfig.key === "companyName"
                          ? "text-blue-600"
                          : "text-gray-400 group-hover:text-gray-600"
                        }`}
                    />
                  </div>
                </th>
                <th
                  className="p-3 text-left text-sm font-medium border-b"
                  onClick={() => handleSort("industry")}
                >
                  <div className="flex items-center cursor-pointer group">
                    Industry
                    <ArrowUpDown
                      size={14}
                      className={`ml-1 ${sortConfig.key === "industry"
                          ? "text-blue-600"
                          : "text-gray-400 group-hover:text-gray-600"
                        }`}
                    />
                  </div>
                </th>
                <th
                  className="p-3 text-left text-sm font-medium border-b"
                  onClick={() => handleSort("foundedDate")}
                >
                  <div className="flex items-center cursor-pointer group">
                    Founded
                    <ArrowUpDown
                      size={14}
                      className={`ml-1 ${sortConfig.key === "foundedDate"
                          ? "text-blue-600"
                          : "text-gray-400 group-hover:text-gray-600"
                        }`}
                    />
                  </div>
                </th>
                <th
                  className="p-3 text-left text-sm font-medium border-b"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center cursor-pointer group">
                    Status
                    <ArrowUpDown
                      size={14}
                      className={`ml-1 ${sortConfig.key === "status"
                          ? "text-blue-600"
                          : "text-gray-400 group-hover:text-gray-600"
                        }`}
                    />
                  </div>
                </th>
                <th
                  className="p-3 text-left text-sm font-medium border-b"
                  onClick={() => handleSort("city")}
                >
                  <div className="flex items-center cursor-pointer group">
                    Location
                    <ArrowUpDown
                      size={14}
                      className={`ml-1 ${sortConfig.key === "city"
                          ? "text-blue-600"
                          : "text-gray-400 group-hover:text-gray-600"
                        }`}
                    />
                  </div>
                </th>
                <th className="p-3 text-left text-sm font-medium border-b">
                  Contact
                </th>
                <th className="p-3 text-center text-sm font-medium border-b">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedStartups.map((startup) => (
                <tr
                  key={startup.id}
                  className="hover:bg-blue-50 border-b text-gray-500 transition-colors"
                >
                  <td className="p-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                      <img
                        src={`${getBackendUrl()}/startups/${startup.id}/photo`}
                        alt={startup.companyName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div style={{ display: 'none' }} className="w-full h-full flex items-center justify-center">
                        <Building size={20} className="text-gray-400" />
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-gray-900">
                        {startup.companyName || "Unnamed Entity"}
                      </span>
                      {getActorBadge(startup)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {startup.companyDescription?.substring(0, 80)}
                      {startup.companyDescription?.length > 80 ? "..." : ""}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center text-sm">
                      <Briefcase size={14} className="mr-1 text-gray-400" />
                      {startup.industry || "N/A"}
                    </div>
                    {startup.businessActivity && (
                      <div className="text-xs text-gray-500 mt-1">
                        {startup.businessActivity}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center text-xs">
                      <Calendar size={14} className="mr-1 text-gray-400" />
                      {formatDate(startup.foundedDate)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {startup.typeOfCompany || "N/A"}
                    </div>
                  </td>
                  <td className="p-3">
                    {renderStatusBadge(startup.status || "Pending")}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center text-sm">
                      <Map size={14} className="mr-1 text-gray-400" />
                      {startup.city || "N/A"}
                      {startup.province ? `, ${startup.province}` : ""}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center text-sm">
                      <Mail size={14} className="mr-1 text-gray-400" />
                      {startup.contactEmail || "N/A"}
                    </div>
                    {startup.phoneNumber && (
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        <Phone size={12} className="mr-1 text-gray-400" />
                        {startup.phoneNumber}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedStartup(startup);
                          setIsPreviewOpen(true);
                        }}
                        className="p-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        title="Preview Details"
                        disabled={isActionLoading}
                      >
                        <Eye size={16} />
                      </button>

                      {(startup.status === "In Review" ||
                        startup.status === "Pending") && (
                          <>
                            <button
                              onClick={() => handleApprove(startup)}
                              className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                              title={isInvestorItem(startup) ? "Accept Investor" : "Approve Startup"}
                              disabled={isActionLoading}
                            >
                              {isActionLoading &&
                                selectedStartup?.id === startup.id ? (
                                <Loader size={16} className="animate-spin" />
                              ) : (
                                <Check size={16} />
                              )}
                            </button>
                            <button
                              onClick={() => handleInitiateReject(startup)}
                              className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                              title={isInvestorItem(startup) ? "Reject Investor" : "Reject Startup"}
                              disabled={isActionLoading}
                            >
                              {isActionLoading &&
                                selectedStartup?.id === startup.id ? (
                                <Loader size={16} className="animate-spin" />
                              ) : (
                                <X size={16} />
                              )}
                            </button>
                          </>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredStartups.length > 0 && (
        <div className="p-4 border-t flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing page {currentPage} of {totalPages}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className={`p-2 rounded ${currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:bg-blue-50"
                }`}
              aria-label="First page"
            >
              <ChevronLeft size={16} className="ml-[-14px]" />
            </button>

            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded ${currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:bg-blue-50"
                }`}
              aria-label="Previous page"
            ></button>

            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center rounded ${currentPage === pageNum
                        ? "bg-blue-600 text-white"
                        : "hover:bg-blue-50 text-gray-700"
                      }`}
                    aria-label={`Page ${pageNum}`}
                    aria-current={currentPage === pageNum ? "page" : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded ${currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:bg-blue-50"
                }`}
              aria-label="Next page"
            ></button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded ${currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:bg-blue-50"
                }`}
              aria-label="Last page"
            >
              <ChevronRight size={16} className="ml-[-14px]" />
            </button>
          </div>
        </div>
      )}

      {isPreviewOpen && selectedStartup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-4/5 max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                {isInvestorItem(selectedStartup) ? (
                  <TrendingUp className="text-amber-600" size={22} />
                ) : (
                  <Building className="text-blue-900" size={22} />
                )}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    {selectedStartup.companyName ||
                      (isInvestorItem(selectedStartup)
                        ? "Investor Details"
                        : "Startup Details")}
                    {getActorBadge(selectedStartup)}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {isInvestorItem(selectedStartup)
                      ? "Investor & Venture Capital Profile Review"
                      : "Startup Application & Credentials Review"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {(selectedStartup.status === "In Review" ||
                  selectedStartup.status === "Pending") && (
                    <>
                      <button
                        onClick={() => handleInitiateReject(selectedStartup)}
                        disabled={isActionLoading}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center text-sm font-medium shadow-sm disabled:opacity-50"
                      >
                        {isActionLoading ? (
                          <Loader size={16} className="mr-1 animate-spin" />
                        ) : (
                          <X size={16} className="mr-1" />
                        )}
                        <span>
                          {isInvestorItem(selectedStartup)
                            ? "Reject Investor"
                            : "Reject"}
                        </span>
                      </button>
                      <button
                        onClick={() => handleApprove(selectedStartup)}
                        disabled={isActionLoading}
                        className="px-3.5 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center text-sm font-medium shadow-sm disabled:opacity-50"
                      >
                        {isActionLoading ? (
                          <Loader size={16} className="mr-1 animate-spin" />
                        ) : (
                          <Check size={16} className="mr-1" />
                        )}
                        <span>
                          {isInvestorItem(selectedStartup)
                            ? "Accept Investor"
                            : "Approve"}
                        </span>
                      </button>
                    </>
                  )}
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-6 flex-grow">
              {/* Company Photo Banner */}
              {(photoUrl || loadingPhoto) && (
                <div className="mb-6 bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-200">
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-white shadow-md flex-shrink-0">
                      {loadingPhoto ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader className="animate-spin text-indigo-600" size={24} />
                        </div>
                      ) : photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={selectedStartup.companyName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <Building size={32} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-indigo-900">
                        {selectedStartup.companyName}
                      </h4>
                      <p className="text-sm text-indigo-700 mt-1">
                        {selectedStartup.industry || "No industry specified"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Banner */}
              <div className="flex items-center justify-between mb-6 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div className="flex items-center">
                  <Info size={18} className="text-blue-700 mr-2" />
                  <span
                    className={`text-sm font-medium ${selectedStartup.status === "Approved"
                        ? "text-green-700"
                        : selectedStartup.status === "Rejected"
                          ? "text-red-700"
                          : "text-blue-800"
                      }`}
                  >
                    Status:{" "}
                    <strong>{selectedStartup.status || "Pending"}</strong>
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Eye size={16} className="text-blue-700 mr-1" />
                    <span className="text-sm text-blue-800">
                      Views: {selectedStartup.viewsCount || 0}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Calendar size={16} className="text-blue-700 mr-1" />
                    <span className="text-sm text-blue-800">
                      Submitted:{" "}
                      {formatDate(
                        selectedStartup.createdAt || selectedStartup.foundedDate
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Company Information */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-5 rounded-lg border shadow-sm">
                    <h3 className="text-lg font-medium text-blue-900 border-b pb-2 mb-4 flex items-center">
                      <Building size={18} className="mr-2" />
                      Company Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Company Name
                        </p>
                        <p className="text-gray-800 font-medium">
                          {selectedStartup.companyName || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Type of Company
                        </p>
                        <p className="text-gray-800">
                          {selectedStartup.typeOfCompany || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Industry
                        </p>
                        <p className="text-gray-800">
                          {selectedStartup.industry || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Business Activity
                        </p>
                        <p className="text-gray-800">
                          {selectedStartup.businessActivity || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Founded Date
                        </p>
                        <p className="text-gray-800">
                          {formatDate(selectedStartup.foundedDate)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Company Size
                        </p>
                        <p className="text-gray-800">
                          {selectedStartup.numberOfEmployees || "N/A"} employees
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Operating Hours
                        </p>
                        <p className="text-gray-800">
                          {selectedStartup.operatingHours || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          TRL Level
                        </p>
                        <p className="text-gray-800">
                          {selectedStartup.trlLevel || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Verified Credentials
                        </p>
                        <p className="text-gray-800">
                          {selectedStartup.verifiedCredentials || "N/A"}
                        </p>
                      </div>

                      <div className="md:col-span-2 mt-2">
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                          <p className="text-sm font-medium text-blue-800 mb-1">
                            Has Supports?
                          </p>
                          <p className="text-blue-900 font-medium mb-2">
                            {selectedStartup.hasSupports === "Yes" ? "Yes" : "No"}
                          </p>
                          {selectedStartup.hasSupports === "Yes" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 border-t border-blue-200 pt-2">
                              <div>
                                <p className="text-xs font-medium text-blue-700">Support Provider</p>
                                <p className="text-sm text-blue-900">{selectedStartup.supportProvider || "N/A"}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-blue-700">Support Program</p>
                                <p className="text-sm text-blue-900">{selectedStartup.supportProgram || "N/A"}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-lg border shadow-sm">
                    <h3 className="text-lg font-medium text-blue-900 border-b pb-2 mb-4">
                      Company Description
                    </h3>
                    <p className="text-gray-700 whitespace-pre-line">
                      {selectedStartup.companyDescription ||
                        "No description provided."}
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-lg border shadow-sm">
                    <h3 className="text-lg font-medium text-blue-900 border-b pb-2 mb-4 flex items-center">
                      <DollarSign size={18} className="mr-2" />
                      Funding Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Funding Stage
                        </p>
                        <p className="text-gray-800">
                          {selectedStartup.fundingStage || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Total Funding Received
                        </p>
                        <p className="text-gray-900 font-bold text-emerald-700">
                          {selectedStartup.totalStartupFundingReceived != null && selectedStartup.totalStartupFundingReceived > 0
                            ? `₱${Number(selectedStartup.totalStartupFundingReceived).toLocaleString()}`
                            : "₱0"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Number of Funding Rounds
                        </p>
                        <p className="text-gray-800">
                          {selectedStartup.numberOfFundingRounds || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Active Startups
                        </p>
                        <p className="text-gray-800">
                          {selectedStartup.numberOfActiveStartups || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          New Startups This Year
                        </p>
                        <p className="text-gray-800">
                          {selectedStartup.numberOfNewStartupsThisYear || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Startup Survival Rate
                        </p>
                        <p className="text-gray-800">
                          {selectedStartup.startupSurvivalRate
                            ? `${selectedStartup.startupSurvivalRate}%`
                            : "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Growth Rate
                        </p>
                        <p className="text-gray-800">
                          {selectedStartup.averageStartupGrowthRate
                            ? `${selectedStartup.averageStartupGrowthRate}%`
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Government Registration & Documents */}
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-5 rounded-lg border border-purple-200 shadow-sm">
                    <h3 className="text-lg font-medium text-purple-900 border-b border-purple-200 pb-2 mb-4 flex items-center">
                      <Award size={18} className="mr-2" />
                      Government Registration & Documents
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-sm font-medium text-gray-500 flex items-center mb-1">
                            <Hash size={14} className="mr-1 text-purple-600" />
                            Registered
                          </p>
                          <p className="text-gray-800 font-semibold">
                            {selectedStartup.isGovernmentRegistered ? (
                              <span className="text-green-600 flex items-center">
                                <Check size={16} className="mr-1" />
                                Yes
                              </span>
                            ) : (
                              <span className="text-gray-500">No</span>
                            )}
                          </p>
                        </div>

                        {selectedStartup.isGovernmentRegistered && (
                          <>
                            <div className="bg-white p-3 rounded-lg">
                              <p className="text-sm font-medium text-gray-500 mb-1">Agency</p>
                              <p className="text-gray-800 font-medium">
                                {selectedStartup.registrationAgency === "other" && selectedStartup.otherRegistrationAgency
                                  ? selectedStartup.otherRegistrationAgency
                                  : selectedStartup.registrationAgency || "N/A"}
                              </p>
                            </div>

                            <div className="bg-white p-3 rounded-lg">
                              <p className="text-sm font-medium text-gray-500 mb-1">Registration Number</p>
                              <p className="text-gray-800 font-mono text-sm">
                                {selectedStartup.registrationNumber || "N/A"}
                              </p>
                            </div>

                            <div className="bg-white p-3 rounded-lg">
                              <p className="text-sm font-medium text-gray-500 mb-1">Registration Date</p>
                              <p className="text-gray-800">
                                {formatDate(selectedStartup.registrationDate)}
                              </p>
                            </div>

                            <div className="bg-white p-3 rounded-lg">
                              <p className="text-sm font-medium text-gray-500 mb-1">Business License</p>
                              <p className="text-gray-800 font-mono text-sm">
                                {selectedStartup.businessLicenseNumber || "N/A"}
                              </p>
                            </div>

                            <div className="bg-white p-3 rounded-lg">
                              <p className="text-sm font-medium text-gray-500 mb-1">TIN</p>
                              <p className="text-gray-800 font-mono text-sm">
                                {selectedStartup.tin || "N/A"}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Registration Certificate */}
                      {selectedStartup.isGovernmentRegistered && (
                        <div className="mt-4 bg-white p-4 rounded-lg border-2 border-dashed border-purple-300">
                          <h4 className="text-sm font-semibold text-purple-900 mb-3 flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Registration Certificate
                          </h4>

                          {loadingCertificate ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader className="animate-spin text-purple-600 mr-2" size={20} />
                              <span className="text-gray-600">Loading certificate...</span>
                            </div>
                          ) : certificateUrl ? (
                            <div className="space-y-3">
                              <div className="bg-purple-50 p-3 rounded-md border border-purple-200">
                                <p className="text-sm text-purple-800 flex items-center">
                                  <Check size={16} className="mr-2 text-green-600" />
                                  Certificate document available
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <a
                                  href={certificateUrl}
                                  download={`registration-certificate-${selectedStartup.companyName}.pdf`}
                                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center text-sm font-medium"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                  Download Certificate
                                </a>
                                <a
                                  href={certificateUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center text-sm font-medium"
                                >
                                  <Eye size={16} className="mr-2" />
                                  View Certificate
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 text-center">
                              <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-sm text-gray-600">No certificate document uploaded</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Contact & Social */}
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-lg border shadow-sm">
                    <h3 className="text-lg font-medium text-blue-900 border-b pb-2 mb-4 flex items-center">
                      <Mail size={18} className="mr-2" />
                      Contact Details
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500 flex items-center">
                          <Mail size={14} className="mr-1" /> Email
                        </p>
                        <p className="text-gray-800 break-all">
                          {selectedStartup.contactEmail || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500 flex items-center">
                          <Phone size={14} className="mr-1" /> Phone
                        </p>
                        <p className="text-gray-800">
                          {selectedStartup.phoneNumber || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500 flex items-center">
                          <Map size={14} className="mr-1" /> Location
                        </p>
                        <p className="text-gray-800">
                          {selectedStartup.city || "N/A"}
                          {selectedStartup.province
                            ? `, ${selectedStartup.province}`
                            : ""}
                          {selectedStartup.country
                            ? `, ${selectedStartup.country}`
                            : ""}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {selectedStartup.streetAddress || ""}{" "}
                          {selectedStartup.postalCode
                            ? selectedStartup.postalCode
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-lg border shadow-sm">
                    <h3 className="text-lg font-medium text-blue-900 border-b pb-2 mb-4 flex items-center">
                      <Globe size={18} className="mr-2" />
                      Web Presence
                    </h3>

                    <div className="space-y-3">
                      {selectedStartup.website && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Website
                          </p>
                          <a
                            href={selectedStartup.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-words"
                          >
                            {selectedStartup.website}
                          </a>
                        </div>
                      )}

                      {selectedStartup.linkedIn && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            LinkedIn
                          </p>
                          <a
                            href={selectedStartup.linkedIn}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-words"
                          >
                            {selectedStartup.linkedIn.replace(
                              "https://www.linkedin.com/company/",
                              ""
                            )}
                          </a>
                        </div>
                      )}

                      {selectedStartup.facebook && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Facebook
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <a
                              href={selectedStartup.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline break-words"
                            >
                              {selectedStartup.facebook.replace(
                                "https://www.facebook.com/",
                                ""
                              )}
                            </a>
                            {(selectedStartup.facebookFollowers > 0 || selectedStartup.facebookLikes > 0) && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                {selectedStartup.facebookFollowers > 0 && `${selectedStartup.facebookFollowers.toLocaleString()} followers`}
                                {selectedStartup.facebookFollowers > 0 && selectedStartup.facebookLikes > 0 && " · "}
                                {selectedStartup.facebookLikes > 0 && `${selectedStartup.facebookLikes.toLocaleString()} likes`}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedStartup.twitter && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Twitter
                          </p>
                          <a
                            href={selectedStartup.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-words"
                          >
                            {selectedStartup.twitter.replace(
                              "https://twitter.com/",
                              "@"
                            )}
                          </a>
                        </div>
                      )}

                      {selectedStartup.instagram && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Instagram
                          </p>
                          <a
                            href={selectedStartup.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-words"
                          >
                            {selectedStartup.instagram.replace(
                              "https://www.instagram.com/",
                              "@"
                            )}
                          </a>
                        </div>
                      )}

                      {!selectedStartup.website &&
                        !selectedStartup.linkedIn &&
                        !selectedStartup.facebook &&
                        !selectedStartup.twitter &&
                        !selectedStartup.instagram && (
                          <p className="text-gray-500 italic">
                            No web presence information provided.
                          </p>
                        )}
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-lg border shadow-sm">
                    <h3 className="text-lg font-medium text-blue-900 border-b pb-2 mb-4 flex items-center">
                      <Users size={18} className="mr-2" />
                      Ecosystem Information
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Number of Mentors
                        </p>
                        <p className="text-gray-800">
                          {selectedStartup.numberOfMentorsOrAdvisorsInvolved ||
                            "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Incubation Programs
                        </p>
                        <p className="text-gray-800">
                          {selectedStartup.numberOfStartupsInIncubationPrograms ||
                            "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Public-Private Partnerships
                        </p>
                        <p className="text-gray-800">
                          {selectedStartup.publicPrivatePartnershipsInvolvingStartups ||
                            "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-lg border shadow-sm">
                    <h3 className="text-lg font-medium text-blue-900 border-b pb-2 mb-4 flex items-center">
                      <Clock size={18} className="mr-2" />
                      Review Timeline
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="bg-blue-100 rounded-full p-1 mr-3 mt-0.5">
                          <Mail size={14} className="text-blue-700" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Startup Submitted
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(
                              selectedStartup.createdAt ||
                              selectedStartup.foundedDate
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="bg-green-100 rounded-full p-1 mr-3 mt-0.5">
                          <Check size={14} className="text-green-700" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Email Verified
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(
                              selectedStartup.emailVerifiedAt ||
                              selectedStartup.foundedDate
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div
                          className={`${selectedStartup.status === "Approved"
                              ? "bg-green-100"
                              : selectedStartup.status === "Rejected"
                                ? "bg-red-100"
                                : "bg-gray-100"
                            } rounded-full p-1 mr-3 mt-0.5`}
                        >
                          {selectedStartup.status === "Approved" ? (
                            <Check size={14} className="text-green-700" />
                          ) : selectedStartup.status === "Rejected" ? (
                            <X size={14} className="text-red-700" />
                          ) : (
                            <Clock size={14} className="text-gray-700" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Final Decision
                          </p>
                          <p className="text-xs text-gray-500">
                            {selectedStartup.status === "Approved" ||
                              selectedStartup.status === "Rejected"
                              ? formatDate(
                                selectedStartup.updatedAt ||
                                selectedStartup.foundedDate
                              )
                              : "Pending"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Decision Footer Bar in Preview Modal */}
            {(selectedStartup.status === "In Review" ||
              selectedStartup.status === "Pending") && (
              <div className="bg-gray-50 border-t border-gray-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-sm text-gray-600">
                  Ready to make a decision on this{" "}
                  <span className="font-semibold text-gray-900">
                    {isInvestorItem(selectedStartup)
                      ? "Investor Application"
                      : "Startup Submission"}
                  </span>
                  ?
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleInitiateReject(selectedStartup)}
                    disabled={isActionLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center font-medium text-sm shadow-sm disabled:opacity-50"
                  >
                    <X size={16} className="mr-1.5" />
                    {isInvestorItem(selectedStartup)
                      ? "Reject Investor"
                      : "Reject Application"}
                  </button>
                  <button
                    onClick={() => handleApprove(selectedStartup)}
                    disabled={isActionLoading}
                    className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center font-medium text-sm shadow-sm disabled:opacity-50"
                  >
                    <Check size={16} className="mr-1.5" />
                    {isInvestorItem(selectedStartup)
                      ? "Accept & Approve Investor"
                      : "Approve Startup"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add the rejection modal */}
      {isRejectionModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center">
              <h3 className="text-lg font-medium flex items-center text-red-800">
                <MessageSquare className="mr-2" size={20} />
                {pendingRejectionIsInvestor
                  ? "Provide Rejection Reason for Investor"
                  : "Provide Rejection Reason"}
              </h3>
              <button
                onClick={() => setIsRejectionModalOpen(false)}
                className="p-1 hover:bg-red-200 text-red-600 rounded-full transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <p className="mb-4 text-gray-600">
                {pendingRejectionIsInvestor
                  ? "Please select or provide a reason for rejecting this investor application. This feedback will help the investor understand why their profile was not approved."
                  : "Please select or provide a reason for rejecting this startup. This feedback will help the startup owner understand what needs to be improved."}
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Common Reasons:
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {(pendingRejectionIsInvestor
                    ? investorRejectionReasons
                    : commonRejectionReasons
                  ).map((reason, index) => (
                    <div key={index} className="flex items-start">
                      <button
                        type="button"
                        onClick={() => setRejectionComment(reason)}
                        className={`text-left text-gray-800 px-3 py-2 rounded-md w-full ${
                          rejectionComment === reason
                            ? "bg-red-100 text-red-800 font-medium"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        {reason}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="rejectionComment"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {rejectionComment === "Other (please specify)" ||
                  !(pendingRejectionIsInvestor
                    ? investorRejectionReasons
                    : commonRejectionReasons
                  ).includes(rejectionComment)
                    ? "Please specify:"
                    : "Additional comments (optional):"}
                </label>
                <textarea
                  id="rejectionComment"
                  value={rejectionComment}
                  onChange={(e) => setRejectionComment(e.target.value)}
                  rows={3}
                  placeholder="Enter rejection reason..."
                  className="w-full text-gray-800 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setIsRejectionModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={isActionLoading || !rejectionComment.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
                >
                  {isActionLoading ? (
                    <Loader size={16} className="mr-2 animate-spin" />
                  ) : null}
                  {pendingRejectionIsInvestor
                    ? "Confirm Investor Rejection"
                    : "Submit Rejection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
