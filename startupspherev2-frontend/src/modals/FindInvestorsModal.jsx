import React, { useState, useEffect } from "react";
import { getBackendUrl, getAuthHeaders } from "../config/apiConfig";
import { toast } from "react-toastify";
import {
  X,
  Search,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  Globe,
  Send,
  ArrowLeft,
  Loader2,
  Users,
  DollarSign,
  Building,
  CheckCircle2,
} from "lucide-react";

export default function FindInvestorsModal({
  isOpen,
  onClose,
  startups = [],
  selectedStartupId = "all",
  initialInvestor = null,
}) {
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    startupId: "",
    applicantName: "",
    applicantEmail: "",
    applicantPhone: "",
    fundingStage: "Seed",
    requestedAmount: "",
    equityOrTerms: "Equity",
    pitchMessage: "",
  });

  const suggestedAmounts = [
    "₱100,000",
    "₱250,000",
    "₱500,000",
    "₱1,000,000",
    "₱5,000,000+",
  ];

  useEffect(() => {
    if (!isOpen) return;

    if (initialInvestor) {
      setSelectedInvestor(initialInvestor);
    } else {
      fetchInvestors();
    }

    let storedUser = null;
    try {
      const userStr = localStorage.getItem("user");
      storedUser = userStr ? JSON.parse(userStr) : null;
    } catch {
      storedUser = null;
    }

    const fullName = storedUser
      ? `${storedUser.firstname || storedUser.firstName || ""} ${
          storedUser.lastname || storedUser.lastName || ""
        }`.trim()
      : "";

    const defaultStartupId =
      selectedStartupId !== "all" && startups.some((s) => String(s.id) === String(selectedStartupId))
        ? String(selectedStartupId)
        : startups[0]?.id
        ? String(startups[0].id)
        : "";

    setFormData((prev) => ({
      ...prev,
      startupId: defaultStartupId,
      applicantName: prev.applicantName || fullName,
      applicantEmail: prev.applicantEmail || storedUser?.email || "",
    }));
  }, [isOpen, selectedStartupId, startups]);

  const fetchInvestors = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${getBackendUrl()}/investors/directory`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to load investors");
      }
      const data = await response.json();
      setInvestors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching investors:", err);
      toast.error("Could not load investors directory.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredInvestors = investors.filter((inv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const fullName = `${inv.firstname || ""} ${inv.lastname || ""}`.toLowerCase();
    return (
      fullName.includes(q) ||
      (inv.biography || "").toLowerCase().includes(q) ||
      (inv.locationName || "").toLowerCase().includes(q) ||
      (inv.emailAddress || "").toLowerCase().includes(q)
    );
  });

  const handleClose = () => {
    setSelectedInvestor(null);
    setSearchQuery("");
    onClose();
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!selectedInvestor) return;

    if (!formData.startupId) {
      toast.warning("Please select a startup to apply with.");
      return;
    }
    if (!formData.applicantName.trim() || !formData.applicantEmail.trim()) {
      toast.warning("Please provide your name and contact email.");
      return;
    }
    if (!formData.requestedAmount.trim()) {
      toast.warning("Please specify your requested investment amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = selectedInvestor.startupInvestorId
        ? `${getBackendUrl()}/investors/startup/${selectedInvestor.startupInvestorId}/apply-investment`
        : `${getBackendUrl()}/investors/${selectedInvestor.investorId}/apply-investment`;

      const response = await fetch(
        endpoint,
        {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          credentials: "include",
          body: JSON.stringify({
            ...formData,
            startupId: Number(formData.startupId),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(
          data.message ||
            data.error ||
            `Failed to submit investment application (HTTP ${response.status})`
        );
      }

      const invName = `${selectedInvestor.firstname || ""} ${selectedInvestor.lastname || ""}`.trim();
      toast.success(`Investment application sent to ${invName || "the investor"}!`);
      setFormData((prev) => ({
        ...prev,
        requestedAmount: "",
        pitchMessage: "",
      }));
      setSelectedInvestor(null);
    } catch (err) {
      console.error("Error applying for investment:", err);
      toast.error(err.message || "Could not submit investment application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedInvestor && (
              <button
                type="button"
                onClick={() => setSelectedInvestor(null)}
                className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-200/70 transition-colors cursor-pointer"
                title="Back to Investors Directory"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-600" />
                {selectedInvestor
                  ? `Apply for Investment — ${selectedInvestor.firstname || ""} ${selectedInvestor.lastname || ""}`.trim()
                  : "Find Investors"}
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                {selectedInvestor
                  ? "Submit your startup pitch and funding request directly to this investor"
                  : "Browse registered investors and apply for funding for your startup"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {!selectedInvestor ? (
          <>
            {/* Search Bar */}
            <div className="px-6 py-3.5 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search investors by name, focus/bio, location, or email..."
                  className="w-full pl-9 pr-4 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
                {loading
                  ? "Loading..."
                  : `${filteredInvestors.length} investor${filteredInvestors.length === 1 ? "" : "s"} available`}
              </span>
            </div>

            {/* Investor List */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
                  <p className="text-sm text-gray-600">Loading investors directory...</p>
                </div>
              ) : filteredInvestors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="w-12 h-12 text-gray-300 mb-3" />
                  <h3 className="text-base font-semibold text-gray-800">No investors found</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {searchQuery
                      ? "Try adjusting your search keywords."
                      : "There are currently no investors registered in the directory."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredInvestors.map((inv) => {
                    const fullName = `${inv.firstname || ""} ${inv.lastname || ""}`.trim() || "Investor";
                    return (
                      <div
                        key={inv.investorId}
                        className="border border-gray-200 rounded-xl p-4 hover:border-emerald-300 hover:shadow-md transition-all bg-white flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="text-base font-bold text-gray-900">{fullName}</h3>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                inv.status === "Approved"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {inv.status === "Approved" && <CheckCircle2 className="w-3 h-3" />}
                              {inv.status || "Active"}
                            </span>
                          </div>

                          {inv.biography && (
                            <p className="text-xs text-gray-600 line-clamp-3 mb-3">{inv.biography}</p>
                          )}

                          <div className="space-y-1.5 text-xs text-gray-600 mb-4">
                            {inv.locationName && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="truncate">{inv.locationName}</span>
                              </div>
                            )}
                            {inv.emailAddress && (
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="truncate">{inv.emailAddress}</span>
                              </div>
                            )}
                            {inv.contactInformation && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="truncate">{inv.contactInformation}</span>
                              </div>
                            )}
                            {inv.website && (
                              <div className="flex items-center gap-1.5">
                                <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <a
                                  href={inv.website.startsWith("http") ? inv.website : `https://${inv.website}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:underline truncate"
                                >
                                  {inv.website}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={startups.length === 0}
                          onClick={() => setSelectedInvestor(inv)}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed"
                          title={
                            startups.length === 0
                              ? "Add a startup first to apply for investment"
                              : "Apply for investment"
                          }
                        >
                          <Send className="w-3.5 h-3.5" />
                          {startups.length === 0 ? "Add a Startup to Apply" : "Apply for Investment"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmitApplication} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Applying Startup / Venture <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={formData.startupId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startupId: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="" disabled>
                      Select your startup...
                    </option>
                    {startups.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.companyName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Funding Stage
                </label>
                <select
                  value={formData.fundingStage}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fundingStage: e.target.value }))}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Applicant Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.applicantName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, applicantName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Contact Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.applicantEmail}
                  onChange={(e) => setFormData((prev) => ({ ...prev, applicantEmail: e.target.value }))}
                  className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={formData.applicantPhone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, applicantPhone: e.target.value }))}
                  placeholder="+63 9XX XXX XXXX"
                  className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Requested Investment Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.requestedAmount}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, requestedAmount: e.target.value }))
                    }
                    placeholder="e.g. ₱500,000"
                    className="w-full pl-9 pr-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {suggestedAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, requestedAmount: amt }))}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-full border cursor-pointer transition-colors ${
                        formData.requestedAmount === amt
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Preferred Investment Terms
                </label>
                <select
                  value={formData.equityOrTerms}
                  onChange={(e) => setFormData((prev) => ({ ...prev, equityOrTerms: e.target.value }))}
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
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Pitch Summary &amp; Use of Funds
              </label>
              <textarea
                rows={4}
                value={formData.pitchMessage}
                onChange={(e) => setFormData((prev) => ({ ...prev, pitchMessage: e.target.value }))}
                placeholder="Briefly describe your traction, market opportunity, and how the investment will be used..."
                className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setSelectedInvestor(null)}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Investment Application
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
