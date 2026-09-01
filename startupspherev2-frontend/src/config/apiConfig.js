/**
 * Centralized API configuration helper for StartUpSphere frontend.
 * Resolves and sanitizes the backend URL.
 */
export const getBackendUrl = () => {
  const envUrl =
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_BASE_URL;

  if (!envUrl || envUrl.trim() === "" || envUrl === "undefined") {
    if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
      console.warn(
        "VITE_BACKEND_URL or VITE_API_BASE_URL is not configured in Vercel environment variables. Falling back to http://localhost:8080."
      );
    }
    return "http://localhost:8080";
  }
  // Strip trailing slash if present
  return envUrl.replace(/\/+$/, "");
};

