import React, { useState, useEffect } from "react";
import { Search, X, UserPlus, Users, Mail, Phone, MapPin, ChevronRight, Loader2, AlertTriangle, CheckCircle2, Send, DollarSign, Briefcase } from "lucide-react";
import { toast } from "react-toastify";
import { getBackendUrl, getAuthHeaders } from "../config/apiConfig";

const StakeholderBrowser = ({
  isOpen,
  onClose,
  onSelectStakeholder,
  onCreateNew,
  startupId
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stakeholders, setStakeholders] = useState([]);
  const [filteredStakeholders, setFilteredStakeholders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [associatedStakeholderIds, setAssociatedStakeholderIds] = useState(new Set());
  const [selectedStakeholder, setSelectedStakeholder] = useState(null);
  const [isAssociating, setIsAssociating] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [pendingStakeholder, setPendingStakeholder] = useState(null);
  const [associationRole, setAssociationRole] = useState("Mentor");
  const [associationStatus, setAssociationStatus] = useState("Active");
  const [applyingInvestor, setApplyingInvestor] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applicationForm, setApplicationForm] = useState({
    applicantName: "",
    applicantEmail: "",
    applicantPhone: "",
    fundingStage: "Seed",
    requestedAmount: "",
    equityOrTerms: "Equity",
    pitchMessage: "",
  });
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    stakeholderName: "",
  });

  // Fetch all stakeholders and investors from database
  useEffect(() => {
    if (isOpen) {
      fetchStakeholders();
      fetchStartupStakeholders();

      try {
        const userStr = localStorage.getItem("user");
        const storedUser = userStr ? JSON.parse(userStr) : null;
        if (storedUser) {
          const fullName = `${storedUser.firstname || storedUser.firstName || ""} ${
            storedUser.lastname || storedUser.lastName || ""
          }`.trim();
          setApplicationForm((prev) => ({
            ...prev,
            applicantName: prev.applicantName || fullName,
            applicantEmail: prev.applicantEmail || storedUser.email || "",
          }));
        }
      } catch {
        // ignore parse errors
      }
    }
  }, [isOpen]);

  // Filter stakeholders based on category and search query
  useEffect(() => {
    let filtered = stakeholders;

    if (categoryFilter === "investors") {
      filtered = filtered.filter(
        (item) => item.isInvestor || item.role?.toLowerCase() === "investor"
      );
    } else if (categoryFilter === "others") {
      filtered = filtered.filter(
        (item) => !item.isInvestor && item.role?.toLowerCase() !== "investor"
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (stakeholder) =>
          stakeholder.name?.toLowerCase().includes(query) ||
          stakeholder.email?.toLowerCase().includes(query) ||
          stakeholder.role?.toLowerCase().includes(query) ||
          stakeholder.city?.toLowerCase().includes(query) ||
          stakeholder.province?.toLowerCase().includes(query) ||
          stakeholder.locationName?.toLowerCase().includes(query) ||
          stakeholder.biography?.toLowerCase().includes(query)
      );
    }

    setFilteredStakeholders(filtered);
  }, [searchQuery, categoryFilter, stakeholders]);

  const fetchStakeholders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [stakeholdersRes, investorsRes] = await Promise.all([
        fetch(`${getBackendUrl()}/stakeholders`, { headers }),
        fetch(`${getBackendUrl()}/investors/directory`, { headers }).catch(() => null),
      ]);

      if (!stakeholdersRes.ok) {
        throw new Error("Failed to fetch stakeholders");
      }

      const stakeholdersData = await stakeholdersRes.json();
      const investorsData =
        investorsRes && investorsRes.ok ? await investorsRes.json() : [];

      const normalizedInvestors = (Array.isArray(investorsData) ? investorsData : []).map(
        (inv) => ({
          id: `investor-${inv.investorId}`,
          investorId: inv.investorId,
          isInvestor: true,
          name: `${inv.firstname || ""} ${inv.lastname || ""}`.trim() || inv.emailAddress || "Investor",
          email: inv.emailAddress,
          phoneNumber: inv.contactInformation,
          locationName: inv.locationName,
          biography: inv.biography,
          website: inv.website,
          role: "Investor",
          status: inv.status === "Approved" ? "Active" : inv.status || "Active",
        })
      );

      const combined = [...normalizedInvestors, ...(Array.isArray(stakeholdersData) ? stakeholdersData : [])];
      setStakeholders(combined);
      setFilteredStakeholders(combined);
    } catch (error) {
      console.error("Error fetching stakeholders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStartupStakeholders = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${getBackendUrl()}/startup-stakeholders/startup/${startupId}/stakeholders`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch startup stakeholders");
      }

      const data = await response.json();
      // Create a Set of stakeholder IDs that are already associated
      // The stakeholder ID is in the nested stakeholder object
      const associatedIds = new Set(data.map(s => s.stakeholder?.id).filter(Boolean));
      setAssociatedStakeholderIds(associatedIds);
    } catch (error) {
      console.error("Error fetching startup stakeholders:", error);
    }
  };

  const handleSelectAndAssociate = async (stakeholder) => {
    if (stakeholder.isInvestor) {
      setApplyingInvestor(stakeholder);
      return;
    }

    // Check if stakeholder is already associated
    if (associatedStakeholderIds.has(stakeholder.id)) {
      setErrorModal({
        isOpen: true,
        title: "Already Associated",
        message: "This stakeholder is already associated with this startup. You can view or edit their details in the stakeholders list.",
        stakeholderName: stakeholder.name,
      });
      return;
    }

    // Show role selection modal first
    setPendingStakeholder(stakeholder);
    setAssociationRole(stakeholder.role || "Mentor");
    setAssociationStatus(stakeholder.status || "Active");
    setShowRoleModal(true);
  };

  const confirmAssociation = async () => {
    if (!pendingStakeholder) return;

    setSelectedStakeholder(pendingStakeholder);
    setIsAssociating(true);

    try {
      // Associate the selected stakeholder with the startup
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${getBackendUrl()}/startup-stakeholders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            startupId: startupId,
            stakeholderId: pendingStakeholder.id,
            role: associationRole,
            status: associationStatus,
          }),
        }
      );

      const data = await response.json();

      // Check for duplicate stakeholder (success: false in response)
      if (!data.success) {
        throw new Error(data.message || "Failed to associate stakeholder");
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to associate stakeholder");
      }

      // Call the parent callback with success
      onSelectStakeholder({
        ...pendingStakeholder,
        role: associationRole,
        status: associationStatus,
      });
      handleClose();
    } catch (error) {
      console.error("Error associating stakeholder:", error);

      // Show professional error notification
      setShowRoleModal(false);
      setPendingStakeholder(null);
      setSelectedStakeholder(null);
      setIsAssociating(false);

      // Display error in a modal instead of alert
      setErrorModal({
        isOpen: true,
        title: "Unable to Add Stakeholder",
        message: error.message || "Failed to associate stakeholder with startup",
        stakeholderName: pendingStakeholder.name,
      });
      return;
    } finally {
      if (!errorModal.isOpen) {
        setShowRoleModal(false);
        setPendingStakeholder(null);
        setSelectedStakeholder(null);
        setIsAssociating(false);
      }
    }
  };

  const handleSubmitInvestmentApplication = async (e) => {
    e.preventDefault();
    if (!applyingInvestor || !startupId) return;

    if (!applicationForm.applicantName.trim() || !applicationForm.applicantEmail.trim()) {
      toast.warning("Please provide your name and contact email.");
      return;
    }
    if (!applicationForm.requestedAmount.trim()) {
      toast.warning("Please specify your requested investment amount.");
      return;
    }

    setIsApplying(true);
    try {
      const response = await fetch(
        `${getBackendUrl()}/investors/${applyingInvestor.investorId}/apply-investment`,
        {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          credentials: "include",
          body: JSON.stringify({
            ...applicationForm,
            startupId: Number(startupId),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to submit investment application");
      }

      toast.success(`Investment application sent to ${applyingInvestor.name}!`);
      setApplyingInvestor(null);
      setApplicationForm((prev) => ({
        ...prev,
        requestedAmount: "",
        pitchMessage: "",
      }));
    } catch (error) {
      console.error("Error applying for investment:", error);
      toast.error(error.message || "Failed to submit investment application.");
    } finally {
      setIsApplying(false);
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setSelectedStakeholder(null);
    setIsAssociating(false);
    setShowRoleModal(false);
    setPendingStakeholder(null);
    setApplyingInvestor(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Users className="mr-3 text-blue-600" size={28} />
              Select Stakeholder
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Browse existing stakeholders or create a new one
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isAssociating}
            className="rounded-full p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search and Create New Section */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, email, role, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 text-gray-800 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Create New Button */}
            <button
              type="button"
              onClick={() => {
                handleClose();
                onCreateNew();
              }}
              disabled={isAssociating}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus size={18} className="mr-2" />
              Create New
            </button>
          </div>

          {/* Category Filter Tabs & Results count */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer ${
                  categoryFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                }`}
              >
                All ({stakeholders.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("investors")}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer ${
                  categoryFilter === "investors"
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                }`}
              >
                Investors ({stakeholders.filter((s) => s.isInvestor || s.role?.toLowerCase() === "investor").length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("others")}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer ${
                  categoryFilter === "others"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                }`}
              >
                Other Stakeholders ({stakeholders.filter((s) => !s.isInvestor && s.role?.toLowerCase() !== "investor").length})
              </button>
            </div>

            <div className="text-sm text-gray-600">
              {loading ? (
                <span>Loading stakeholders...</span>
              ) : (
                <span>
                  Showing {filteredStakeholders.length} of {stakeholders.length} stakeholders
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stakeholder List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
              <p className="text-gray-600">Loading stakeholders...</p>
            </div>
          ) : filteredStakeholders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="text-gray-300 mb-4" size={64} />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {searchQuery ? "No stakeholders found" : "No stakeholders available"}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Start by creating your first stakeholder"}
              </p>
              <button
                onClick={() => {
                  handleClose();
                  onCreateNew();
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center transition-colors"
              >
                <UserPlus size={18} className="mr-2" />
                Create First Stakeholder
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStakeholders.map((stakeholder) => {
                const isAlreadyAssociated = associatedStakeholderIds.has(stakeholder.id);
                return (
                  <div
                    key={stakeholder.id}
                    className={`border rounded-lg p-4 transition-all bg-white ${isAlreadyAssociated
                        ? "border-green-300 bg-green-50/30 cursor-not-allowed opacity-75"
                        : "border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer"
                      }`}
                    onClick={() => !isAssociating && !isAlreadyAssociated && handleSelectAndAssociate(stakeholder)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {stakeholder.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            {isAlreadyAssociated && (
                              <span className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm">
                                <CheckCircle2 size={14} className="mr-1.5" />
                                ASSOCIATED
                              </span>
                            )}
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              stakeholder.isInvestor || stakeholder.role?.toLowerCase() === "investor"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-blue-100 text-blue-800"
                            }`}>
                              {stakeholder.role || "Stakeholder"}
                            </span>
                          </div>
                        </div>

                        {stakeholder.biography && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{stakeholder.biography}</p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          {stakeholder.email && (
                            <div className="flex items-center">
                              <Mail size={14} className="mr-2 text-gray-400 flex-shrink-0" />
                              <span className="truncate">{stakeholder.email}</span>
                            </div>
                          )}

                          {stakeholder.phoneNumber && (
                            <div className="flex items-center">
                              <Phone size={14} className="mr-2 text-gray-400 flex-shrink-0" />
                              <span>{stakeholder.phoneNumber}</span>
                            </div>
                          )}

                          {(stakeholder.city || stakeholder.province || stakeholder.locationName) && (
                            <div className="flex items-center md:col-span-2">
                              <MapPin size={14} className="mr-2 text-gray-400 flex-shrink-0" />
                              <span className="truncate">
                                {[stakeholder.city, stakeholder.province].filter(Boolean).join(", ") ||
                                  stakeholder.locationName}
                              </span>
                            </div>
                          )}
                        </div>

                        {stakeholder.status && (
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stakeholder.status === "Active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                              }`}>
                              {stakeholder.status}
                            </span>
                            {stakeholder.isInvestor && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setApplyingInvestor(stakeholder);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                              >
                                <Send size={13} />
                                Apply for Investment
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {isAssociating && selectedStakeholder?.id === stakeholder.id ? (
                        <div className="ml-4 flex items-center text-blue-600">
                          <Loader2 className="animate-spin" size={20} />
                        </div>
                      ) : !isAlreadyAssociated ? (
                        <div className="ml-4 flex items-center text-gray-400">
                          <ChevronRight size={20} />
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={isAssociating}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Role and Status Selection Modal */}
      {showRoleModal && pendingStakeholder && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Set Role and Status
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Configure how <span className="font-semibold">{pendingStakeholder.name}</span> will be associated with this startup
              </p>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={associationRole}
                  onChange={(e) => setAssociationRole(e.target.value)}
                  className="w-full px-4 py-2.5 border text-gray-800 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isAssociating}
                >
                  <option value="Founder">Founder</option>
                  <option value="Co-Founder">Co-Founder</option>
                  <option value="CEO">CEO</option>
                  <option value="CTO">CTO</option>
                  <option value="CFO">CFO</option>
                  <option value="COO">COO</option>
                  <option value="Board Member">Board Member</option>
                  <option value="Investor">Investor</option>
                  <option value="Advisor">Advisor</option>
                  <option value="Mentor">Mentor</option>
                  <option value="Partner">Partner</option>
                  <option value="Consultant">Consultant</option>
                  <option value="Employee">Employee</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={associationStatus}
                  onChange={(e) => setAssociationStatus(e.target.value)}
                  className="w-full px-4 py-2.5 text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isAssociating}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Former">Former</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> The role and status you select here will be specific to this startup.
                  The stakeholder's general profile will remain unchanged.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRoleModal(false);
                  setPendingStakeholder(null);
                }}
                disabled={isAssociating}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAssociation}
                disabled={isAssociating}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAssociating ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={18} />
                    Associating...
                  </>
                ) : (
                  <>
                    <ChevronRight size={18} className="mr-1" />
                    Associate Stakeholder
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply for Investment Modal */}
      {applyingInvestor && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Briefcase className="text-emerald-600" size={20} />
                  Apply for Investment
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  Send your funding request to <span className="font-semibold">{applyingInvestor.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setApplyingInvestor(null)}
                disabled={isApplying}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitInvestmentApplication} className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Applicant Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={applicationForm.applicantName}
                    onChange={(e) => setApplicationForm((prev) => ({ ...prev, applicantName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Contact Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={applicationForm.applicantEmail}
                    onChange={(e) => setApplicationForm((prev) => ({ ...prev, applicantEmail: e.target.value }))}
                    className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={applicationForm.applicantPhone}
                    onChange={(e) => setApplicationForm((prev) => ({ ...prev, applicantPhone: e.target.value }))}
                    placeholder="+63 9XX XXX XXXX"
                    className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Funding Stage
                  </label>
                  <select
                    value={applicationForm.fundingStage}
                    onChange={(e) => setApplicationForm((prev) => ({ ...prev, fundingStage: e.target.value }))}
                    className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Pre-Seed">Pre-Seed</option>
                    <option value="Seed">Seed</option>
                    <option value="Series A">Series A</option>
                    <option value="Series B+">Series B+</option>
                    <option value="Growth / Expansion">Growth / Expansion</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Requested Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={applicationForm.requestedAmount}
                      onChange={(e) => setApplicationForm((prev) => ({ ...prev, requestedAmount: e.target.value }))}
                      placeholder="e.g. ₱500,000"
                      className="w-full pl-9 pr-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Preferred Terms
                  </label>
                  <select
                    value={applicationForm.equityOrTerms}
                    onChange={(e) => setApplicationForm((prev) => ({ ...prev, equityOrTerms: e.target.value }))}
                    className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Equity">Equity</option>
                    <option value="Convertible Note">Convertible Note</option>
                    <option value="Revenue Share">Revenue Share</option>
                    <option value="Debt / Loan">Debt / Loan</option>
                    <option value="Open to Discussion">Open to Discussion</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Pitch Summary &amp; Use of Funds
                </label>
                <textarea
                  rows={3}
                  value={applicationForm.pitchMessage}
                  onChange={(e) => setApplicationForm((prev) => ({ ...prev, pitchMessage: e.target.value }))}
                  placeholder="Describe your startup traction and how the investment will be used..."
                  className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setApplyingInvestor(null)}
                  disabled={isApplying}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isApplying}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit Application
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Header with icon */}
            <div className="px-6 py-5 border-b border-red-100 bg-gradient-to-r from-red-50 to-white">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="text-red-600" size={24} />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    {errorModal.title}
                  </h3>
                  {errorModal.stakeholderName && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-semibold">{errorModal.stakeholderName}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800 leading-relaxed">
                  {errorModal.message}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Tip:</strong> This stakeholder is already associated with this startup.
                  You can view or edit their details in the stakeholders list.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setErrorModal({
                    isOpen: false,
                    title: "",
                    message: "",
                    stakeholderName: "",
                  });
                }}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StakeholderBrowser;
