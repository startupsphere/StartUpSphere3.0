import { getBackendUrl, getAuthHeaders } from "../config/apiConfig";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function Verification({ 
  setVerificationModal, 
  setSelectedTab, 
  startupId, 
  contactEmail, 
  resetForm,
  initialDevCode = null,
  isInitialSandbox = false 
}) {
  const [verificationCode, setVerificationCode] = useState(initialDevCode || "");
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [devCode, setDevCode] = useState(initialDevCode);
  const [isSandbox, setIsSandbox] = useState(isInitialSandbox);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleVerify = async () => {
    const cleanCode = verificationCode.trim();
    if (!cleanCode || cleanCode.length < 4) {
      toast.error("Please enter a valid verification code (at least 4 digits).");
      setError("Please enter a valid verification code (at least 4 digits).");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const response = await fetch(`${getBackendUrl()}/startups/verify-email`, {
        method: "POST",
        headers: getAuthHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          startupId,
          email: contactEmail,
          code: cleanCode,
        }),
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Email verified successfully!");
        setVerificationModal(false);
        if (setSelectedTab) {
          setSelectedTab("Upload Data");
        }
      } else {
        const errorData = await response.json();
        toast.error(`Verification failed: ${errorData.message || "Invalid code"}`);
        setError(errorData.message || "Invalid code");
      }
    } catch (error) {
      console.error("Error verifying email:", error);
      toast.error("An error occurred while verifying the email.");
      setError("An error occurred while verifying the email.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSendCode = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/startups/send-verification-email`, {
        method: "POST",
        headers: getAuthHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          startupId,
          email: contactEmail,
        }),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.sandbox && data.devCode) {
          setIsSandbox(true);
          setDevCode(data.devCode);
          toast.info(`Sandbox Mode: Gmail not configured in .env. Test code: ${data.devCode}`, {
            autoClose: 10000,
          });
        } else {
          setIsSandbox(false);
          setDevCode(null);
          toast.success("Verification code sent to your email!");
        }
        setResendTimer(60);
        setCanResend(false);
      } else {
        const errorData = await response.json();
        toast.error(`Failed to send code: ${errorData.error || errorData.message || "Try again"}`);
      }
    } catch (error) {
      console.error("Error sending verification code:", error);
      toast.error("An error occurred while sending the verification code.");
    }
  };

  const handleVerifyLater = () => {
    setVerificationModal(false);
    if (setSelectedTab) {
      setSelectedTab("Upload Data");
    }
    if (resetForm) {
      resetForm();
    }
    toast.info("Verification postponed. You can verify later from the dashboard.");
  };

  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Verify Your Email</h2>
        <p className="text-sm text-gray-600 mb-4">
          A verification code has been sent to <span className="font-semibold text-gray-800">{contactEmail}</span>. Please enter the code below.
        </p>

        {/* Sandbox Notice Banner (if Gmail is not configured in backend .env) */}
        {isSandbox && devCode && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
            <div className="font-semibold flex items-center gap-1.5 mb-1 text-amber-800">
              <svg className="w-4 h-4 text-amber-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Development Sandbox Mode</span>
            </div>
            <p className="text-amber-800 mb-2 leading-relaxed">
              Gmail credentials are not configured in <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">.env</code>. To deliver real emails, set <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">MAIL_USERNAME</code> and <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">MAIL_PASSWORD</code> in <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">backend/.env</code>.
            </p>
            <div className="flex items-center gap-2 pt-1 border-t border-amber-200/60">
              <span className="font-medium">Test Code:</span>
              <button
                type="button"
                onClick={() => {
                  setVerificationCode(devCode);
                  setError("");
                }}
                className="font-mono font-bold text-sm bg-white hover:bg-amber-100 text-amber-950 px-2.5 py-1 rounded border border-amber-300 shadow-sm cursor-pointer transition-colors"
                title="Click to auto-fill this code"
              >
                {devCode} <span className="text-xs font-normal text-amber-700 underline ml-1">(click to fill)</span>
              </button>
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-gray-700">Verification Code</label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            value={verificationCode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 6);
              setVerificationCode(val);
              if (error) setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && verificationCode.trim().length >= 4 && !isVerifying) {
                handleVerify();
              }
            }}
            placeholder="Enter verification code"
            className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-center text-lg tracking-widest font-mono font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
        
        {/* Resend Code Section */}
        <div className="mb-4 flex items-center justify-between bg-gray-50 p-3 rounded-md">
          <span className="text-sm text-gray-600">
            {!canResend ? (
              <>Didn't receive the code? Resend in <span className="font-semibold text-blue-600">{resendTimer}s</span></>
            ) : (
              <>Didn't receive the code?</>
            )}
          </span>
          <button
            type="button"
            className={`text-sm font-medium px-3 py-1 rounded-md transition-all duration-200 ${
              canResend
                ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            onClick={handleSendCode}
            disabled={!canResend}
          >
            Resend Code
          </button>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            onClick={handleVerifyLater}
            disabled={isVerifying}
          >
            Verify Later
          </button>
          <button
            type="button"
            className="bg-[#1D3557] text-white px-5 py-2 rounded-md hover:bg-[#16324f] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[110px] justify-center text-sm font-medium"
            onClick={handleVerify}
            disabled={isVerifying || verificationCode.trim().length < 4}
          >
            {isVerifying ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Verify</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}