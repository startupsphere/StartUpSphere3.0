import { useState } from "react";
import { motion } from "framer-motion";
import { getBackendUrl } from "../config/apiConfig";
import { formatErrorMessage } from "../utils/errorUtils";
import ForgotPassword from "./ForgotPassword";
import { Mail, Lock, Eye, EyeOff, X, ShieldCheck, Sparkles } from "lucide-react";

export default function Login({ closeModal, openRegister, onLoginSuccess, initialEmail = "", initialForgotPassword = false }) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(initialForgotPassword);

  if (showForgotPassword) {
    return (
      <ForgotPassword
        closeModal={closeModal}
        openLogin={(prefilledEmail) => {
          if (prefilledEmail) setEmail(prefilledEmail);
          setShowForgotPassword(false);
        }}
        initialEmail={email}
      />
    );
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(
        `${backendUrl}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        }
      );

      const parseJSON = async (res) => {
        const text = await res.text();
        try {
          return text ? JSON.parse(text) : {};
        } catch (err) {
          throw new Error("Invalid response from server. Please verify that the backend is running.");
        }
      };

      if (!response.ok) {
        const errorData = await parseJSON(response).catch(() => ({}));
        throw new Error(errorData.description || errorData.error || "Failed to login");
      } else {
        const data = await parseJSON(response);
        if (data && data.token) {
          localStorage.setItem("token", data.token);
        }
        
        const userResponse = await fetch(
          `${backendUrl}/users/me`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.token}`,
            },
            credentials: "include",
          }
        );

        if (!userResponse.ok) {
          throw new Error("Failed to fetch user details");
        }

        const userData = await parseJSON(userResponse);
        setSuccess(true);
        setTimeout(() => {
          onLoginSuccess(userData);
          closeModal();
        }, 1200);
      }
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-4xl mx-auto overflow-hidden bg-white rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.35)] my-auto max-h-[92dvh] flex flex-col border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col md:flex-row h-auto md:min-h-[520px]">
          {/* Left Side - Brand Section */}
          <div className="hidden md:flex md:w-5/12 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 p-8 lg:p-10 flex-col justify-between relative overflow-hidden text-white">
            {/* Ambient decorative glowing orbs */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/15 rounded-full -mr-28 -mt-28 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full -ml-28 -mb-28 blur-2xl pointer-events-none" />

            {/* Header & Brand */}
            <div className="relative z-10">
              <div className="flex items-center mb-8">
                <img
                  src="/StartUpSphere_logo_white.png"
                  alt="StartUpSphere"
                  className="h-12 w-auto object-contain filter drop-shadow"
                />
              </div>

              {/* Title & Description */}
              <div className="space-y-2 mb-8">
                <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-snug">
                  Welcome Back
                </h1>
                <p className="text-blue-100/80 text-xs sm:text-sm leading-relaxed">
                  Log in to access your startup dashboard, rankings, ecosystem map, and verified analytics.
                </p>
              </div>

              {/* Modern Feature Cards */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 shadow-xs">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/30 text-blue-200 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-blue-200" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-xs">Secure Access</p>
                    <p className="text-blue-200/70 text-[11px]">Role-based encrypted session</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 shadow-xs">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/30 text-indigo-200 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-indigo-200" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-xs">Smart AI Insights</p>
                    <p className="text-blue-200/70 text-[11px]">Direct data assistance & directory</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Tagline */}
            <div className="relative z-10 pt-6 border-t border-white/10">
              <p className="text-xs text-blue-200/75 italic">
                "Bridging Startups, HEIs, and Government for a Unified Ecosystem"
              </p>
            </div>
          </div>

          {/* Right Side - Form Section */}
          <div className="w-full md:w-7/12 bg-white p-6 sm:p-10 flex flex-col justify-center relative overflow-y-auto">
            {/* Close button */}
            <button
              className="absolute top-4 sm:top-5 right-4 sm:right-5 p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors border-0 bg-transparent cursor-pointer"
              onClick={closeModal}
              aria-label="Close login modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Mobile Header Brand */}
            <div className="md:hidden flex items-center gap-2 mb-4">
              <img src="/StartUpSphere_logo.png" alt="StartUpSphere" className="h-7 w-7 object-contain" />
              <span className="font-bold text-gray-900 text-base">StartUp<span className="text-blue-600">Sphere</span></span>
            </div>

            <form onSubmit={handleLogin} className="space-y-5 max-w-md w-full mx-auto">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Sign In</h2>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">Enter your credentials to access your account</p>
              </div>

              {/* Success message */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3"
                >
                  <div className="flex-shrink-0">
                    <motion.svg
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.15, duration: 0.3 }}
                      className="h-6 w-6 text-green-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </motion.svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-800">Login successful!</p>
                    <p className="text-xs text-green-700 mt-0.5">Redirecting to your dashboard...</p>
                  </div>
                </motion.div>
              )}

              {success ? null : (
                <>
                  {/* Email Field */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="email"
                        className="block w-full px-3.5 py-2.5 pl-10 text-sm text-gray-900 placeholder-gray-400 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-2xs transition-all"
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label
                        htmlFor="password"
                        className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
                      >
                        Password
                      </label>
                      <button 
                        type="button" 
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors border-0 p-0 bg-transparent cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="password"
                        className="block w-full px-3.5 py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-2xs transition-all"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-2 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors border-0 bg-transparent cursor-pointer"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Error message */}
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <svg
                          className="h-4 w-4 text-red-500"
                          xmlns="http://www.w3.org/2000/svg"
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
                      <p className="text-xs font-medium text-red-700 leading-normal">{error}</p>
                    </motion.div>
                  )}

                  {/* Sign In button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 cursor-pointer text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 disabled:opacity-60 disabled:cursor-not-allowed border-0 flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4 text-white"
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
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <span>Sign In</span>
                    )}
                  </button>

                  {/* Register link */}
                  <div className="text-center pt-2">
                    <p className="text-xs sm:text-sm text-gray-500">
                      Don't have an account?{" "}
                      <button
                        onClick={openRegister}
                        type="button"
                        className="font-semibold text-blue-600 hover:text-blue-700 transition-colors hover:underline bg-transparent p-0 border-0 cursor-pointer"
                      >
                        Create one now
                      </button>
                    </p>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}