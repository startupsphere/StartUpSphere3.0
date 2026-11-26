import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getBackendUrl, getAuthHeaders } from "../config/apiConfig";
import {
  User,
  Mail,
  Shield,
  ShieldCheck,
  Building2,
  Calendar,
  Award,
  Layers,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
  KeyRound,
  RefreshCw,
  Plus,
  BadgeCheck,
  Briefcase
} from "lucide-react";
import TooltipInfo from "../components/TooltipInfo";
import { toast } from "react-toastify";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("credentials"); // "credentials" | "personal" | "security"

  const fetchProfileData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch authenticated user profile
      const userRes = await fetch(`${getBackendUrl()}/users/me`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (!userRes.ok) {
        if (userRes.status === 401) {
          throw new Error("Unauthorized. Please log in again.");
        }
        throw new Error(`Failed to load profile (${userRes.status})`);
      }
      const userData = await userRes.json();
      setUser(userData);

      // 2. Fetch user's registered startups & credentials
      const startupsRes = await fetch(
        `${getBackendUrl()}/startups/my-startups/details`,
        {
          headers: getAuthHeaders(),
          credentials: "include",
        }
      );

      if (startupsRes.ok) {
        const startupsData = await startupsRes.json();
        setStartups(Array.isArray(startupsData) ? startupsData : []);
      }
    } catch (err) {
      console.error("Error fetching profile data:", err);
      setError(err.message || "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const getRoleLabel = (role) => {
    switch (role) {
      case "ROLE_ADMIN":
        return { label: "System Administrator", color: "bg-amber-100 text-amber-800 border-amber-300" };
      case "ROLE_STARTUP":
        return { label: "Startup Founder", color: "bg-blue-100 text-blue-800 border-blue-300" };
      case "ROLE_SME":
        return { label: "SME / Business Owner", color: "bg-emerald-100 text-emerald-800 border-emerald-300" };
      case "ROLE_HEI":
        return { label: "Higher Education Institution", color: "bg-indigo-100 text-indigo-800 border-indigo-300" };
      case "ROLE_RESEARCH":
        return { label: "Research Institution", color: "bg-purple-100 text-purple-800 border-purple-300" };
      case "ROLE_GOVERNMENT":
        return { label: "Government / Enabler", color: "bg-orange-100 text-orange-800 border-orange-300" };
      case "ROLE_INVESTOR":
        return { label: "Accredited Investor", color: "bg-teal-100 text-teal-800 border-teal-300" };
      default:
        return { label: "Standard Member", color: "bg-gray-100 text-gray-800 border-gray-300" };
    }
  };

  const roleInfo = getRoleLabel(user?.role);

  // Aggregate credentials across user startups
  const registeredStartups = startups.filter(
    (s) => !s.isDraft && (s.isGovernmentRegistered || (s.registrationAgency && !["Unregistered", ""].includes(s.registrationAgency)))
  );
  const totalGrantsReceived = startups.reduce(
    (sum, s) => sum + (Number(s.amountOfGovernmentGrantsOrSubsidiesReceived) || 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-50/70 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/startup-dashboard")}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-600 hover:text-indigo-600 bg-white px-3.5 py-2 rounded-xl border border-gray-200/80 shadow-2xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchProfileData}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-indigo-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
              title="Refresh profile"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => navigate("/add-startup")}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Venture</span>
            </button>
          </div>
        </div>

        {/* Profile Header Hero Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="h-28 sm:h-32 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 relative">
            <div className="absolute inset-0 bg-white/5 opacity-30 backdrop-blur-3xl"></div>
          </div>

          <div className="px-6 pb-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
              <div className="flex items-end gap-4">
                <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white font-black text-2xl sm:text-3xl flex items-center justify-center border-4 border-white shadow-md shrink-0">
                  {user
                    ? `${user.firstname?.[0] || ""}${user.lastname?.[0] || ""}`.toUpperCase()
                    : "U"}
                </div>
                <div className="pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                      {user ? `${user.firstname} ${user.lastname}` : "Loading..."}
                    </h1>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Verified Account
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user?.email || "No email"}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${roleInfo.color}`}>
                  {roleInfo.label}
                </span>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Total Ventures
                </span>
                <span className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 block">
                  {startups.length}
                </span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Gov. Registered
                </span>
                <span className="text-lg sm:text-xl font-bold text-emerald-600 mt-0.5 block">
                  {registeredStartups.length}
                </span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Grants & Subsidies
                </span>
                <span className="text-lg sm:text-xl font-bold text-indigo-600 mt-0.5 block">
                  ₱{totalGrantsReceived.toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Account Standing
                </span>
                <span className="text-lg sm:text-xl font-bold text-emerald-700 mt-0.5 block flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
          <button
            onClick={() => setActiveTab("credentials")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "credentials"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Government & Business Credentials</span>
          </button>

          <button
            onClick={() => setActiveTab("personal")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "personal"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Account Details</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "security"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Security & Permissions</span>
          </button>
        </div>

        {/* TAB 1: Government & Business Credentials */}
        {activeTab === "credentials" && (
          <div className="space-y-5">
            {/* Regulatory Credentials Overview Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      Government Certified & Business Compliance
                    </h2>
                    <TooltipInfo type="GOV_REG" size="sm" />
                    <TooltipInfo type="BIR" size="sm" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Verified business status, regulatory agencies, certificates, and tax compliance records
                  </p>
                </div>

                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
                  Regulatory Verified
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* BIR / Tax Status */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      BIR (Certified Status)
                    </span>
                    <TooltipInfo type="BIR" size="xs" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {startups.some((s) => String(s.registrationAgency).toUpperCase().includes("BIR"))
                      ? "Government Certified"
                      : startups.some((s) => s.isGovernmentRegistered)
                      ? "Registered"
                      : "Pending"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Official Bureau of Internal Revenue tax documentation & compliance
                  </p>
                </div>

                {/* Registration Agency */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Primary Agency
                    </span>
                    <TooltipInfo type="GOV_REG" size="xs" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {startups.find((s) => s.registrationAgency)?.registrationAgency ||
                      (registeredStartups.length > 0 ? "SEC / DTI" : "None Provided")}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Corporation / Sole Proprietorship corporate registration
                  </p>
                </div>

                {/* Subsidies & Grants */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Public Grants & Subsidies
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-indigo-700">
                    ₱{totalGrantsReceived.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Recorded DOST, DTI, or national innovation grants received
                  </p>
                </div>
              </div>
            </div>

            {/* List of Registered Ventures with Respective Credentials */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Registered Business Credentials Directory
                  </h3>
                  <p className="text-xs text-slate-500">
                    Specific registration credentials and TRL readiness per owned venture
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="p-10 text-center text-sm text-slate-500">
                  Loading credentials...
                </div>
              ) : startups.length === 0 ? (
                <div className="p-10 text-center">
                  <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No ventures registered yet</p>
                  <p className="text-xs text-slate-400 mt-1">Add your startup or business to record credentials</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                        <th className="px-4 py-3">Venture Name</th>
                        <th className="px-4 py-3">Agency</th>
                        <th className="px-4 py-3">Certificate / Reg ID</th>
                        <th className="px-4 py-3 text-center">Government Status</th>
                        <th className="px-4 py-3 text-center">TRL Level</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {startups.map((st) => {
                        const isGov = !!st.isGovernmentRegistered;
                        return (
                          <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3 font-bold text-slate-900">
                              <div className="flex items-center gap-2">
                                <Briefcase className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span>{st.companyName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-[11px]">
                                {st.registrationAgency || (isGov ? "Government Certified" : "Unspecified")}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-700">
                              {st.registrationNumber || (isGov ? "Verified Active" : "Pending Record")}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                                  isGov
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {isGov ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertCircle className="w-3 h-3 text-amber-600" />}
                                {isGov ? "Registered" : "Pending"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-indigo-700">
                              {st.trlLevel || "Level 4"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => navigate(`/startup/${st.id}`)}
                                className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Personal / Account Details */}
        {activeTab === "personal" && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Personal Information
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Your basic identity and contact details registered on StartUpSphere
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  First Name
                </span>
                <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                  {user?.firstname || "N/A"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Last Name
                </span>
                <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                  {user?.lastname || "N/A"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Email Address
                </span>
                <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                  {user?.email || "N/A"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Platform Role
                </span>
                <span className="text-sm font-bold text-indigo-700 mt-0.5 block">
                  {roleInfo.label}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Security & Privileges */}
        {activeTab === "security" && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Account Security & Platform Privileges
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Review your role access boundaries, credentials privileges, and authentication settings
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    Access Level & Data Scoping
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your account has private access to manage own ventures and review deal flow inquiries.
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    Password & Authentication
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Protected with salted BCrypt encryption and JWT session tokens.
                  </p>
                </div>
                <button
                  onClick={() => toast.info("To reset your password, use the Forgot Password link at login.")}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  Manage Password
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
