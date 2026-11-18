import React, { useState, useEffect } from "react";
import { getBackendUrl, getAuthHeaders } from "../config/apiConfig";
import { toast } from "react-toastify";
import {
  X,
  DollarSign,
  Briefcase,
  Mail,
  Phone,
  User,
  MessageSquare,
  Send,
  Building,
  CheckCircle,
  HelpCircle,
} from "lucide-react";

export default function InvestmentInterestModal({
  isOpen,
  onClose,
  startup,
  currentUser,
}) {
  const [formData, setFormData] = useState({
    investorName: "",
    investorEmail: "",
    investorPhone: "",
    investorType: "Individual Investor / Angel",
    amountRange: "",
    processType: "General Investment Discussion & Inquiry",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Quick amount suggestions
  const suggestedAmounts = [
    "₱50,000",
    "₱100,000",
    "₱250,000",
    "₱500,000",
    "₱1,000,000+",
  ];

  // Auto-populate user details if available
  useEffect(() => {
    if (isOpen) {
      const storedUser = currentUser || (() => {
        try {
          const userStr = localStorage.getItem("user");
          return userStr ? JSON.parse(userStr) : null;
        } catch {
          return null;
        }
      })();

      const fullName = storedUser
        ? `${storedUser.firstname || storedUser.firstName || ""} ${
            storedUser.lastname || storedUser.lastName || ""
          }`.trim()
        : "";

      const email = storedUser?.email || "";

      setFormData((prev) => ({
        ...prev,
        investorName: prev.investorName || fullName,
        investorEmail: prev.investorEmail || email,
      }));
      setErrors({});
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !startup) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleAmountClick = (amount) => {
    setFormData((prev) => ({ ...prev, amountRange: amount }));
    if (errors.amountRange) {
      setErrors((prev) => ({ ...prev, amountRange: "" }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.investorName.trim()) {
      errs.investorName = "Your name or organization name is required.";
    }
    if (!formData.investorEmail.trim()) {
      errs.investorEmail = "A valid contact email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.investorEmail)) {
      errs.investorEmail = "Please enter a valid email address.";
    }
    if (!formData.amountRange.trim()) {
      errs.amountRange = "Please specify a proposed amount or range.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const headers = getAuthHeaders
        ? getAuthHeaders({ "Content-Type": "application/json" })
        : {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          };

      const response = await fetch(
        `${getBackendUrl()}/startups/${startup.id}/express-investment-interest`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(formData),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to submit interest (${response.status})`
        );
      }

      toast.success(
        `Investment interest successfully sent to ${startup.companyName}! The founders have been notified.`
      );

      // Reset optional message and proposed amount
      setFormData((prev) => ({
        ...prev,
        amountRange: "",
        message: "",
      }));

      onClose();
    } catch (err) {
      console.error("Error submitting investment interest:", err);
      toast.error(err.message || "Could not submit investment interest. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 py-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <DollarSign className="w-6 h-6 text-blue-100" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Express Investment Interest</h2>
              <p className="text-xs text-blue-100 mt-0.5">
                Propose an investment or strategic discussion with{" "}
                <span className="font-semibold text-white">
                  {startup.companyName}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Info callout */}
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-950">
            <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Both <strong>investors</strong> and <strong>business owners</strong> are
              welcome to invest of their means. Submitting this form sends an
              instant in-app notification and email to the business founders with
              your discussion details.
            </p>
          </div>

          {/* Investor Name & Email (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <User size={13} className="text-gray-400" />
                Your Full Name / Entity *
              </label>
              <input
                type="text"
                name="investorName"
                value={formData.investorName}
                onChange={handleChange}
                placeholder="e.g., Juan Dela Cruz"
                className={`w-full px-3 py-2 text-sm text-gray-900 bg-white placeholder-gray-400 border rounded-lg focus:ring-2 outline-none transition-all ${
                  errors.investorName
                    ? "border-red-400 focus:ring-red-200 bg-red-50/30"
                    : "border-gray-300 focus:ring-blue-500/20 focus:border-blue-600"
                }`}
                style={{ color: "#111827", backgroundColor: "#ffffff" }}
              />
              {errors.investorName && (
                <p className="text-[11px] text-red-600 mt-0.5">{errors.investorName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Mail size={13} className="text-gray-400" />
                Contact Email *
              </label>
              <input
                type="email"
                name="investorEmail"
                value={formData.investorEmail}
                onChange={handleChange}
                placeholder="e.g., juan@example.com"
                className={`w-full px-3 py-2 text-sm text-gray-900 bg-white placeholder-gray-400 border rounded-lg focus:ring-2 outline-none transition-all ${
                  errors.investorEmail
                    ? "border-red-400 focus:ring-red-200 bg-red-50/30"
                    : "border-gray-300 focus:ring-blue-500/20 focus:border-blue-600"
                }`}
                style={{ color: "#111827", backgroundColor: "#ffffff" }}
              />
              {errors.investorEmail && (
                <p className="text-[11px] text-red-600 mt-0.5">{errors.investorEmail}</p>
              )}
            </div>
          </div>

          {/* Phone Number & Investor Type (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Phone size={13} className="text-gray-400" />
                Contact Phone
              </label>
              <input
                type="tel"
                name="investorPhone"
                value={formData.investorPhone}
                onChange={handleChange}
                placeholder="e.g., +63 912 345 6789"
                className="w-full px-3 py-2 text-sm text-gray-900 bg-white placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
                style={{ color: "#111827", backgroundColor: "#ffffff" }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Building size={13} className="text-gray-400" />
                I am investing as:
              </label>
              <select
                name="investorType"
                value={formData.investorType}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
                style={{ color: "#111827", backgroundColor: "#ffffff" }}
              >
                <option value="Individual Investor / Angel">Individual Investor / Angel</option>
                <option value="Business Owner / Enterprise">Business Owner / Enterprise</option>
                <option value="Venture Capital / Investment Fund">Venture Capital / Fund</option>
                <option value="Government / Public Agency">Government Agency</option>
                <option value="Syndicate / Family Office">Family Office / Syndicate</option>
                <option value="Peer Startup / Strategic Backer">Peer Startup / Strategic</option>
                <option value="Other Backer">Other Backer</option>
              </select>
            </div>
          </div>

          {/* Proposed Amount Range */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <DollarSign size={13} className="text-gray-400" />
                Proposed Investment Amount / Capital *
              </span>
              <span className="text-[11px] text-gray-400 font-normal">
                Philippine Pesos (₱)
              </span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-700 text-sm font-semibold">
                ₱
              </div>
              <input
                type="text"
                name="amountRange"
                value={formData.amountRange}
                onChange={handleChange}
                placeholder="e.g., 50,000 or 100,000 - 500,000"
                className={`w-full pl-8 pr-3 py-2 text-sm text-gray-900 bg-white placeholder-gray-400 border rounded-lg focus:ring-2 outline-none transition-all font-medium ${
                  errors.amountRange
                    ? "border-red-400 focus:ring-red-200 bg-red-50/30"
                    : "border-gray-300 focus:ring-blue-500/20 focus:border-blue-600"
                }`}
                style={{ color: "#111827", backgroundColor: "#ffffff" }}
              />
            </div>
            {errors.amountRange && (
              <p className="text-[11px] text-red-600 mt-0.5">{errors.amountRange}</p>
            )}

            {/* Quick amount suggestion chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-gray-500">Quick select:</span>
              {suggestedAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleAmountClick(amt)}
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                    formData.amountRange === amt
                      ? "bg-blue-600 text-white border-blue-600 font-medium"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 font-medium"
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>

          {/* Process Type / Discussion Agenda */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <Briefcase size={13} className="text-gray-400" />
              What investment process do you want to discuss? *
            </label>
            <select
              name="processType"
              value={formData.processType}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
              style={{ color: "#111827", backgroundColor: "#ffffff" }}
            >
              <option value="General Investment Discussion & Inquiry">
                General Investment Discussion & Inquiry
              </option>
              <option value="Direct Equity & Valuation Pitch">
                Direct Equity & Valuation Pitch
              </option>
              <option value="Convertible Note / SAFE Discussion">
                Convertible Note / SAFE Discussion
              </option>
              <option value="Debt / Revenue-Share Financing">
                Debt / Revenue-Share Financing
              </option>
              <option value="Strategic Partnership & Capital Synergies">
                Strategic Partnership & Capital Synergies
              </option>
              <option value="Co-Development & Grants Matching">
                Co-Development & Grants Matching
              </option>
              <option value="Formal Due Diligence & Term Sheet Review">
                Formal Due Diligence & Term Sheet Review
              </option>
            </select>
          </div>

          {/* Message / Proposed Terms */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <MessageSquare size={13} className="text-gray-400" />
              Message & Discussion Notes (Optional)
            </label>
            <textarea
              name="message"
              rows={3}
              value={formData.message}
              onChange={handleChange}
              placeholder="Introduce your background, why you're interested in funding this business, or preferred meeting schedule..."
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all resize-none"
              style={{ color: "#111827", backgroundColor: "#ffffff" }}
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 rounded-lg shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5 cursor-pointer border-0"
              style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-white">Sending Interest...</span>
                </>
              ) : (
                <>
                  <Send size={13} className="text-white" />
                  <span className="text-white font-medium">Send Investment Interest</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
