import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle, 
  ShieldCheck 
} from "lucide-react";
import { getBackendUrl } from "../config/apiConfig";

export default function ForgotPassword({ closeModal, openLogin, initialEmail = "" }) {
  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: New Password, 4: Success
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // 60-second cooldown timer for resending code
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  // Step 1: Send verification code to email via Brevo
  const handleSendCode = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`${getBackendUrl()}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to send verification code.");
      }

      setSuccessMessage("Verification code has been sent to your email!");
      setResendTimer(60);
      setStep(2);
    } catch (err) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify the 6-digit code sent by Brevo
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (!cleanCode || cleanCode.length < 4) {
      setError("Please enter the verification code sent to your email.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${getBackendUrl()}/auth/verify-reset-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          code: cleanCode,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || "Invalid or expired verification code.");
      }

      setSuccessMessage("Code verified! You can now set your new password.");
      setStep(3);
    } catch (err) {
      setError(err.message || "Invalid verification code. Please check your email and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set and confirm new password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${getBackendUrl()}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          newPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to reset password.");
      }

      setStep(4);
    } catch (err) {
      setError(err.message || "Could not reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToLogin = () => {
    if (openLogin) {
      openLogin(email);
    } else if (closeModal) {
      closeModal();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-4xl mx-auto overflow-hidden bg-white rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col md:flex-row min-h-[520px]">
          {/* Left Side - Brand Section */}
          <div className="md:w-2/5 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-32 -mt-32 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/10 rounded-full -ml-28 -mb-28 blur-xl"></div>

            <div className="relative z-10 space-y-6">
              <div className="flex items-center">
                <img
                  src="/StartUpSphere_logo_white.png"
                  alt="StartUpSphere Logo"
                  className="h-12 w-auto object-contain filter drop-shadow"
                />
              </div>

              <div className="space-y-2 pt-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Password Recovery
                </h2>
                <p className="text-blue-100/80 text-sm leading-relaxed">
                  Verify your identity securely with a one-time code sent directly to your registered email.
                </p>
              </div>

              {/* Progress Steps Indicators */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    step > 1 ? "bg-emerald-400 text-slate-900" : step === 1 ? "bg-white text-blue-800 ring-4 ring-white/20" : "bg-white/20 text-white"
                  }`}>
                    {step > 1 ? "✓" : "1"}
                  </div>
                  <span className={step === 1 ? "font-semibold text-white" : "text-blue-200/70"}>
                    Account Email
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    step > 2 ? "bg-emerald-400 text-slate-900" : step === 2 ? "bg-white text-blue-800 ring-4 ring-white/20" : "bg-white/20 text-white"
                  }`}>
                    {step > 2 ? "✓" : "2"}
                  </div>
                  <span className={step === 2 ? "font-semibold text-white" : "text-blue-200/70"}>
                    Confirm Brevo Code
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    step >= 4 ? "bg-emerald-400 text-slate-900" : step === 3 ? "bg-white text-blue-800 ring-4 ring-white/20" : "bg-white/20 text-white"
                  }`}>
                    {step >= 4 ? "✓" : "3"}
                  </div>
                  <span className={step >= 3 ? "font-semibold text-white" : "text-blue-200/70"}>
                    Set New Password
                  </span>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-6 border-t border-blue-400/20 text-xs text-blue-200/70 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Protected by 256-bit secure account confirmation</span>
            </div>
          </div>

          {/* Right Side - Form Section */}
          <div className="md:w-3/5 bg-white p-8 sm:p-12 flex flex-col justify-center relative">
            {/* Close button */}
            <button
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors border-0 bg-transparent cursor-pointer"
              onClick={closeModal}
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Error Banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-sm"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                <span className="flex-1 leading-snug">{error}</span>
              </motion.div>
            )}

            {/* Success Banner */}
            {successMessage && step !== 4 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-800 text-sm"
              >
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
                <span className="flex-1 leading-snug">{successMessage}</span>
              </motion.div>
            )}

            {/* STEP 1: Enter email */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <div className="mb-6">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Forgot your password?
                  </h3>
                  <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">
                    Enter the email address registered with your account. We'll send an email with a 6-digit verification code to confirm it's you.
                  </p>
                </div>

                <form onSubmit={handleSendCode} className="space-y-5">
                  <div>
                    <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        id="reset-email"
                        type="email"
                        placeholder="you@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="block w-full px-4 py-3 pl-11 text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed border-0 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending code...</span>
                      </>
                    ) : (
                      <span>Send Verification Code</span>
                    )}
                  </button>

                  <div className="pt-3 text-center">
                    <button
                      type="button"
                      onClick={handleReturnToLogin}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors bg-transparent border-0 cursor-pointer p-0"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Login</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 2: Input Brevo verification code */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <div className="mb-6">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Confirm your account
                  </h3>
                  <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">
                    We sent a 6-digit confirmation code via Brevo to{" "}
                    <span className="font-semibold text-gray-800">{email}</span>.
                    Please enter the code to verify that this is your account.
                  </p>
                </div>

                <form onSubmit={handleVerifyCode} className="space-y-5">
                  <div>
                    <label htmlFor="reset-code" className="block text-sm font-medium text-gray-700 mb-1.5">
                      6-Digit Verification Code
                    </label>
                    <input
                      id="reset-code"
                      type="text"
                      maxLength={6}
                      autoFocus
                      placeholder="123456"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                      required
                      className="block w-full px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] font-bold text-gray-900 placeholder-gray-300 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none"
                    />
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className="text-gray-500">Code expires in 10 minutes</span>
                      <button
                        type="button"
                        onClick={() => handleSendCode()}
                        disabled={resendTimer > 0 || loading}
                        className="font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed bg-transparent border-0 cursor-pointer p-0"
                      >
                        {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend code"}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || code.trim().length < 4}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed border-0 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying code...</span>
                      </>
                    ) : (
                      <span>Confirm & Continue</span>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setSuccessMessage(null);
                        setStep(1);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-transparent border-0 cursor-pointer p-0"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Use a different email</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleReturnToLogin}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-transparent border-0 cursor-pointer p-0"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 3: Change Password */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <div className="mb-6">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Create new password
                  </h3>
                  <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">
                    Your account has been confirmed. Enter and confirm your new secure password below.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="block w-full px-4 py-3 pl-11 pr-11 text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="block w-full px-4 py-3 pl-11 pr-11 text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="mt-1.5 text-xs text-red-600">Passwords do not match</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !newPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed border-0 cursor-pointer mt-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Updating password...</span>
                      </>
                    ) : (
                      <span>Save New Password</span>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* STEP 4: Success confirmation */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Password Reset Successful!
                </h3>
                <p className="text-gray-600 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
                  Your password has been changed. You can now log into your StartupSphere account with your new credentials.
                </p>

                <div className="mt-8">
                  <button
                    type="button"
                    onClick={handleReturnToLogin}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-md border-0 cursor-pointer"
                  >
                    Proceed to Login
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

