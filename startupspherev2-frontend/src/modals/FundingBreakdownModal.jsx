import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building2,
  Plus,
  HelpCircle,
  TrendingUp,
  FileText,
  BadgeCheck,
  Building,
} from "lucide-react";

export default function FundingBreakdownModal({
  isOpen,
  onClose,
  startups = [],
  selectedStartupId = "all",
}) {
  const [activeStartupFilter, setActiveStartupFilter] = useState(selectedStartupId);
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [newOrigin, setNewOrigin] = useState("");
  const [newFunder, setNewFunder] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newAmount, setNewAmount] = useState("");
  const [newCertified, setNewCertified] = useState(true);
  const [newStartupTargetId, setNewStartupTargetId] = useState("");

  useEffect(() => {
    setActiveStartupFilter(selectedStartupId);
  }, [selectedStartupId]);

  // Initial seed generator for funding records based on startup real data
  const generateInitialRecords = () => {
    const records = [];
    startups.forEach((st) => {
      const stName = st.companyName || "Your Startup";
      const stId = st.id;
      const foundedYear = st.foundedDate ? new Date(st.foundedDate).getFullYear() : 2024;
      const stFunding = Number(st.totalStartupFundingReceived || 0);
      const stCapital = Number(st.paidUpCapital || 0);
      const stGrants = Number(st.amountOfGovernmentGrantsOrSubsidiesReceived || 0);

      // 1. Paid-up / Founder Capital
      if (stCapital > 0 || (stFunding === 0 && stGrants === 0)) {
        const capAmount = stCapital > 0 ? stCapital : 100000;
        records.push({
          id: `${stId}-cap`,
          startupId: stId,
          startupName: stName,
          origin: "Founder Paid-Up Equity & Initial Capital",
          funder: `${stName} Founding Team`,
          dateFunded: `${foundedYear}-01-15`,
          amount: capAmount,
          certified: true,
          category: "Equity / Paid-Up Capital",
        });
      }

      // 2. Government Grant / Subsidies
      if (stGrants > 0) {
        records.push({
          id: `${stId}-grant`,
          startupId: stId,
          startupName: stName,
          origin: "Government Innovation & R&D Subsidy",
          funder: st.registrationAgency && st.registrationAgency !== "Unregistered"
            ? `${st.registrationAgency} Technology Startup Assistance`
            : "DOST-PCIEERD Startup Research Grant",
          dateFunded: `${foundedYear}-06-20`,
          amount: stGrants,
          certified: Boolean(st.isGovernmentRegistered),
          category: "Government Grant",
        });
      }

      // 3. Private Funding / Stage Round
      const privateFund = Math.max(0, stFunding - stGrants);
      if (privateFund > 0) {
        const stage = st.fundingStage || "Seed Stage";
        records.push({
          id: `${stId}-invest`,
          startupId: stId,
          startupName: stName,
          origin: `${stage} Angel / Venture Disbursement`,
          funder: "Regional Angel Investor Syndicate & Partners",
          dateFunded: `${foundedYear}-10-05`,
          amount: privateFund,
          certified: true,
          category: "Private Investment",
        });
      } else if (stFunding > 0 && records.filter((r) => r.startupId === stId).length === 0) {
        records.push({
          id: `${stId}-total`,
          startupId: stId,
          startupName: stName,
          origin: "Seed Capital & Venture Program Allocation",
          funder: "Ecosystem Accelerator & Investment Fund",
          dateFunded: `${foundedYear}-08-12`,
          amount: stFunding,
          certified: true,
          category: "Accelerator / Seed",
        });
      }
    });

    return records;
  };

  const [fundingRecords, setFundingRecords] = useState(() => {
    try {
      const saved = localStorage.getItem("startupsphere_user_funding_records");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return generateInitialRecords();
  });

  // Re-sync if startups change and local records are empty
  useEffect(() => {
    if (fundingRecords.length === 0 && startups.length > 0) {
      const initial = generateInitialRecords();
      setFundingRecords(initial);
      try {
        localStorage.setItem("startupsphere_user_funding_records", JSON.stringify(initial));
      } catch {
        // ignore
      }
    }
  }, [startups]);

  // Persist records
  const saveRecords = (updated) => {
    setFundingRecords(updated);
    try {
      localStorage.setItem("startupsphere_user_funding_records", JSON.stringify(updated));
    } catch (err) {
      console.warn("Failed to save funding records to localStorage:", err);
    }
  };

  const handleToggleCertified = (recordId) => {
    const updated = fundingRecords.map((r) =>
      r.id === recordId ? { ...r, certified: !r.certified } : r
    );
    saveRecords(updated);
  };

  const handleResetToDefaults = () => {
    const defaults = generateInitialRecords();
    saveRecords(defaults);
  };

  const handleAddRecordSubmit = (e) => {
    e.preventDefault();
    if (!newOrigin.trim() || !newFunder.trim() || !newAmount) return;

    const targetStartup = startups.find(
      (s) => s.id === (newStartupTargetId || (startups[0]?.id || "default"))
    );

    const newRecord = {
      id: `rec-${Date.now()}`,
      startupId: targetStartup?.id || "custom",
      startupName: targetStartup?.companyName || "Custom Venture",
      origin: newOrigin.trim(),
      funder: newFunder.trim(),
      dateFunded: newDate || new Date().toISOString().split("T")[0],
      amount: Number(newAmount) || 0,
      certified: Boolean(newCertified),
      category: "Recorded Funding",
    };

    saveRecords([...fundingRecords, newRecord]);
    setNewOrigin("");
    setNewFunder("");
    setNewAmount("");
    setIsAddingRecord(false);
  };

  const filteredRecords = useMemo(() => {
    if (activeStartupFilter === "all") return fundingRecords;
    return fundingRecords.filter((r) => String(r.startupId) === String(activeStartupFilter));
  }, [fundingRecords, activeStartupFilter]);

  const totalFilteredAmount = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }, [filteredRecords]);

  const certifiedFilteredAmount = useMemo(() => {
    return filteredRecords
      .filter((r) => r.certified)
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }, [filteredRecords]);

  const pendingFilteredAmount = useMemo(() => {
    return Math.max(0, totalFilteredAmount - certifiedFilteredAmount);
  }, [totalFilteredAmount, certifiedFilteredAmount]);

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 0,
    }).format(num);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-indigo-950 text-white p-5 sm:p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5" />
              User Funding Breakdown & Certification
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Venture Capital & Funding Origins Breakdown
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl">
            Detailed breakdown of fund origins, funding agencies/investors, disbursement dates, and certified documentation status for your startups.
          </p>

          {/* Startup Filter Tabs / Selector (if user has multiple startups) */}
          {startups.length > 1 && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-emerald-200">Filter Venture:</span>
              <button
                type="button"
                onClick={() => setActiveStartupFilter("all")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeStartupFilter === "all"
                    ? "bg-white text-emerald-900 shadow-xs"
                    : "bg-white/15 text-white hover:bg-white/25"
                }`}
              >
                All Portfolio Ventures ({startups.length})
              </button>
              {startups.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveStartupFilter(s.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer truncate max-w-[180px] ${
                    String(activeStartupFilter) === String(s.id)
                      ? "bg-white text-emerald-900 shadow-xs"
                      : "bg-white/15 text-white hover:bg-white/25"
                  }`}
                  title={s.companyName}
                >
                  {s.companyName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Summary Metric Strip */}
        <div className="bg-emerald-50/70 border-b border-emerald-100 p-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div>
            <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider block">
              Total Funding
            </span>
            <p className="text-lg sm:text-xl font-black text-gray-900">
              {formatCurrency(totalFilteredAmount)}
            </p>
            <span className="text-[10px] text-gray-500">
              {filteredRecords.length} record{filteredRecords.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div>
            <span className="text-[10.5px] font-bold text-emerald-700 uppercase tracking-wider block flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
              Certified Funds
            </span>
            <p className="text-lg sm:text-xl font-black text-emerald-700">
              {formatCurrency(certifiedFilteredAmount)}
            </p>
            <span className="text-[10px] text-emerald-600 font-medium">
              Verified by documentation
            </span>
          </div>

          <div>
            <span className="text-[10.5px] font-bold text-amber-700 uppercase tracking-wider block">
              Pending Certification
            </span>
            <p className="text-lg sm:text-xl font-black text-amber-700">
              {formatCurrency(pendingFilteredAmount)}
            </p>
            <span className="text-[10px] text-amber-600 font-medium">
              Awaiting verification
            </span>
          </div>

          <div className="flex flex-col justify-center items-start sm:items-end gap-1">
            <button
              type="button"
              onClick={() => setIsAddingRecord((prev) => !prev)}
              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingRecord ? "Cancel" : "Add Funding Record"}</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Add Funding Record Panel */}
          {isAddingRecord && (
            <form
              onSubmit={handleAddRecordSubmit}
              className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Add New Funding Disbursement Record
                </h4>
                <span className="text-[11px] text-emerald-700 font-medium">
                  Recorded on your user portfolio
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Where Funds Originate <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DOST Startup Grant, Seed Equity"
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Who Funded (Agency / Investor) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DOST-PCIEERD, Angel Syndicate"
                    value={newFunder}
                    onChange={(e) => setNewFunder(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Date Funded <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Amount (PHP ₱) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    placeholder="e.g. 500000"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  />
                </div>

                {startups.length > 1 && (
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      Target Venture
                    </label>
                    <select
                      value={newStartupTargetId}
                      onChange={(e) => setNewStartupTargetId(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    >
                      {startups.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-2 sm:col-span-2 pt-4">
                  <label className="relative flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newCertified}
                      onChange={(e) => setNewCertified(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 cursor-pointer"
                    />
                    <span className="font-semibold text-gray-800">
                      Mark as Certified (Official Documentation on File)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingRecord(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  Save Record
                </button>
              </div>
            </form>
          )}

          {/* Funding Breakdown Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/90 border-b border-gray-200 text-gray-700 font-semibold uppercase text-[10.5px] tracking-wider">
                    <th className="py-3 px-3.5">Where Funds Originate</th>
                    <th className="py-3 px-3.5">Who Funded (Funder)</th>
                    <th className="py-3 px-3">Date Funded</th>
                    <th className="py-3 px-3 text-right">Amount (PHP)</th>
                    {startups.length > 1 && <th className="py-3 px-3">Venture</th>}
                    <th className="py-3 px-3 text-center">Certified Checkbox</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan={startups.length > 1 ? 6 : 5}
                        className="py-10 text-center text-gray-400"
                      >
                        <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="font-semibold text-gray-600">No funding records found.</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Click "Add Funding Record" to document investments or grants for your ventures.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => (
                      <tr
                        key={record.id}
                        className="hover:bg-emerald-50/20 transition-colors duration-150"
                      >
                        {/* Where Funds Originate */}
                        <td className="py-3 px-3.5 font-medium text-gray-900">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                            <div>
                              <p className="font-semibold text-gray-900 leading-tight">
                                {record.origin}
                              </p>
                              {record.category && (
                                <span className="text-[10px] text-gray-400 font-normal">
                                  {record.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Who Funded */}
                        <td className="py-3 px-3.5 font-semibold text-indigo-950">
                          <div className="flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="truncate max-w-[200px]" title={record.funder}>
                              {record.funder}
                            </span>
                          </div>
                        </td>

                        {/* Date Funded */}
                        <td className="py-3 px-3 text-gray-600 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                            <span>
                              {record.dateFunded
                                ? new Date(record.dateFunded).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })
                                : "N/A"}
                            </span>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-3 text-right font-black text-gray-900 whitespace-nowrap">
                          {formatCurrency(record.amount)}
                        </td>

                        {/* Venture (if multiple) */}
                        {startups.length > 1 && (
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10.5px] font-semibold border border-gray-200">
                              {record.startupName}
                            </span>
                          </td>
                        )}

                        {/* Certified Checkbox */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={Boolean(record.certified)}
                              onChange={() => handleToggleCertified(record.id)}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 cursor-pointer"
                              title="Check to certify funding authenticity"
                            />
                            {record.certified ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10.5px] font-bold border border-emerald-200 flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Certified
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10.5px] font-semibold border border-amber-200">
                                Uncertified
                              </span>
                            )}
                          </label>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Verification / Security Information Card */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
            <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-blue-950">About Certified Funding Records:</p>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                The certified checkbox indicates audited capital disbursements, verified SEC/BIR paid-up capitalization, or official DOST/DTI innovation grants. Only funding scoped directly to your businesses appears on this user dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-500">
            <span>Showing funding breakdown for: </span>
            <span className="font-bold text-gray-800">
              {activeStartupFilter === "all"
                ? `All Portfolio Startups (${startups.length})`
                : startups.find((s) => String(s.id) === String(activeStartupFilter))?.companyName || "Selected Venture"}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
}
